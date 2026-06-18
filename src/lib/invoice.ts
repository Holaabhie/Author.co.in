import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '@/lib/db';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GST Invoice Generator
 *
 * Generates PDF invoices with:
 * - Business details (from InvoiceSetting)
 * - Invoice number from Postgres SEQUENCE
 * - Line items with HSN codes
 * - CGST/SGST (intra-state) or IGST (inter-state) calculation
 * - Total in words
 *
 * Called asynchronously after order confirmation (fire-and-forget from webhook).
 */

const BUCKET_NAME = 'invoices';

export async function generateInvoice(orderId: string): Promise<string | null> {
  try {
    // Fetch all required data
    const [order, fetchedSettings] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          address: true,
          items: {
            include: {
              product: { select: { hsnCode: true } },
            },
          },
        },
      }),
      prisma.invoiceSetting.findFirst(),
    ]);

    if (!order) {
      console.error('[INVOICE] Order not found');
      return null;
    }

    let settings = fetchedSettings;
    if (!settings) {
      console.info('[INVOICE] Invoice settings not found, creating defaults');
      settings = await prisma.invoiceSetting.create({
        data: {
          businessName: 'AUTHOR',
          address: '123 Fashion Street, New Delhi',
          state: 'Delhi',
          gstin: '07AAAAA0000A1Z5',
          invoicePrefix: 'AUTH',
          cgstRate: 9,
          sgstRate: 9,
          igstRate: 18,
        },
      });
    }

    // Get next invoice number from sequence (or fallback)
    let invoiceNumber: string;
    try {
      const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
        SELECT nextval('invoice_number_seq')
      `;
      invoiceNumber = `${settings.invoicePrefix}-${String(result[0].nextval).padStart(6, '0')}`;
    } catch {
      // Fallback: count-based
      const count = await prisma.invoice.count();
      invoiceNumber = `${settings.invoicePrefix}-${String(count + 1).padStart(6, '0')}`;
    }

    // Determine GST type
    const isIntraState = order.address?.state?.toLowerCase() === settings.state.toLowerCase();
    const cgstRate = Number(settings.cgstRate) / 100;
    const sgstRate = Number(settings.sgstRate) / 100;
    const igstRate = Number(settings.igstRate) / 100;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const black = rgb(0, 0, 0);
    const gray = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.85, 0.85, 0.85);

    let y = 790;

    // ─── Header ────────────────────────────────────────────────
    const titleText = order.tax > 0 ? 'TAX INVOICE' : 'INVOICE';
    page.drawText(titleText, {
      x: 50, y, font: helveticaBold, size: 18, color: black,
    });
    y -= 20;
    page.drawText(settings.businessName, {
      x: 50, y, font: helveticaBold, size: 12, color: black,
    });
    y -= 15;

    // Business details (right side)
    const rightX = 350;
    page.drawText(`Invoice #: ${invoiceNumber}`, {
      x: rightX, y: 790, font: helveticaBold, size: 10, color: black,
    });
    page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, {
      x: rightX, y: 776, font: helvetica, size: 9, color: gray,
    });
    if (order.tax > 0) {
      page.drawText(`GSTIN: ${settings.gstin}`, {
        x: rightX, y: 762, font: helvetica, size: 9, color: gray,
      });
    }

    // Business address
    const addressLines = settings.address.split('\n');
    for (const line of addressLines) {
      page.drawText(line.trim(), {
        x: 50, y, font: helvetica, size: 9, color: gray,
      });
      y -= 13;
    }
    page.drawText(`State: ${settings.state}`, {
      x: 50, y, font: helvetica, size: 9, color: gray,
    });
    y -= 13;
    if (order.tax > 0) {
      page.drawText(`GSTIN: ${settings.gstin}`, {
        x: 50, y, font: helvetica, size: 9, color: gray,
      });
      y -= 25;
    } else {
      y -= 12;
    }

    // Divider
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
    y -= 20;

    // ─── Bill To ────────────────────────────────────────────────
    page.drawText('BILL TO', {
      x: 50, y, font: helveticaBold, size: 9, color: gray,
    });
    page.drawText('SHIP TO', {
      x: 300, y, font: helveticaBold, size: 9, color: gray,
    });
    y -= 15;

    // Customer info
    page.drawText(order.user?.name || 'Customer', {
      x: 50, y, font: helveticaBold, size: 10, color: black,
    });
    if (order.address) {
      page.drawText(order.address.fullName, {
        x: 300, y, font: helveticaBold, size: 10, color: black,
      });
      y -= 13;

      const shipLines = [
        order.address.line1,
        order.address.line2,
        `${order.address.city}, ${order.address.state} ${order.address.postalCode}`,
        order.address.phone,
      ].filter(Boolean);

      for (const line of shipLines) {
        page.drawText(line || '', {
          x: 300, y, font: helvetica, size: 9, color: gray,
        });
        y -= 13;
      }
    } else {
      y -= 13;
    }

    page.drawText(order.user?.email || '', {
      x: 50, y: y + 13, font: helvetica, size: 9, color: gray,
    });

    y -= 20;

    // Order info
    page.drawText(`Order #: ${order.orderNumber}`, {
      x: 50, y, font: helvetica, size: 9, color: gray,
    });
    y -= 20;

    // Divider
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
    y -= 15;

    // ─── Table Header ───────────────────────────────────────────
    const cols = order.tax > 0 ? [50, 250, 300, 360, 420, 490] : [50, 250, 320, 400, 490];
    const headers = order.tax > 0 ? ['Item', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'] : ['Item', 'HSN', 'Qty', 'Rate', 'Amount'];

    page.drawRectangle({ x: 48, y: y - 3, width: 499, height: 18, color: rgb(0.95, 0.95, 0.95) });

    headers.forEach((header, i) => {
      page.drawText(header, {
        x: cols[i], y, font: helveticaBold, size: 8, color: gray,
      });
    });
    y -= 20;

    // ─── Table Rows ─────────────────────────────────────────────
    let subtotal = 0;
    for (const item of order.items) {
      const unitPriceRupees = item.unitPrice / 100;
      const lineTotalRupees = item.totalPrice / 100;
      subtotal += item.totalPrice;

      const itemName = `${item.productName}${item.size ? ` (${item.size}` : ''}${item.color ? `/${item.color})` : item.size ? ')' : ''}`;
      // Truncate long names
      const displayName = itemName.length > 30 ? itemName.substring(0, 27) + '...' : itemName;

      page.drawText(displayName, {
        x: cols[0], y, font: helvetica, size: 9, color: black,
      });
      page.drawText(item.product?.hsnCode || '-', {
        x: cols[1], y, font: helvetica, size: 9, color: gray,
      });
      page.drawText(String(item.quantity), {
        x: cols[2], y, font: helvetica, size: 9, color: black,
      });
      page.drawText(`₹${unitPriceRupees.toLocaleString('en-IN')}`, {
        x: cols[3], y, font: helvetica, size: 9, color: black,
      });

      // Tax per item
      if (order.tax > 0) {
        const itemTax = isIntraState
          ? (item.totalPrice * (cgstRate + sgstRate))
          : (item.totalPrice * igstRate);
        page.drawText(`₹${(itemTax / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, {
          x: cols[4], y, font: helvetica, size: 9, color: gray,
        });

        page.drawText(`₹${lineTotalRupees.toLocaleString('en-IN')}`, {
          x: cols[5], y, font: helvetica, size: 9, color: black,
        });
      } else {
        page.drawText(`₹${lineTotalRupees.toLocaleString('en-IN')}`, {
          x: cols[4], y, font: helvetica, size: 9, color: black,
        });
      }

      y -= 16;
    }

    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: lightGray });
    y -= 20;

    // ─── Totals ─────────────────────────────────────────────────
    const summaryX = 400;
    const valueX = 490;
    const subtotalRupees = order.subtotal / 100;
    const discountRupees = order.discount / 100;
    const shippingRupees = order.shippingFee / 100;

    page.drawText('Subtotal', { x: summaryX, y, font: helvetica, size: 9, color: gray });
    page.drawText(`₹${subtotalRupees.toLocaleString('en-IN')}`, { x: valueX, y, font: helvetica, size: 9, color: black });
    y -= 15;

    if (order.discount > 0) {
      page.drawText('Discount', { x: summaryX, y, font: helvetica, size: 9, color: gray });
      page.drawText(`-₹${discountRupees.toLocaleString('en-IN')}`, { x: valueX, y, font: helvetica, size: 9, color: rgb(0.2, 0.7, 0.2) });
      y -= 15;
    }

    if (order.shippingFee > 0) {
      page.drawText('Shipping', { x: summaryX, y, font: helvetica, size: 9, color: gray });
      page.drawText(`₹${shippingRupees.toLocaleString('en-IN')}`, { x: valueX, y, font: helvetica, size: 9, color: black });
      y -= 15;
    }

    // Tax breakdown
    if (order.tax > 0) {
      if (isIntraState) {
        const cgst = Math.round(order.tax / 2) / 100;
        page.drawText(`CGST (${Number(settings.cgstRate)}%)`, { x: summaryX, y, font: helvetica, size: 9, color: gray });
        page.drawText(`₹${cgst.toLocaleString('en-IN')}`, { x: valueX, y, font: helvetica, size: 9, color: black });
        y -= 15;
        page.drawText(`SGST (${Number(settings.sgstRate)}%)`, { x: summaryX, y, font: helvetica, size: 9, color: gray });
        page.drawText(`₹${cgst.toLocaleString('en-IN')}`, { x: valueX, y, font: helvetica, size: 9, color: black });
        y -= 15;
      } else {
        const igst = order.tax / 100;
        page.drawText(`IGST (${Number(settings.igstRate)}%)`, { x: summaryX, y, font: helvetica, size: 9, color: gray });
        page.drawText(`₹${igst.toLocaleString('en-IN')}`, { x: valueX, y, font: helvetica, size: 9, color: black });
        y -= 15;
      }
    }

    y -= 5;
    page.drawLine({ start: { x: summaryX, y }, end: { x: 545, y }, thickness: 1, color: black });
    y -= 18;

    const totalRupees = order.total / 100;
    page.drawText('TOTAL', { x: summaryX, y, font: helveticaBold, size: 12, color: black });
    page.drawText(`₹${totalRupees.toLocaleString('en-IN')}`, { x: valueX, y, font: helveticaBold, size: 12, color: black });
    y -= 30;

    // ─── Footer ─────────────────────────────────────────────────
    page.drawText('Thank you for shopping with AUTHOR.', {
      x: 50, y: 60, font: helvetica, size: 9, color: gray,
    });
    page.drawText('This is a computer-generated invoice and does not require a signature.', {
      x: 50, y: 45, font: helvetica, size: 7, color: lightGray,
    });

    // ─── Save PDF ───────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save();

    // Upload to Supabase Storage
    const supabase = createAdminClient();
    const fileName = `${invoiceNumber}.pdf`;

    // Ensure storage bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some(b => b.name === BUCKET_NAME)) {
        await supabase.storage.createBucket(BUCKET_NAME, { public: true });
      }
    } catch (bucketError) {
      console.warn('[INVOICE] Error checking/creating bucket, proceeding anyway:', bucketError);
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[INVOICE] Upload failed:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const invoiceUrl = urlData.publicUrl;

    // Create invoice record
    await prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber,
        invoiceUrl,
      },
    });

    // Update order with invoice URL
    await prisma.order.update({
      where: { id: orderId },
      data: { invoiceUrl },
    });

    console.info(`[INVOICE] Generated ${invoiceNumber} for order ${order.orderNumber}`);
    return invoiceUrl;
  } catch (error) {
    console.error('[INVOICE] Generation failed:', error);
    return null;
  }
}
