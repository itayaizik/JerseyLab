import { supabase } from "@/lib/supabase";

const BUCKET = "shirt-images";
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;
const SKIP_BELOW_BYTES = 400_000;

// Phone photos can be several MB; nobody needs that at a 1600px cap, and
// full-size originals were going straight into product/review thumbnails.
// Downscale + re-encode as webp client-side before it ever hits storage.
// Falls back to the original file on any failure (old browser, decode
// error, non-raster image) — never block the actual upload over this.
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

// Same shape as base44.integrations.Core.UploadFile so the admin upload
// call sites didn't need to change. `bucket` defaults to shirt-images but
// callers (e.g. review photos) can target a different public bucket.
export const integrations = {
  Core: {
    async UploadFile({ file, bucket = BUCKET }) {
      const uploadFile = await compressImage(file);
      const ext = uploadFile.name.includes(".") ? uploadFile.name.split(".").pop() : "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
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
