/**
 * Hook start server Next.js. Kode khusus Node ada di instrumentation-node.ts dan
 * diimpor dinamis, agar tidak ikut dikompilasi untuk Edge Runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
