import type { NextConfig } from "next";

/**
 * Supabase Storage serves uploads from `<project>.supabase.co`, so the image
 * host has to be derived from the configured URL rather than hard-coded.
 */
const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // A lockfile in a parent directory otherwise makes Next infer the wrong
  // workspace root and trace the wrong files into the deployment bundle.
  outputFileTracingRoot: import.meta.dirname,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Google account avatars from OAuth sign-in.
      { protocol: "https" as const, hostname: "lh3.googleusercontent.com" },
    ],
  },

  experimental: {
    // Both libraries export hundreds of modules; per-import tree-shaking keeps
    // the client bundle from ballooning.
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // Geolocation powers the upload flow and the alert radius.
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
