const withNextIntl = require("next-intl/plugin")("./i18n/request.ts");
const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
                cacheName: "google-fonts",
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
        },
        {
            urlPattern: /\/api\/invoice\/generate/i,
            handler: "NetworkOnly",
        },
        {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "api-cache", networkTimeoutSeconds: 10 },
        },
        {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
                cacheName: "image-cache",
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
        },
        {
            urlPattern: /.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "default-cache", networkTimeoutSeconds: 10 },
        },
    ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
    webpack: (config) => {
        config.module.rules.push({
            test: /\.map$/,
            use: "ignore-loader",
        });
        return config;
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                    {
                        key: "Content-Security-Policy-Report-Only",
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob:",
                            "font-src 'self'",
                            "connect-src 'self'",
                            "frame-ancestors 'none'",
                        ].join("; "),
                    },
                ],
            },
        ];
    },
};

const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(withPWA(withNextIntl(nextConfig)));
