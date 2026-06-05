import { getCurrentUserWithRole, type AuthUserWithRole } from './get-user';
import { prisma, Prisma } from '@/lib/db';
import { headers } from 'next/headers';

// Role hierarchy — higher index = more permissions
const ROLE_HIERARCHY = [
  'VIEWER',
  'SUPPORT',
  'OPERATIONS',
  'MARKETING',
  'ADMIN',
  'SUPER_ADMIN',
] as const;

export type AdminRole = (typeof ROLE_HIERARCHY)[number];

export interface AdminUser extends AuthUserWithRole {
  role: AdminRole;
}

export interface ApiError {
  error: true;
  code: string;
  message: string;
  status: number;
}

/**
 * Require the current user to have one of the specified admin roles.
 * Returns the authenticated admin user or an ApiError.
 *
 * Usage in Route Handlers:
 * ```ts
 * const result = await requireRole(['ADMIN', 'SUPER_ADMIN']);
 * if ('error' in result) {
 *   return NextResponse.json(result, { status: result.status });
 * }
 * const admin = result;
 * ```
 */
export async function requireRole(
  allowedRoles: AdminRole[]
): Promise<AdminUser | ApiError> {
  const user = await getCurrentUserWithRole();

  if (!user) {
    return {
      error: true,
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      status: 401,
    };
  }

  if (!user.role) {
    return {
      error: true,
      code: 'FORBIDDEN',
      message: 'Admin access required',
      status: 403,
    };
  }

  const userRole = user.role as AdminRole;
  if (!allowedRoles.includes(userRole)) {
    return {
      error: true,
      code: 'FORBIDDEN',
      message: `Insufficient permissions. Required: ${allowedRoles.join(', ')}`,
      status: 403,
    };
  }

  return user as AdminUser;
}

/**
 * Log an admin action to the audit trail.
 * Called after successful role verification.
 */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  entity: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ??
      headersList.get('x-real-ip') ??
      'unknown';
    const userAgent = headersList.get('user-agent') ?? 'unknown';

    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        payload: params.payload ? (params.payload as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Audit logging should never crash the main flow
    console.error('[AUDIT_LOG_ERROR]', error);
  }
}

/**
 * Helper that combines role check + audit logging for admin API routes.
 *
 * Usage:
 * ```ts
 * const admin = await requireRoleWithAudit(
 *   ['ADMIN', 'SUPER_ADMIN'],
 *   'product.create',
 *   'product'
 * );
 * if ('error' in admin) {
 *   return NextResponse.json(admin, { status: admin.status });
 * }
 * ```
 */
export async function requireRoleWithAudit(
  allowedRoles: AdminRole[],
  action: string,
  entity: string,
  entityId?: string
): Promise<AdminUser | ApiError> {
  const result = await requireRole(allowedRoles);

  if ('error' in result) {
    return result;
  }

  // Log the admin access (fire-and-forget, don't block response)
  logAdminAction({
    adminId: result.id,
    action,
    entity,
    entityId,
  }).catch(() => {}); // Swallow errors

  return result;
}
