/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Ganti 'abcdefg.supabase.co' dengan URL Supabase Anda
        hostname: 'jcioxsycybxloxtxejqy.supabase.co', 
      },
    ],
  },
};

export default nextConfig;