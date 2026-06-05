import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://author.co.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/checkout/',
        '/auth/',
        '/account/',
        '/reset-password',
        '/update-password',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
