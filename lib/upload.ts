// Cloudinary upload via an *unsigned* upload preset.
// Uses only the cloud name + preset (no API key/secret needed), so it is safe
// to run from a server route. The caller passes the target folder, e.g.
// `an_jeurn/<userId>/photos`, and Cloudinary auto-creates the folder tree.

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/ogg", "audio/wav", "audio/aac"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;  // 20 MB

export async function uploadToCloudinary(file: File, folder = "uploads"): Promise<string> {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);

  if (!isImage && !isAudio) {
    throw new Error(`Unsupported file type "${file.type}". Allowed: JPG, PNG, WebP, GIF, MP3, WAV, AAC`);
  }

  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (file.size > maxBytes) {
    throw new Error(`File too large. Max ${isImage ? "5 MB" : "20 MB"}.`);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    throw new Error("Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET).");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", preset);
  form.append("folder", folder);

  // `auto` resource type handles both images and audio (audio uploads as a video asset).
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: form,
  });

  const data = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? "Cloudinary upload failed");
  }

  return data.secure_url;
}
