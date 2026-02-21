import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // 如果你需要使用 Next.js 的 Image 组件，可能需要禁用内置优化（如果未配置外部 loader）：
  // images: {
  //   unoptimized: true,
  // },
};

export default nextConfig;
