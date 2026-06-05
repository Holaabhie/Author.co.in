import { Resend } from 'resend';
import { prisma } from '@/lib/db';

// ─── Email Client ──────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// ─── Email Templates ───────────────────────────────────────────────

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  total: number; // paise
  items: { name: string; quantity: number; price: number }[];
}

interface ShippingEmailData {
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  courierName: string;
}

// ─── Email Sending ─────────────────────────────────────────────────

export async function sendOrderConfirmation(
  to: string,
  data: OrderEmailData
): Promise<void> {
  try {
    const resend = getResend();
    const totalInRupees = (data.total / 100).toLocaleString('en-IN');

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AUTHOR <noreply@author.co.in>',
      to,
      subject: `Order Confirmed — ${data.orderNumber}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fafafa; padding: 40px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; letter-spacing: 0.3em; text-transform: uppercase; margin: 0;">AUTHOR</h1>
          </div>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
            <h2 style="font-size: 18px; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">
              Order Confirmed ✓
            </h2>
            <p style="color: #999; font-size: 14px; margin-bottom: 24px;">
              Hi ${data.customerName}, your order has been confirmed.
            </p>
            
            <div style="background: rgba(255,255,255,0.03); padding: 20px; margin-bottom: 24px;">
              <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #999; margin: 0 0 4px;">Order Number</p>
              <p style="font-size: 16px; font-weight: 600; margin: 0; color: #F5F0EB;">${data.orderNumber}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <th style="text-align: left; padding: 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #999;">Item</th>
                  <th style="text-align: center; padding: 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #999;">Qty</th>
                  <th style="text-align: right; padding: 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #999;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${data.items
                  .map(
                    (item) => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px 0; font-size: 14px;">${item.name}</td>
                    <td style="padding: 12px 0; font-size: 14px; text-align: center;">${item.quantity}</td>
                    <td style="padding: 12px 0; font-size: 14px; text-align: right;">₹${(item.price / 100).toLocaleString('en-IN')}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div style="text-align: right; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
              <p style="font-size: 18px; font-weight: 700; color: #F5F0EB;">Total: ₹${totalInRupees}</p>
            </div>
          </div>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account?tab=orders" 
               style="display: inline-block; background: #F5F0EB; color: #0a0a0a; padding: 12px 32px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600;">
              View Order
            </a>
          </div>

          <p style="text-align: center; color: #666; font-size: 11px; margin-top: 32px;">
            © ${new Date().getFullYear()} AUTHOR. All rights reserved.
          </p>
        </div>
      `,
    });

    // Log notification
    await logNotification({
      type: 'ORDER_CONFIRMATION',
      channel: 'email',
      recipientEmail: to,
      status: 'SENT',
    });
  } catch (error) {
    console.error('[EMAIL] Failed to send order confirmation:', error);
    await logNotification({
      type: 'ORDER_CONFIRMATION',
      channel: 'email',
      recipientEmail: to,
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function sendShippingUpdate(
  to: string,
  data: ShippingEmailData
): Promise<void> {
  try {
    const resend = getResend();

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AUTHOR <noreply@author.co.in>',
      to,
      subject: `Your Order is Shipped — ${data.orderNumber}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fafafa; padding: 40px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; letter-spacing: 0.3em; text-transform: uppercase; margin: 0;">AUTHOR</h1>
          </div>
          
          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;">
            <h2 style="font-size: 18px; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">
              📦 Your Order is on the Way!
            </h2>
            <p style="color: #999; font-size: 14px; margin-bottom: 24px;">
              Hi ${data.customerName}, your order ${data.orderNumber} has been shipped.
            </p>
            
            <div style="background: rgba(255,255,255,0.03); padding: 20px; margin-bottom: 24px;">
              <p style="font-size: 12px; color: #999; margin: 0 0 4px;">Courier: <strong style="color: #fafafa;">${data.courierName}</strong></p>
              <p style="font-size: 12px; color: #999; margin: 0;">Tracking: <strong style="color: #F5F0EB;">${data.trackingNumber}</strong></p>
            </div>
          </div>

          <p style="text-align: center; color: #666; font-size: 11px; margin-top: 32px;">
            © ${new Date().getFullYear()} AUTHOR. All rights reserved.
          </p>
        </div>
      `,
    });

    await logNotification({
      type: 'SHIPPING_UPDATE',
      channel: 'email',
      recipientEmail: to,
      status: 'SENT',
    });
  } catch (error) {
    console.error('[EMAIL] Failed to send shipping update:', error);
    await logNotification({
      type: 'SHIPPING_UPDATE',
      channel: 'email',
      recipientEmail: to,
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ─── WhatsApp (Pluggable) ──────────────────────────────────────────

export async function sendWhatsAppNotification(
  phone: string,
  message: string,
  type: string
): Promise<void> {
  if (process.env.WHATSAPP_ENABLED !== 'true') return;

  const provider = process.env.WHATSAPP_PROVIDER || 'interakt';

  try {
    if (provider === 'interakt') {
      await sendViaInterakt(phone, message);
    } else if (provider === 'twilio') {
      await sendViaTwilio(phone, message);
    }

    await logNotification({
      type,
      channel: 'whatsapp',
      recipientPhone: phone,
      status: 'SENT',
    });
  } catch (error) {
    console.error(`[WHATSAPP] Failed to send via ${provider}:`, error);
    await logNotification({
      type,
      channel: 'whatsapp',
      recipientPhone: phone,
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function sendViaInterakt(phone: string, message: string): Promise<void> {
  const apiKey = process.env.INTERAKT_API_KEY;
  if (!apiKey) throw new Error('INTERAKT_API_KEY not set');

  await fetch('https://api.interakt.ai/v1/public/message/', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      countryCode: '+91',
      phoneNumber: phone.replace(/^\+91/, ''),
      type: 'Text',
      data: { message },
    }),
  });
}

async function sendViaTwilio(phone: string, message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error('Twilio credentials not set');
  }

  const to = phone.startsWith('+') ? `whatsapp:${phone}` : `whatsapp:+91${phone}`;

  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${from}`,
        To: to,
        Body: message,
      }),
    }
  );
}

// ─── Notification Logger ───────────────────────────────────────────

async function logNotification(data: {
  type: string;
  channel: string;
  recipientEmail?: string;
  recipientPhone?: string;
  orderId?: string;
  status: string;
  error?: string;
}): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        type: data.type,
        channel: data.channel,
        recipientEmail: data.recipientEmail ?? null,
        recipientPhone: data.recipientPhone ?? null,
        orderId: data.orderId ?? null,
        status: data.status,
        sentAt: data.status === 'SENT' ? new Date() : null,
        error: data.error ?? null,
      },
    });
  } catch (error) {
    // Notification logging should never crash the main flow
    console.error('[NOTIFICATION_LOG_ERROR]', error);
  }
}
