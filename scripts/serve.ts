#!/usr/bin/env -S deno run --allow-net --allow-read

/**
 * Deno file server for Mustalah SPA
 * Usage: deno run --allow-net --allow-read serve.ts
 */

import { serveDir } from "@std/http/file-server";

const PORT = 8000;

console.log(`🚀 Mustalah server starting on http://localhost:${PORT}`);
console.log(`Press Ctrl+C to stop\n`);

Deno.serve({ port: PORT }, async (request) => {
  const response = await serveDir(request, {
    fsRoot: "./build",
    showIndex: true,
    showDotfiles: false,
  });
  
  // Add CORS headers for local development
  response.headers.set("Access-Control-Allow-Origin", "*");
  
  return response;
});
