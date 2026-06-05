import { z } from 'zod';

const envSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Razorpay (required)
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
  
  // Resend (required)
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  
  // WhatsApp (optional)
  WHATSAPP_ENABLED: z.string().default('false'),
  WHATSAPP_PROVIDER: z.string().default('interakt'),
  INTERAKT_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  
  // Shiprocket (optional)
  SHIPPING_PROVIDER: z.string().default('manual'),
  SHIPROCKET_EMAIL: z.string().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  
  // Redis (optional but recommended)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Author'),
  ADMIN_EMAIL: z.string().email().optional(),
  
  // Google OAuth (for Supabase Auth — configured in Supabase dashboard, not here)
  // No env vars needed here, Supabase handles OAuth config
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // Only validate on server side
  if (typeof window !== 'undefined') {
    return process.env as unknown as Env;
  }
  
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    const errors = result.error.flatten().fieldErrors;
    Object.entries(errors).forEach(([key, msgs]) => {
      console.error(`  ${key}: ${msgs?.join(', ')}`);
    });
    
    // Don't crash in development — warn instead
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    }
    console.warn('⚠️ Running with invalid env vars (development mode)');
    return process.env as unknown as Env;
  }
  
  // Razorpay test mode warning
  if (result.data.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    console.warn('⚠️ RAZORPAY: Running in TEST MODE');
  }
  
  // WhatsApp status
  if (result.data.WHATSAPP_ENABLED === 'true') {
    console.info(`📱 WhatsApp notifications: ENABLED (${result.data.WHATSAPP_PROVIDER})`);
  }
  
  // Shipping provider
  if (result.data.SHIPPING_PROVIDER !== 'manual') {
    console.info(`🚚 Shipping provider: ${result.data.SHIPPING_PROVIDER}`);
  }
  
  return result.data;
}

export const env = validateEnv();

// Type-safe accessors for common checks
export const isWhatsAppEnabled = () => env.WHATSAPP_ENABLED === 'true';
export const isRazorpayTestMode = () => env.RAZORPAY_KEY_ID.startsWith('rzp_test_');
export const getShippingProvider = () => env.SHIPPING_PROVIDER as 'manual' | 'shiprocket';
