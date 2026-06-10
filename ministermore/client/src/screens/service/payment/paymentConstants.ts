export const PHONE_PREFIX_OPTIONS = [
  '010', '011', '016', '017', '018', '019',
  '02',
  '031', '032', '033',
  '041', '042', '043', '044',
  '051', '052', '053', '054', '055',
  '061', '062', '063', '064',
  '070', '080',
] as const;

export type PortOneCustomer = {
  fullName: string;
  phoneNumber: string;
  email: string;
};

export function calcPriceWithVat(supplyPrice: number, vatRate = 0.1) {
  const supply = Math.round(supplyPrice);
  const vatAmount = Math.round(supply * vatRate);
  const totalAmount = supply + vatAmount;
  return { supplyPrice: supply, vatAmount, totalAmount };
}

export function buildPortOneCustomer(
  userAccount: string,
  ordererName: string,
  phoneDigits: string,
): PortOneCustomer {
  const email = userAccount.includes('@') ? userAccount : 'noreply@ministermore.co.kr';
  return {
    fullName: ordererName.trim() || userAccount || '주문자',
    phoneNumber: phoneDigits || '01000000000',
    email,
  };
}

export function digitsFromPhoneParts(prefix: string, mid: string, last: string): string {
  return `${prefix}${mid}${last}`.replace(/\D/g, '').slice(0, 20);
}

export function getOrCreateCustomerId(
  userAccount: string,
  storageKey: string,
  guestPrefix: string,
): string {
  const account = userAccount.trim();
  if (account) return account;
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing?.trim()) return existing.trim();
    const created = `${guestPrefix}_${Date.now()}`;
    localStorage.setItem(storageKey, created);
    return created;
  } catch {
    return `${guestPrefix}_${Date.now()}`;
  }
}
