export type UploadedFile = {
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
};

const MAX_BYTES = 1_500_000;

export function storagePathFor(entity: string, entityId: string, fileName: string): string {
  const clean = (value: string): string => value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';
  return `private/${clean(entity)}/${clean(entityId)}/${clean(fileName)}`;
}

function blobToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not open this image.')); };
    image.src = url;
  });
}

async function compressImage(file: File, maxSide = 1280): Promise<string> {
  const image = await loadImage(file);
  const longest = Math.max(image.width, image.height) || maxSide;
  const scale = Math.min(1, maxSide / longest);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image compression is not available in this browser.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

export async function readUpload(file: File): Promise<UploadedFile> {
  if (file.size > MAX_BYTES) {
    throw new Error('File is larger than 1.5 MB. Use a smaller photo or PDF.');
  }
  const dataUrl = file.type.startsWith('image/') ? await compressImage(file) : await blobToDataUrl(file);
  return { name: file.name, mime: file.type || 'application/octet-stream', size: file.size, dataUrl };
}
