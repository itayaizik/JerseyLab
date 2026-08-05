import { supabase } from "@/lib/supabase";

const BUCKET = "shirt-images";

// Same shape as base44.integrations.Core.UploadFile so the admin upload
// call sites didn't need to change. `bucket` defaults to shirt-images but
// callers (e.g. review photos) can target a different public bucket.
export const integrations = {
  Core: {
    async UploadFile({ file, bucket = BUCKET }) {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
  },
};
