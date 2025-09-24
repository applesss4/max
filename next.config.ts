import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用React Strict Mode
  reactStrictMode: true,
  
  // 启用压缩
  compress: true,
  
  // 优化图片加载
  images: {
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // 配置编译器选项
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  
  // 启用实验性功能和Turbopack配置
  experimental: {
    // 移除了无效的optimizeCss配置
  },
  
  // Turbopack 配置
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  
  // 启用生产环境优化
  productionBrowserSourceMaps: false,
  
  // 忽略TypeScript错误
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 配置headers以提高缓存性能
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:all*(js|css|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  
  // 优化webpack配置
  webpack: (config, { dev, isServer }) => {
    // 在生产环境中减少bundle大小
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 10,
        },
      };
      
      // 添加CSS优化
      config.optimization.minimize = true;
    }
    
    return config;
  },
};

export default nextConfig;