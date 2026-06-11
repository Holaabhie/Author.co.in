import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';
import { getCurrentUser } from '@/lib/auth/get-user';

// ─── GET /api/addresses ─────────────────────────────────────────────

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: 'desc' }, // Default address first
        { label: 'asc' },
      ],
    });

    return apiSuccess(addresses);
  } catch (error) {
    console.error('[ADDRESSES_GET_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to fetch addresses', 500);
  }
}

// ─── POST /api/addresses ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { label, fullName, phone, line1, line2, city, state, postalCode, isDefault } = body;

    // Validation
    if (!fullName?.trim()) {
      return apiError('VALIDATION_ERROR', 'Full name is required', 400);
    }
    if (!phone?.trim()) {
      return apiError('VALIDATION_ERROR', 'Phone number is required', 400);
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      return apiError('VALIDATION_ERROR', 'Invalid phone number. Must be a 10-digit number.', 400);
    }
    if (!line1?.trim()) {
      return apiError('VALIDATION_ERROR', 'Address line 1 is required', 400);
    }
    if (!city?.trim()) {
      return apiError('VALIDATION_ERROR', 'City is required', 400);
    }
    if (!state?.trim()) {
      return apiError('VALIDATION_ERROR', 'State is required', 400);
    }
    if (!postalCode?.trim()) {
      return apiError('VALIDATION_ERROR', 'Postal code is required', 400);
    }

    // Validate postal code format (6-digit Indian PIN)
    if (!/^\d{6}$/.test(postalCode.trim())) {
      return apiError('VALIDATION_ERROR', 'Invalid postal code. Must be a 6-digit PIN.', 400);
    }

    // If this is the user's first address, auto-set as default
    const addressCount = await prisma.address.count({ where: { userId: user.id } });
    const shouldBeDefault = isDefault || addressCount === 0;

    let address;
    if (shouldBeDefault) {
      address = await prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });

        return tx.address.create({
          data: {
            userId: user.id,
            label: label?.trim() || 'Home',
            fullName: fullName.trim(),
            phone: phone.trim(),
            line1: line1.trim(),
            line2: line2?.trim() || null,
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            isDefault: true,
          },
        });
      });
    } else {
      address = await prisma.address.create({
        data: {
          userId: user.id,
          label: label?.trim() || 'Home',
          fullName: fullName.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          line2: line2?.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          isDefault: false,
        },
      });
    }

    return apiSuccess(address);
  } catch (error) {
    console.error('[ADDRESS_CREATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to create address', 500);
  }
}

// ─── PUT /api/addresses ─────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Address id is required', 400);
    }

    // Verify ownership
    const existing = await prisma.address.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing || existing.userId !== user.id) {
      return apiError('NOT_FOUND', 'Address not found', 404);
    }

    // Build update data — only include provided fields
    const updateData: any = {};

    if (fields.label !== undefined) updateData.label = fields.label.trim();
    if (fields.fullName !== undefined) updateData.fullName = fields.fullName.trim();
    if (fields.phone !== undefined) {
      if (!/^\d{10}$/.test(fields.phone.trim())) {
        return apiError('VALIDATION_ERROR', 'Invalid phone number. Must be a 10-digit number.', 400);
      }
      updateData.phone = fields.phone.trim();
    }
    if (fields.line1 !== undefined) updateData.line1 = fields.line1.trim();
    if (fields.line2 !== undefined) updateData.line2 = fields.line2?.trim() || null;
    if (fields.city !== undefined) updateData.city = fields.city.trim();
    if (fields.state !== undefined) updateData.state = fields.state.trim();
    if (fields.postalCode !== undefined) {
      if (!/^\d{6}$/.test(fields.postalCode.trim())) {
        return apiError('VALIDATION_ERROR', 'Invalid postal code. Must be a 6-digit PIN.', 400);
      }
      updateData.postalCode = fields.postalCode.trim();
    }

    // Handle default address toggle
    let address;
    if (fields.isDefault === true) {
      updateData.isDefault = true;
      address = await prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });

        return tx.address.update({
          where: { id },
          data: updateData,
        });
      });
    } else {
      if (fields.isDefault === false) {
        updateData.isDefault = false;
      }
      address = await prisma.address.update({
        where: { id },
        data: updateData,
      });
    }

    return apiSuccess(address);
  } catch (error) {
    console.error('[ADDRESS_UPDATE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to update address', 500);
  }
}

// ─── DELETE /api/addresses ──────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return apiError('VALIDATION_ERROR', 'Address id is required', 400);
    }

    // Verify ownership
    const existing = await prisma.address.findUnique({
      where: { id },
      select: { userId: true, isDefault: true },
    });

    if (!existing || existing.userId !== user.id) {
      return apiError('NOT_FOUND', 'Address not found', 404);
    }

    await prisma.address.delete({ where: { id } });

    // If we deleted the default, promote another address
    if (existing.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { label: 'asc' },
      });

      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error('[ADDRESS_DELETE_ERROR]', error);
    return apiError('INTERNAL_ERROR', 'Failed to delete address', 500);
  }
}
