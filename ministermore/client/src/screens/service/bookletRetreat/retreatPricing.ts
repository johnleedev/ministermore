import type { PricingGroupIconType } from './PricingGroupIcon';

export type RetreatPricingTierId =
  | 'up50'
  | '51-100'
  | '101-200'
  | '201-300'
  | '301-400'
  | '401-500'
  | '501-1000'
  | 'over-1000';

export type RetreatPricingCardId = 'up50' | '51-100' | '101-200' | '201-plus';

export type RetreatPricingTier = {
  id: RetreatPricingTierId;
  label: string;
  supplyPrice: number;
  priceLabel: string;
  inquiryOnly?: boolean;
};

export type RetreatPricingCard = {
  cardId: RetreatPricingCardId;
  tierId?: RetreatPricingTierId;
  badge?: string;
  count: string;
  price: string;
  desc: string;
  variant: 'free' | 'default';
  icon: PricingGroupIconType;
};

export const RETREAT_PRICING_TIERS: RetreatPricingTier[] = [
  { id: 'up50', label: '50명 이하', supplyPrice: 0, priceLabel: '무료' },
  { id: '51-100', label: '51~100명', supplyPrice: 5_000, priceLabel: '5,000원' },
  { id: '101-200', label: '101~200명', supplyPrice: 10_000, priceLabel: '10,000원' },
  { id: '201-300', label: '201~300명', supplyPrice: 20_000, priceLabel: '20,000원' },
  { id: '301-400', label: '301~400명', supplyPrice: 30_000, priceLabel: '30,000원' },
  { id: '401-500', label: '401~500명', supplyPrice: 40_000, priceLabel: '40,000원' },
  { id: '501-1000', label: '501~1,000명', supplyPrice: 50_000, priceLabel: '50,000원' },
  {
    id: 'over-1000',
    label: '1,000명 이상',
    supplyPrice: 0,
    priceLabel: '운영진 문의',
    inquiryOnly: true,
  },
];

export const RETREAT_PRICING_CARDS: RetreatPricingCard[] = [
  {
    cardId: 'up50',
    tierId: 'up50',
    badge: '무료 시작',
    count: '50명 이하',
    price: '무료',
    desc: '작은 규모 수련회는 부담 없이 시작해보세요.',
    variant: 'free',
    icon: 'group-heart',
  },
  {
    cardId: '51-100',
    tierId: '51-100',
    count: '51~100명',
    price: '5,000원',
    desc: '기본 안내와 신청 흐름을 가볍게 운영할 수 있습니다.',
    variant: 'default',
    icon: 'group',
  },
  {
    cardId: '101-200',
    tierId: '101-200',
    count: '100명대',
    price: '10,000원',
    desc: '안내와 신청 동선이 더 중요해지는 규모에 적합합니다.',
    variant: 'default',
    icon: 'group-cross',
  },
  {
    cardId: '201-plus',
    count: '200명 이상',
    price: '20,000원 ~',
    desc: '대규모 수련회는 인원 구간별로 단계 요금이 적용됩니다.',
    variant: 'default',
    icon: 'group-large',
  },
];

const LARGE_TIER_IDS = new Set<RetreatPricingTierId>([
  '201-300',
  '301-400',
  '401-500',
  '501-1000',
  'over-1000',
]);

const PAYABLE_LARGE_TIER_IDS = new Set<RetreatPricingTierId>([
  '201-300',
  '301-400',
  '401-500',
  '501-1000',
]);

export const RETREAT_LARGE_TIERS = RETREAT_PRICING_TIERS.filter((tier) =>
  PAYABLE_LARGE_TIER_IDS.has(tier.id),
);

export const RETREAT_INQUIRY_TIER = RETREAT_PRICING_TIERS.find((tier) => tier.id === 'over-1000')!;

export function isInquiryTierId(tierId: RetreatPricingTierId): boolean {
  return tierId === 'over-1000';
}

export function isLargeTierId(tierId: RetreatPricingTierId): boolean {
  return LARGE_TIER_IDS.has(tierId);
}

export function getCardIdFromTierId(tierId: RetreatPricingTierId): RetreatPricingCardId {
  if (isLargeTierId(tierId)) return '201-plus';
  return tierId as Exclude<RetreatPricingCardId, '201-plus'>;
}

export function getRetreatPricingTier(id: RetreatPricingTierId): RetreatPricingTier {
  return RETREAT_PRICING_TIERS.find((tier) => tier.id === id) ?? RETREAT_PRICING_TIERS[0];
}

export function formatRetreatSupplyPrice(supplyPrice: number): string {
  if (supplyPrice <= 0) return '무료';
  return `${supplyPrice.toLocaleString('ko-KR')}원`;
}
