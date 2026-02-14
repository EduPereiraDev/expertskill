/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@expertskill/shared'],
  
  // Desabilitar source maps em produção (segurança + performance)
  productionBrowserSourceMaps: false,
  
  // Compressão
  compress: true,
  
  // Otimizações de bundle
  swcMinify: true,
  
  // Headers de cache para assets estáticos
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Otimizações experimentais
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

module.exports = nextConfig;
