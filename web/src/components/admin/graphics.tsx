import { Logo } from "@/components/Logo";
import { LogoMark } from "@/components/LogoMark";

/**
 * Grafis panel admin (admin.components.graphics). Payload mengirim serverProps ke komponen
 * ini; props itu SENGAJA diabaikan dan tidak pernah diteruskan ke <svg>, karena objeknya
 * akan menjadi atribut yang tidak sah.
 */

/** Merek di halaman masuk. */
export function AdminLogo() {
  return (
    <div className="ypi-login-brand">
      <Logo className="ypi-login-brand__logo" />
      <div>
        <p className="ypi-login-brand__name">Yayasan Populi Indonesia</p>
        <p className="ypi-login-brand__sub">Panel pengelola situs penerbit</p>
      </div>
    </div>
  );
}

/** Ikon kecil di navigasi langkah (step nav) admin. */
export function AdminIcon() {
  return <LogoMark width={18} height={18} className="ypi-admin-icon" />;
}
