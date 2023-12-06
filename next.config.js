/** @type {import('next').NextConfig} */
const nextConfig = {
  // async redirects() {
  //   return [
  //     {
  //       source: "/sign-in",
  //       destination: "/api/auth/signin",
  //       permanent: true,
  //     },
  //     {
  //       source: "/sign-out",
  //       destination: "/api/auth/signout",
  //       permanent: true,
  //     },
  //   ];
  // },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    return config;
  },
};

module.exports = nextConfig;
