import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /**
   * Set output to "export" to create a static build of the app.
   * This is required for hosting on services like GitHub Pages.
   */
  output: 'export',
  
  /**
   * Set the base path to the repository name.
   * This is required for assets to load correctly on GitHub Pages.
   * Assumes your repository is named "truth-or-dare-showdown".
   * If it's different, you'll need to update this value.
   */
  basePath: '/truth-or-dare-showdown',

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // The default Next.js image optimization is not compatible with static exports.
    unoptimized: true,
  },
};

export default nextConfig;
