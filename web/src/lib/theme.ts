/**
 * Mode terang/gelap.
 *
 * Pilihan pengunjung disimpan di localStorage dengan kunci ini. Bila belum pernah
 * memilih, situs mengikuti pengaturan perangkat dan ikut berubah saat perangkat berganti mode.
 */
export const THEME_STORAGE_KEY = "tema";

export type Theme = "light" | "dark";

/** Warna latar halaman per mode; juga dipakai untuk meta theme-color (bilah peramban). */
export const THEME_PAPER: Record<Theme, string> = { light: "#faf8f4", dark: "#13171e" };

/**
 * Dijalankan sinkron di <head> sebelum halaman tergambar, supaya tidak ada kilatan tema
 * yang salah. Hanya memasang data-theme awal pada <html>; penjagaan selanjutnya
 * (perubahan mode perangkat, tab lain, atribut yang hilang saat React merender ulang
 * layout di browser, warna bilah peramban) dikerjakan komponen ThemeSync.
 *
 * Penyimpanan dibaca di blok try tersendiri: bila diblokir (cookie/data situs dimatikan),
 * situs tetap mengikuti mode perangkat, bukan jatuh ke mode terang.
 * Tanpa JavaScript, situs tampil dalam mode terang.
 */
export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement,s=null;try{s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}if(s!=="dark"&&s!=="light"){try{s=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){s="light"}}d.setAttribute("data-theme",s)})();`;

/**
 * Pilihan yang dibuat di halaman ini. Cadangan bila localStorage diblokir, agar klik
 * pengunjung tidak ditimpa oleh perubahan mode perangkat selama halaman masih terbuka.
 */
let sessionChoice: Theme | null = null;

/** Pilihan pengunjung, atau null bila belum pernah memilih (hanya di browser). */
export const readStoredTheme = (): Theme | null => {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "dark" || value === "light") return value;
  } catch {
    // Penyimpanan diblokir: pakai pilihan di halaman ini bila ada.
  }
  return sessionChoice;
};

const deviceTheme = (): Theme => {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
};

/** Tema yang berlaku: pilihan pengunjung, atau mode perangkat (hanya di browser). */
export const resolveTheme = (): Theme => readStoredTheme() ?? deviceTheme();

/**
 * Pasang tema pada halaman: atribut data-theme dan warna bilah peramban (meta theme-color).
 * Meta bawaan memakai media query mode perangkat; di sini disamakan dengan tema yang dipilih.
 */
export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (root.getAttribute("data-theme") !== theme) root.setAttribute("data-theme", theme);
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    if (meta.content !== THEME_PAPER[theme]) meta.content = THEME_PAPER[theme];
  });
};

/** Simpan pilihan pengunjung lalu pasang. */
export const chooseTheme = (theme: Theme) => {
  sessionChoice = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Mode privat atau penyimpanan diblokir: pilihan berlaku selama halaman terbuka.
  }
  applyTheme(theme);
};
