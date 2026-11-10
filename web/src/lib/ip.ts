/** Fungsi murni untuk kunci batas laju; dipisah agar bisa diuji tanpa Next.js. */

/**
 * Kunci batas laju per klien. IPv6 dinormalkan ke prefiks /64: satu pelanggan
 * biasanya memegang seluruh /64 (2^64 alamat), jadi kunci /128 bisa diputar untuk
 * mendapat bucket baru di setiap kiriman. IPv4 tetap alamat utuh.
 */
export const rateKey = (ip: string): string => {
  const addr = ip.trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  if (!addr.includes(":")) return addr;
  if (/^::ffff:\d+\.\d+\.\d+\.\d+$/.test(addr)) return addr.slice(7); // IPv4 dalam IPv6
  const [head, tail = ""] = addr.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const full = [...h, ...new Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t];
  return `${full.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`;
};
