/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // <-- Tambahkan baris ini untuk mem-bypass pemblokiran Private IP
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vnhawrausejdwkozsonv.supabase.co', 
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com', 
      },
    ],
  },
};

export default nextConfig;