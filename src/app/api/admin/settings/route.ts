import { NextRequest, NextResponse } from 'next/server';
import { requireRole, logAdminAction } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { prisma, Prisma } from '@/lib/db';

// ─── Settings shape ────────────────────────────────────────────────

interface ShippingConfig {
  freeShippingThreshold: number; // in paise
  defaultShippingFee: number;    // in paise
  expressFee: number;            // in paise
  estimatedDays: { standard: string; express: string };
}

const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  freeShippingThreshold: 99900, // ₹999
  defaultShippingFee: 4900,     // ₹49
  expressFee: 14900,            // ₹149
  estimatedDays: { standard: '5-7 business days', express: '2-3 business days' },
};

// ─── GET /api/admin/settings ───────────────────────────────────────
// Get all settings: InvoiceSetting, NotificationSettings, shipping config
export async function GET(_request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const [invoiceSetting, notificationSettings, shippingCms] = await Promise.all([
      // Invoice setting (singleton)
      prisma.invoiceSetting.findFirst(),

      // All notification settings
      prisma.notificationSetting.findMany({
        orderBy: { type: 'asc' },
      }),

      // Shipping config from CMS
      prisma.cmsContent.findUnique({
        where: { key: 'shipping_config' },
      }),
    ]);

    // Parse shipping config or use defaults
    let shippingConfig: ShippingConfig;
    try {
      shippingConfig = shippingCms?.value
        ? (shippingCms.value as unknown as ShippingConfig)
        : DEFAULT_SHIPPING_CONFIG;
    } catch {
      shippingConfig = DEFAULT_SHIPPING_CONFIG;
    }

    return apiSuccess({
      invoice: invoiceSetting,
      notifications: notificationSettings,
      shipping: shippingConfig,
    });
  } catch (error) {
    console.error('[ADMIN_SETTINGS_GET]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch settings', 500);
  }
}

// ─── PUT /api/admin/settings ───────────────────────────────────────
// Update settings (section-based)
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'SUPER_ADMIN']);
    if ('error' in admin) {
      return NextResponse.json(admin, { status: admin.status });
    }

    const body = await request.json();
    const { section } = body;

    if (!section) {
      return apiError('VALIDATION_ERROR', 'section is required (invoice | notifications | shipping)');
    }

    switch (section) {
      // ─── Invoice Settings ──────────────────────────────────────
      case 'invoice': {
        const { businessName, address, state, gstin, invoicePrefix, cgstRate, sgstRate, igstRate } = body;

        // Find existing or create
        const existing = await prisma.invoiceSetting.findFirst();

        let invoiceSetting;
        if (existing) {
          invoiceSetting = await prisma.invoiceSetting.update({
            where: { id: existing.id },
            data: {
              ...(businessName !== undefined && { businessName }),
              ...(address !== undefined && { address }),
              ...(state !== undefined && { state }),
              ...(gstin !== undefined && { gstin }),
              ...(invoicePrefix !== undefined && { invoicePrefix }),
              ...(cgstRate !== undefined && { cgstRate }),
              ...(sgstRate !== undefined && { sgstRate }),
              ...(igstRate !== undefined && { igstRate }),
            },
          });
        } else {
          if (!businessName || !address || !state || !gstin) {
            return apiError(
              'VALIDATION_ERROR',
              'businessName, address, state, and gstin are required for initial invoice setup'
            );
          }
          invoiceSetting = await prisma.invoiceSetting.create({
            data: {
              businessName,
              address,
              state,
              gstin,
              invoicePrefix: invoicePrefix ?? 'AUTH',
              cgstRate: cgstRate ?? 9,
              sgstRate: sgstRate ?? 9,
              igstRate: igstRate ?? 18,
            },
          });
        }

        await logAdminAction({
          adminId: admin.id,
          action: 'settings.update_invoice',
          entity: 'InvoiceSetting',
          entityId: invoiceSetting.id,
          payload: { updatedFields: Object.keys(body).filter((k) => k !== 'section') },
        });

        return apiSuccess(invoiceSetting);
      }

      // ─── Notification Settings ─────────────────────────────────
      case 'notifications': {
        const { notifications } = body;

        if (!Array.isArray(notifications)) {
          return apiError('VALIDATION_ERROR', 'notifications must be an array');
        }

        const results = [];

        for (const notif of notifications) {
          const { id, type, channel, isEnabled, template } = notif;

          if (id) {
            // Update existing
            const updated = await prisma.notificationSetting.update({
              where: { id },
              data: {
                ...(isEnabled !== undefined && { isEnabled }),
                ...(template !== undefined && { template }),
                ...(channel !== undefined && { channel }),
              },
            });
            results.push(updated);
          } else if (type && channel) {
            // Create new
            const created = await prisma.notificationSetting.upsert({
              where: { type },
              update: {
                ...(isEnabled !== undefined && { isEnabled }),
                ...(template !== undefined && { template }),
                ...(channel !== undefined && { channel }),
              },
              create: {
                type,
                channel,
                isEnabled: isEnabled ?? true,
                template: template ?? null,
              },
            });
            results.push(created);
          }
        }

        await logAdminAction({
          adminId: admin.id,
          action: 'settings.update_notifications',
          entity: 'NotificationSetting',
          payload: { count: results.length },
        });

        return apiSuccess(results);
      }

      // ─── Shipping Config ──────────────────────────────────────
      case 'shipping': {
        const { freeShippingThreshold, defaultShippingFee, expressFee, estimatedDays } = body;

        const config: ShippingConfig = {
          freeShippingThreshold: freeShippingThreshold ?? DEFAULT_SHIPPING_CONFIG.freeShippingThreshold,
          defaultShippingFee: defaultShippingFee ?? DEFAULT_SHIPPING_CONFIG.defaultShippingFee,
          expressFee: expressFee ?? DEFAULT_SHIPPING_CONFIG.expressFee,
          estimatedDays: estimatedDays ?? DEFAULT_SHIPPING_CONFIG.estimatedDays,
        };

        const shippingSetting = await prisma.cmsContent.upsert({
          where: { key: 'shipping_config' },
          update: {
            value: config as unknown as Prisma.InputJsonValue,
            updatedBy: admin.id,
          },
          create: {
            key: 'shipping_config',
            value: config as unknown as Prisma.InputJsonValue,
            updatedBy: admin.id,
          },
        });

        await logAdminAction({
          adminId: admin.id,
          action: 'settings.update_shipping',
          entity: 'CmsContent',
          entityId: shippingSetting.id,
          payload: { config },
        });

        return apiSuccess(config);
      }

      default:
        return apiError('VALIDATION_ERROR', `Unknown settings section: ${section}`);
    }
  } catch (error) {
    console.error('[ADMIN_SETTINGS_PUT]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update settings', 500);
  }
}
