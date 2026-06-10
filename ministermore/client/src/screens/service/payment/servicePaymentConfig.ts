import { calcPriceWithVat } from './paymentConstants';

export type ServicePaymentKind = 'billing' | 'oneTime' | 'inquiry';

export type ServicePaymentConfig = {
  kind: ServicePaymentKind;
  supplyPrice: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  orderName: string;
};

export function defineServicePaymentConfig(input: {
  kind: ServicePaymentKind;
  supplyPrice: number;
  orderName: string;
  vatRate?: number;
}): ServicePaymentConfig {
  const vatRate = input.vatRate ?? 0.1;
  const { supplyPrice, vatAmount, totalAmount } = calcPriceWithVat(input.supplyPrice, vatRate);
  return {
    kind: input.kind,
    orderName: input.orderName,
    vatRate,
    supplyPrice,
    vatAmount,
    totalAmount,
  };
}
