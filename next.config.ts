import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  serverExternalPackages: ['ffprobe-static', 'ffmpeg-static', 'fluent-ffmpeg'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/ffprobe-static/bin/**/*'],
  },
};

export default nextConfig;
