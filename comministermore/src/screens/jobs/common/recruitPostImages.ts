import { launchImageLibrary, type Asset } from 'react-native-image-picker';

export type RecruitChurchLogo = {
  uri: string;
  name: string;
  type: string;
};

const SAFE_NAME = /[^a-zA-Z0-9!@#$%^&*()\-_=+[\]{}|;:'",.<>]/g;

function formatLogoDate(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildRecruitChurchLogoName(originalName: string, userAccount: string, date = new Date()) {
  const datePrefix = formatLogoDate(date);
  const userIdCopy = userAccount.slice(0, 5) || 'user';
  const cleaned = originalName.replace(SAFE_NAME, '');
  const suffix = cleaned.slice(-15) || 'logo.jpg';
  return `${datePrefix}${userIdCopy}_${suffix}`;
}

function assetToLogo(asset: Asset, userAccount: string): RecruitChurchLogo | null {
  if (!asset.uri) return null;
  const originalName = asset.fileName || `logo_${Date.now()}.jpg`;
  return {
    uri: asset.uri,
    name: buildRecruitChurchLogoName(originalName, userAccount),
    type: asset.type || 'image/jpeg',
  };
}

export async function pickRecruitChurchLogo(userAccount: string) {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    quality: 0.8,
  });

  if (result.didCancel || result.errorCode || !result.assets?.length) {
    return { logo: null as RecruitChurchLogo | null, cancelled: Boolean(result.didCancel) };
  }

  const logo = assetToLogo(result.assets[0], userAccount);
  return { logo, cancelled: false };
}
