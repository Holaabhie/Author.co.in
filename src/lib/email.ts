import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "AUTHOR <noreply@author.co.in>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured, email not sent:", subject);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("[EMAIL_ERROR]", error);
  }
}

export function getOrderConfirmationEmail(
  orderNumber: string,
  customerName: string,
  total: number,
  items: { name: string; quantity: number; price: number }[]
): string {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #2A2A2A; color: #FAFAFA;">${item.name}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #2A2A2A; color: #888; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #2A2A2A; color: #F5F0EB; text-align: right;">₹${item.price.toLocaleString()}</td>
        </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Inter', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #FAFAFA; font-size: 28px; letter-spacing: 0.3em; margin: 0;">AUTHOR</h1>
        </div>

        <div style="background-color: #1A1A1A; border: 1px solid rgba(255,255,255,0.05); padding: 32px; margin-bottom: 24px;">
          <h2 style="color: #F5F0EB; font-size: 20px; margin: 0 0 8px 0;">Order Confirmed ✓</h2>
          <p style="color: #888; margin: 0 0 24px 0;">Thank you, ${customerName}. Your order has been received.</p>

          <div style="background-color: #0A0A0A; padding: 16px; margin-bottom: 24px;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 4px 0;">Order Number</p>
            <p style="color: #F5F0EB; font-size: 18px; font-weight: 600; margin: 0;">${orderNumber}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px 0; border-bottom: 1px solid #2A2A2A; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Item</th>
                <th style="text-align: center; padding: 8px 0; border-bottom: 1px solid #2A2A2A; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Qty</th>
                <th style="text-align: right; padding: 8px 0; border-bottom: 1px solid #2A2A2A; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #F5F0EB;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 4px 0;">Total</p>
            <p style="color: #F5F0EB; font-size: 24px; font-weight: 700; margin: 0;">₹${total.toLocaleString()}</p>
          </div>
        </div>

        <div style="text-align: center; padding: 24px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders" style="display: inline-block; background-color: #F5F0EB; color: #0A0A0A; padding: 14px 32px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600;">Track Your Order</a>
        </div>

        <div style="text-align: center; padding: 24px 0; border-top: 1px solid #2A2A2A;">
          <p style="color: #888; font-size: 12px; margin: 0;">© 2026 AUTHOR. All rights reserved.</p>
          <p style="color: #444; font-size: 11px; margin: 8px 0 0 0;">author.co.in</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getWelcomeEmail(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Inter', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #FAFAFA; font-size: 28px; letter-spacing: 0.3em; margin: 0;">AUTHOR</h1>
        </div>
        <div style="background-color: #1A1A1A; border: 1px solid rgba(255,255,255,0.05); padding: 40px; text-align: center;">
          <h2 style="color: #F5F0EB; font-size: 24px; margin: 0 0 16px 0;">Welcome to Author, ${name}</h2>
          <p style="color: #888; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">You've just joined a community that values bold self-expression. Your story starts here.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/shop" style="display: inline-block; background-color: #F5F0EB; color: #0A0A0A; padding: 14px 32px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600;">Start Shopping</a>
        </div>
        <div style="text-align: center; padding: 24px 0;">
          <p style="color: #444; font-size: 11px;">author.co.in</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getShippingUpdateEmail(
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
  trackingUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Inter', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #FAFAFA; font-size: 28px; letter-spacing: 0.3em; margin: 0;">AUTHOR</h1>
        </div>
        <div style="background-color: #1A1A1A; border: 1px solid rgba(255,255,255,0.05); padding: 40px;">
          <h2 style="color: #F5F0EB; font-size: 20px; margin: 0 0 8px 0;">Your Order Has Shipped 📦</h2>
          <p style="color: #888; margin: 0 0 24px 0;">${customerName}, your order #${orderNumber} is on its way.</p>
          <div style="background-color: #0A0A0A; padding: 16px; margin-bottom: 24px;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 4px 0;">Tracking Number</p>
            <p style="color: #F5F0EB; font-size: 16px; font-weight: 600; margin: 0;">${trackingNumber}</p>
          </div>
          <div style="text-align: center;">
            <a href="${trackingUrl}" style="display: inline-block; background-color: #F5F0EB; color: #0A0A0A; padding: 14px 32px; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600;">Track Package</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
