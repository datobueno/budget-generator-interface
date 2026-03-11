import { loadImageElement, readFileAsDataUrl } from "@/shared/lib/files";

export async function buildPdfCompatibleLogoDataUrl(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const fileType = file.type.toLowerCase();
  const isDirectlyCompatible = fileType === "image/png" || fileType === "image/jpeg";

  if (isDirectlyCompatible) return dataUrl;

  const image = await loadImageElement(dataUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) {
    throw new Error("Could not read the logo size.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare the logo conversion.");
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/png");
}
