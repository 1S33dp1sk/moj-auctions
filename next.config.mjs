/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export → deploys to Vercel, Netlify, or any static host, and is
  // as fast as a site can be (pure HTML/CSS/JS off a CDN, no server round-trips).
  output: 'export',
  images: {
    // Static export can't use the on-the-fly optimizer; images are already
    // optimized to web sizes by the scraper (sharp), so we serve them as-is.
    unoptimized: true,
  },
  // We load the Arabic font via a plain <link> in app/layout.jsx, so disable
  // Next's build-time Google-Fonts inlining (which needs network at build).
  optimizeFonts: false,
  trailingSlash: true,
};

export default nextConfig;
