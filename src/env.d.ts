/// <reference types="astro/client" />

interface Window {
  __starwindRuntime__?: {
    toast?: {
      add(options: { title: string; variant?: string; description?: string }): string;
    } | null;
    [key: string]: unknown;
  };
}

declare namespace App {
  interface Locals {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
      token: string;
      ipAddress?: string | null;
      userAgent?: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    runtime: {
      env: {
        DB: D1Database;
        BETTER_AUTH_SECRET: string;
        BETTER_AUTH_URL: string;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        ADMIN_EMAILS: string;
      };
      cf: Record<string, unknown>;
      caches: CacheStorage;
    };
    isAdmin: boolean;
    /**
     * ExecutionContext del worker (solo en runtime Cloudflare: prod y
     * `astro dev` con workerd). Expone `waitUntil()` para trabajo en
     * segundo plano. Opcional porque en build/prerender no existe.
     */
    cfContext?: {
      waitUntil?: (promise: Promise<unknown>) => void;
    };
   }
}
