// Cloudinary upload via an *unsigned* upload preset.
// Uses only the cloud name + preset (no API key/secret needed), so it is safe
// to run from a server route. The caller passes the target folder, e.g.
// `an_jeurn/<userId>/photos`, and Cloudinary auto-creates the folder tree.

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
];
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/ogg", "audio/wav", "audio/aac",
];
// Some browsers send an empty/incorrect MIME type (notably HEIC from phones),
// so we also classify by file extension as a fallback.
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
const AUDIO_EXTS = ["mp3", "wav", "aac", "ogg", "m4a", "mp4"];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB (phone photos can be large)
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;  // 20 MB

function classify(file: File): "image" | "audio" | null {
  const type = file.type.toLowerCase();
  if (ALLOWED_IMAGE_TYPES.includes(type)) return "image";
  if (ALLOWED_AUDIO_TYPES.includes(type)) return "audio";
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  return null;
}

export async function uploadToCloudinary(file: File, folder = "uploads"): Promise<string> {
  const kind = classify(file);
  if (!kind) {
    throw new Error(`Unsupported file type "${file.type || file.name}". Allowed: JPG, PNG, WebP, GIF, HEIC, MP3, WAV, AAC`);
  }

  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (file.size > maxBytes) {
    throw new Error(`File too large. Max ${kind === "image" ? "10 MB" : "20 MB"}.`);
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

  const data = (await res.json()) as {
    secure_url?: string;
    resource_type?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? "Cloudinary upload failed");
  }

  // For images, deliver with automatic format + quality so HEIC/large originals
  // are served as browser-friendly, optimized files.
  if (data.resource_type === "image") {
    return data.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
  }
  return data.secure_url;
}
