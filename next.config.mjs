/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add routes for auth features -- removing rewrites as pages are moved to app router
  // async rewrites() {
  //   return [
  //     {
  //       source: '/login',
  //       destination: '/features/auth/app/auth/login',
  //     },
  //     {
  //       source: '/signup',
  //       destination: '/features/auth/app/auth/signup',
  //     },
  //     {
  //       source: '/confirmation',
  //       destination: '/features/auth/app/auth/confirmation',
  //     },
  //     {
  //       source: '/logout',
  //       destination: '/features/auth/app/logout',
  //     },
  //   ]
  // },
}

export default nextConfig
