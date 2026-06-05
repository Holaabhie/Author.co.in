import Razorpay from 'razorpay';

let _razorpay: Razorpay | null = null;

/**
 * Get the singleton Razorpay instance.
 * Lazily initialized on first call.
 */
export function getRazorpay(): Razorpay {
  if (!_razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        '[RAZORPAY] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set. Payment features will not work.'
      );
    }

    _razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return _razorpay;
}

/**
 * Convert rupees to paise (Int).
 * All internal amounts are stored in paise to avoid floating point issues.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees for display.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format paise amount to INR display string.
 * @example formatCurrency(199900) => "₹1,999.00"
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Check if Razorpay is running in test mode.
 */
export function isTestMode(): boolean {
  return process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ?? false;
}
