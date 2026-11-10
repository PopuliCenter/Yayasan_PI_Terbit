import config from "@payload-config";
import { getPayload } from "payload";

/** Klien Local API Payload. `getPayload` sudah menyimpan instance, jadi aman dipanggil berulang. */
export const getPayloadClient = () => getPayload({ config });
