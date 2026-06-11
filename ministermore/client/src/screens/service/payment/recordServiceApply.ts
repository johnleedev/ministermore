import axios from 'axios';
import MainURL from '../../../MainURL';

export type ServiceApplyRecordPayload = {
  serviceType: string;
  orderName: string;
  userAccount: string;
  churchName?: string | null;
  passwd?: string | null;
  ownerpw?: string | null;
  ordererName: string;
  ordererPhone: string;
  amount?: number;
  vat?: number;
  totalAmount?: number;
  paymentStatus: string;
  paymentId?: string;
  billingKey?: string;
  memo?: string;
};

export async function recordServiceApply(payload: ServiceApplyRecordPayload): Promise<boolean> {
  try {
    const res = await axios.post<{ ok?: boolean }>(`${MainURL}/serviceapply/record`, payload);
    return !!res.data?.ok;
  } catch (err) {
    console.error('failed to record service apply:', err);
    return false;
  }
}
