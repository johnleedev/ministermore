import { launchImageLibrary, type Asset } from 'react-native-image-picker';

export type RetreatRequestImage = {
  uri: string;
  name: string;
  type: string;
};

const SAFE_NAME = /[^\w!@#$%^&*()=+{}|;:'",.<>-]/g;

export function formatRetreatRequestDate(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatRetreatImageDatePrefix(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${yy}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function buildRetreatRequestImageName(originalName: string, date = new Date()) {
  const datePrefix = formatRetreatImageDatePrefix(date);
  const cleaned = originalName.replace(SAFE_NAME, '');
  const suffix = cleaned.slice(-15) || 'photo.jpg';
  return `${datePrefix}_${suffix}`;
}

function assetToRetreatRequestImage(asset: Asset): RetreatRequestImage | null {
  if (!asset.uri) return null;
  const originalName = asset.fileName || `photo_${Date.now()}.jpg`;
  return {
    uri: asset.uri,
    name: buildRetreatRequestImageName(originalName),
    type: asset.type || 'image/jpeg',
  };
}

export async function pickRetreatRequestImages() {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 0,
    quality: 0.8,
  });

  if (result.didCancel || result.errorCode || !result.assets?.length) {
    return { images: [] as RetreatRequestImage[], cancelled: Boolean(result.didCancel) };
  }

  const images = result.assets
    .map(assetToRetreatRequestImage)
    .filter((item): item is RetreatRequestImage => item != null);

  return { images, cancelled: false };
}

export function moveRetreatRequestImage<T>(list: T[], index: number, direction: 'up' | 'down') {
  const next = [...list];
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function appendRetreatImagesToFormData(formData: FormData, images: RetreatRequestImage[]) {
  images.forEach(item => {
    formData.append('img', {
      uri: item.uri,
      type: item.type,
      name: item.name,
    } as unknown as Blob);
  });
}
