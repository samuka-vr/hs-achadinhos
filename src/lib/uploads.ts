const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

export type AllowedImageMime = keyof typeof IMAGE_TYPES;

function hasPrefix(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

function matchesSignature(type: AllowedImageMime, bytes: Uint8Array) {
  if (type === "image/jpeg") return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
  if (type === "image/png") return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (type === "image/gif") {
    const header = String.fromCharCode(...bytes.slice(0, 6));
    return header === "GIF87a" || header === "GIF89a";
  }
  if (type === "image/webp") {
    const riff = String.fromCharCode(...bytes.slice(0, 4));
    const webp = String.fromCharCode(...bytes.slice(8, 12));
    return riff === "RIFF" && webp === "WEBP";
  }
  return false;
}

/**
 * Validates size, browser-reported MIME and the file signature.
 * SVG is intentionally rejected because it can contain executable markup.
 */
export async function validateImageFile(file: File, maxBytes = MAX_IMAGE_BYTES) {
  if (file.size <= 0) throw new Error("A imagem está vazia.");
  if (file.size > maxBytes) throw new Error(`A imagem “${file.name}” deve ter no máximo ${Math.round(maxBytes / 1024 / 1024)} MB.`);

  const mime = file.type.toLowerCase() as AllowedImageMime;
  const extension = IMAGE_TYPES[mime];
  if (!extension) throw new Error("Use uma imagem JPG, PNG, WEBP ou GIF.");

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesSignature(mime, bytes)) throw new Error("O conteúdo do arquivo não corresponde a uma imagem válida.");

  return { contentType: mime, extension };
}

export function safeUploadBaseName(value: string, fallback = "imagem") {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || fallback;
}

export function replaceFileExtension(path: string, extension: string) {
  const withoutExtension = path.replace(/\.[a-z0-9]+$/i, "");
  return `${withoutExtension}.${extension}`;
}
