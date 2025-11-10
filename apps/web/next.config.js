// apps/web/next.config.js
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: false },
};

// keep uploads off for now (faster builds). See Section F to enable source maps.
const sentryWebpackPluginOptions = {
  silent: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
