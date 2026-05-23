/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placedog.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Scraped product images from Georgian stores
      { protocol: 'https', hostname: 'zoomart.ge' },
      { protocol: 'https', hostname: '**.zoomart.ge' },
      { protocol: 'https', hostname: 'zoocity.ge' },
      { protocol: 'https', hostname: '**.zoocity.ge' },
      { protocol: 'https', hostname: 'zoolife.ge' },
      { protocol: 'https', hostname: '**.zoolife.ge' },
    ],
  },
};
module.exports = nextConfig;
