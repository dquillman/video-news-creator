const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude ffmpeg-static from webpack bundling
      // This prevents the binary path from being mangled
      config.externals = config.externals || [];
      config.externals.push('ffmpeg-static');
    }
    return config;
  },
};

module.exports = nextConfig;
