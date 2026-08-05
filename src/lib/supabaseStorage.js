import { supabase } from "@/lib/supabase";

const BUCKET = "shirt-images";

// Same shape as base44.integrations.Core.UploadFile so the admin upload
// call sites didn't need to change.
export const integrations = {
  Core: {
    async UploadFile({ file }) {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
  },
};
