import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/get-user';
import { requireRole } from '@/lib/auth/require-role';
import { apiUnauthorized, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/db';
import { generateInvoice } from '@/lib/invoice';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/orders/[id]/invoice
 * Downloads the order's GST invoice PDF. Generates one if it doesn't exist.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUserWithRole();
    if (!user) {
      return apiUnauthorized();
    }

    const { id: orderId } = await context.params;

    // Fetch order to verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        invoice: true,
      },
    });

    if (!order) {
      return apiError('NOT_FOUND', 'Order not found', 404);
    }

    // Verify ownership or admin role
    const isAdmin = user.role && ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'SUPPORT'].includes(user.role);
    if (order.userId !== user.id && !isAdmin) {
      return apiError('FORBIDDEN', 'You do not have access to this invoice', 403);
    }

    let invoice = order.invoice;
    let pdfUrl = invoice?.invoiceUrl || order.invoiceUrl;

    // Generate invoice if missing
    if (!invoice || !pdfUrl) {
      const generatedUrl = await generateInvoice(orderId);
      if (!generatedUrl) {
        return apiError('GENERATION_FAILED', 'Failed to generate GST invoice', 500);
      }
      // Re-fetch invoice info
      invoice = await prisma.invoice.findFirst({
        where: { orderId },
      });
    }

    if (!invoice) {
      return apiError('NOT_FOUND', 'Invoice record not found after generation', 500);
    }

    const fileName = `${invoice.invoiceNumber}.pdf`;

    // Download PDF from Supabase Storage
    const supabase = createAdminClient();
    const { data: pdfBuffer, error } = await supabase.storage
      .from('invoices')
      .download(fileName);

    if (error || !pdfBuffer) {
      console.error('[INVOICE_DOWNLOAD_ERROR]', error);
      // Fallback: If download fails but pdfUrl is available, redirect
      if (pdfUrl) {
        return NextResponse.redirect(pdfUrl);
      }
      return apiError('FETCH_FAILED', 'Failed to retrieve invoice PDF from storage', 500);
    }

    // Stream PDF response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[INVOICE_DOWNLOAD_ROUTE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'An error occurred during invoice download', 500);
  }
}
