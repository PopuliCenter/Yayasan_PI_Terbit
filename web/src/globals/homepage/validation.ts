/**
 * Validator field Beranda: validator bawaan Payload (wajib isi, panjang maksimum, dst.)
 * digabung dengan pemeriksaan murni di checks.ts. Draf tidak divalidasi
 * (drafts.validate bawaan false); semua ini berlaku saat Tayangkan.
 */
import type {
  BlocksFieldValidation,
  RichTextFieldValidation,
  TextareaFieldValidation,
  TextFieldSingleValidation,
} from "payload";
import { blocks, richText, text, textarea } from "payload/shared";
import { lexicalToPlainText } from "../../lib/richtext";
import {
  checkAnchor,
  checkForbiddenName,
  checkHref,
  checkIntro,
  checkLayout,
  checkRichTextLinks,
} from "./checks";

/** Pesan galat pertama, atau true bila semuanya lolos. */
const firstError = (...results: (true | string)[]): true | string => results.find((r) => r !== true) ?? true;

export const safeText: TextFieldSingleValidation = async (value, options) =>
  firstError(await text(value, options), checkForbiddenName(value));

export const safeTextarea: TextareaFieldValidation = async (value, options) =>
  firstError(await textarea(value, options), checkForbiddenName(value));

/** Pengantar Pembuka: wajib diawali kalimat identitas penerbit dan tidak menyebut nama lama. */
export const heroIntro: TextareaFieldValidation = async (value, options) =>
  firstError(await textarea(value, options), checkForbiddenName(value), checkIntro(value));

/**
 * Alamat tombol/tautan: path situs (/…), https://…, atau mailto:. Alamat juga tampil
 * (bilah status, salinan tautan), jadi ikut dijaga dari nama lama.
 */
export const hrefField: TextFieldSingleValidation = async (value, options) =>
  firstError(await text(value, options), checkHref(value), checkForbiddenName(value));

/** Jangkar terlihat di alamat (/#…), jadi ikut dijaga dari nama yang salah. */
export const anchorField: TextFieldSingleValidation = async (value, options) =>
  firstError(await text(value, options), checkAnchor(value), checkForbiddenName(value));

export const safeRichText: RichTextFieldValidation = async (value, options) =>
  firstError(
    await richText(value, options),
    checkForbiddenName(lexicalToPlainText(value)),
    checkRichTextLinks(value),
  );

export const layoutValidate: BlocksFieldValidation = async (value, options) =>
  firstError(await blocks(value, options), checkLayout(value));
