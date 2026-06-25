const IMAGE_EXT = /\.(png|jpe?g|webp|gif)(\?|$)/i;

export function isImageMedia(url: string, mimeType?: string) {
  if (mimeType?.startsWith("image/")) return true;
  return IMAGE_EXT.test(url);
}

export function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileNameFromUrl(url: string) {
  try {
    const segment = new URL(url).pathname.split("/").pop() ?? "file";
    const cleaned = segment.replace(/^[a-f0-9-]+-/, "");
    return decodeURIComponent(cleaned);
  } catch {
    return url.split("/").pop() ?? "file";
  }
}
