import { launchImageLibrary, type Asset } from 'react-native-image-picker';

export type BoardPostImage = {
  uri: string;
  name: string;
  type: string;
};

const SAFE_NAME = /[^a-zA-Z0-9!@#$%^&*()\-_=+[\]{}|;:'",.<>]/g;

function formatPostDate(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function buildBoardPostImageName(originalName: string, userAccount: string, date = new Date()) {
  const datePrefix = formatPostDate(date).slice(0, 10);
  const userIdCopy = userAccount.slice(0, 5) || 'user';
  const cleaned = originalName.replace(SAFE_NAME, '');
  const suffix = cleaned.slice(-15) || 'photo.jpg';
  return `${datePrefix}${userIdCopy}_${suffix}`;
}

function assetToBoardPostImage(asset: Asset, userAccount: string): BoardPostImage | null {
  if (!asset.uri) return null;
  const fallbackName = `photo_${Date.now()}.jpg`;
  const originalName = asset.fileName || fallbackName;
  return {
    uri: asset.uri,
    name: buildBoardPostImageName(originalName, userAccount),
    type: asset.type || 'image/jpeg',
  };
}

export async function pickBoardPostImages(userAccount: string) {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 0,
    quality: 0.8,
  });

  if (result.didCancel || result.errorCode || !result.assets?.length) {
    return { images: [] as BoardPostImage[], cancelled: Boolean(result.didCancel) };
  }

  const picked = result.assets
    .map(asset => assetToBoardPostImage(asset, userAccount))
    .filter((item): item is BoardPostImage => item != null);

  return { images: picked, cancelled: false };
}

export { formatPostDate };
