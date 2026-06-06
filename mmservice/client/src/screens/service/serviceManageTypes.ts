export interface BookletItem {
  id: number;
  title: string;
  churchName: string;
  mainPastor: string;
  imageMainName: string;
  link?: string;
}

export interface EventBookletItem {
  id: number;
  eventName: string;
  date: string;
  place: string;
  address: string;
  superViser: string;
  imageMainName: string;
  link?: string;
}

export type ServiceApplyRow = {
  id: number;
  serviceType: string;
  orderName?: string;
  userAccount?: string;
  churchName?: string;
  ordererName?: string;
  ordererPhone?: string;
  amount?: number;
  vat?: number;
  totalAmount?: number;
  paymentStatus?: string;
  paymentId?: string;
  billingKey?: string;
  memo?: string;
  status?: string;
  createdAt?: string;
};
