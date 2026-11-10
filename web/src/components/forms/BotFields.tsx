import Script from "next/script";
import { HONEYPOT_FIELD, TOKEN_FIELD } from "@/lib/antibot-fields";

/**
 * Field pendukung anti-bot untuk setiap formulir publik.
 * Honeypot disembunyikan dari pengguna dan pembaca layar, tapi tetap ada di DOM untuk bot.
 */
export function BotFields({ issuedAt }: { issuedAt: string }) {
  const siteKey = process.env.TURNSTILE_SITE_KEY;
  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${HONEYPOT_FIELD}-${issuedAt}`}>Jangan isi kolom ini</label>
        <input id={`${HONEYPOT_FIELD}-${issuedAt}`} type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name={TOKEN_FIELD} value={issuedAt} />
      {siteKey ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
          <div className="cf-turnstile mt-2" data-sitekey={siteKey} data-language="id" />
        </>
      ) : null}
    </>
  );
}
