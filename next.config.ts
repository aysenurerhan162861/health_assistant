/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // styled-components veya emotion kullanıyorsan eklenebilir
  },
  experimental: {
    // client-only modülleri için
    runtime: 'nodejs',
  },
};

module.exports = nextConfig;
