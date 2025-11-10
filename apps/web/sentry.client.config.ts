import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of requests for performance traces
  replaysOnErrorSampleRate: 1.0, // record session replay when an error happens
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
});
