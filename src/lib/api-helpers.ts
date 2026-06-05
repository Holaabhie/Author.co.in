import { NextResponse } from 'next/server';

// ─── Standard API Response Shape ───────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  error: true;
  code: string;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Response Helpers ──────────────────────────────────────────────

export function apiSuccess<T>(data: T, meta?: ApiSuccessResponse<T>['meta']): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function apiError(
  code: string,
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    { error: true, code, message } satisfies ApiErrorResponse,
    { status }
  );
}

export function apiUnauthorized(message = 'Authentication required'): NextResponse {
  return apiError('UNAUTHORIZED', message, 401);
}

export function apiForbidden(message = 'Insufficient permissions'): NextResponse {
  return apiError('FORBIDDEN', message, 403);
}

export function apiNotFound(message = 'Resource not found'): NextResponse {
  return apiError('NOT_FOUND', message, 404);
}

export function apiValidationError(message: string): NextResponse {
  return apiError('VALIDATION_ERROR', message, 400);
}

export function apiServerError(message = 'Internal server error'): NextResponse {
  return apiError('INTERNAL_ERROR', message, 500);
}

// ─── Pagination Helpers ────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export function paginationMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Query Helpers ─────────────────────────────────────────────────

export function parseSortOrder(
  sortParam: string | null,
  allowedFields: string[],
  defaultField = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
): { field: string; order: 'asc' | 'desc' } {
  if (!sortParam) return { field: defaultField, order: defaultOrder };
  
  const isDesc = sortParam.startsWith('-');
  const field = isDesc ? sortParam.slice(1) : sortParam;
  
  if (!allowedFields.includes(field)) {
    return { field: defaultField, order: defaultOrder };
  }
  
  return { field, order: isDesc ? 'desc' : 'asc' };
}
