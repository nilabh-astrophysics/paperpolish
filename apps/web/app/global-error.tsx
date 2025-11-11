'use client';

import * as React from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-500 mb-6">
          We’ve been notified and are working on it.
        </p>
        <button
          onClick={() => reset()}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
