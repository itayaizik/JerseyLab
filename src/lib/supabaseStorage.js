import { supabase } from "@/lib/supabase";

const BUCKET = "shirt-images";
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;
const SKIP_BELOW_BYTES = 400_000;

// Phone photos can be several MB; nobody needs that at a 1600px cap, and
// full-size originals were going straight into product/review thumbnails.
// Downscale + re-encode as webp client-side before it ever hits storage.
// Falls back to the original file on any failure (old browser, decode
// error, non-raster image) - never block the actual upload over this.
async function compressImage(file) {
  if (!file.type?.startsWith("image/") || file.type === "image/svg+xml") return file;
  if (file.size < SKIP_BELOW_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
  } catch {
    return file;
  }
}

// Turns a storage error into something the person looking at the screen can
// act on.
//
// Every upload screen used to catch the error and show "ההעלאה נכשלה. נסה שוב",
// which is true and useless: the three things that actually go wrong each need
// a different response, and "try again" is the right answer to none of them.
// Signing out is by far the most common, because an admin session expires long
// before the next time anyone uploads anything.
export function uploadErrorMessage(err) {
  const raw = String(err?.message || err || '');

  if (/row-level security|Unauthorized|AccessDenied|JWT|403/i.test(raw)) {
    return 'אינך מחובר כמנהל, או שההתחברות פגה. התחבר מחדש ונסה שוב.';
  }
  if (/exceeded the maximum allowed size|Payload too large|413/i.test(raw)) {
    return 'הקובץ גדול מדי. המקסימום הוא 10MB.';
  }
  if (/mime type|not supported/i.test(raw)) {
    return 'סוג הקובץ אינו נתמך. אפשר להעלות תמונות בלבד (JPG, PNG, WEBP, HEIC).';
  }
  if (/Failed to fetch|NetworkError|network/i.test(raw)) {
    return 'אין חיבור לשרת. בדוק את האינטרנט ונסה שוב.';
  }
  return raw ? `ההעלאה נכשלה: ${raw}` : 'ההעלאה נכשלה.';
}

// Same shape as base44.integrations.Core.UploadFile so the admin upload
// call sites didn't need to change. `bucket` defaults to shirt-images but
// callers (e.g. review photos) can target a different public bucket, and a
// `folder` inside it when the bucket's rules depend on where the file goes.
export const integrations = {
  Core: {
    async UploadFile({ file, bucket = BUCKET, folder = '' }) {
      const uploadFile = await compressImage(file);
      const ext = uploadFile.name.includes(".") ? uploadFile.name.split(".").pop() : "jpg";
      const dir = folder ? `${folder.replace(/\/+$/, '')}/` : '';
      const path = `${dir}${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, uploadFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
  },
};
