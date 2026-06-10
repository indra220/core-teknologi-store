/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Ganti 'abcdefg.supabase.co' dengan URL Supabase Anda
        hostname: 'https://vnhawrausejdwkozsonv.supabase.co', 
      },
      {
        protocol: 'https',
        // Mengizinkan pengambilan gambar avatar otomatis
        hostname: 'ui-avatars.com', 
      },
    ],
  },
};

export default nextConfig;