/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['react-date-range'],
    eslint: { ignoreDuringBuilds: true },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: https: blob:",
                            "connect-src 'self' https: wss: http://localhost:8000",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
