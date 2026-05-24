/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import {
  Serwist,
  CacheFirst,
  StaleWhileRevalidate,
  NetworkFirst,
  ExpirationPlugin,
} from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // ── CacheFirst: static assets (fonts, images, _next/static) ──
    {
      matcher: ({ request }) =>
        request.destination === "image" ||
        request.destination === "font",
      handler: new CacheFirst({
        cacheName: "static-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    // ── StaleWhileRevalidate: flight search API / server actions ──
    {
      matcher: ({ request, url }) => {
        // Match server action calls and flight-related API fetches
        if (url.pathname.startsWith("/flights") && request.headers.get("accept")?.includes("text/x-component")) {
          return true;
        }
        if (url.pathname.startsWith("/api/")) {
          return true;
        }
        return false;
      },
      handler: new StaleWhileRevalidate({
        cacheName: "flight-data",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
      }),
    },
    // ── NetworkFirst: HTML pages (serve fresh, fallback to cache) ──
    {
      matcher: ({ request }) =>
        request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
        networkTimeoutSeconds: 5,
      }),
    },
    // ── Include Serwist Next.js defaults for everything else ──
    ...defaultCache,
  ],
  // Offline fallback
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.mode === "navigate",
      },
    ],
  },
});

serwist.addEventListeners();
