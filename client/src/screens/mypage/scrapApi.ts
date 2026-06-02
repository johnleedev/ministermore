import axios from 'axios';
import MainURL from '../../MainURL';

export type ScrapTargetType = 'recruit' | 'retreat_place' | 'retreat_casting';

export type ScrapTarget = {
  targetType: ScrapTargetType;
  targetId: string | number;
  tableType?: string;
};

export type ScrapPayload = ScrapTarget & {
  title?: string;
  subtitle?: string;
  meta?: string;
  thumb?: string;
  linkPath?: string;
};

export type ScrapListItem = {
  id: number;
  userAccount: string;
  targetType: ScrapTargetType;
  targetId: string;
  tableType: string;
  title: string;
  subtitle: string;
  meta: string;
  thumb: string;
  linkPath: string;
  createdAt: string;
};

function keyOf(item: { targetType: string; targetId: string | number; tableType?: string }) {
  return `${item.targetType}:${item.tableType || ''}:${String(item.targetId)}`;
}

export async function fetchScrapStatusMap(userAccount: string, targets: ScrapTarget[]) {
  if (!userAccount || !targets.length) return {};
  const res = await axios.post(`${MainURL}/mypage/getscrapstatus`, { userAccount, targets });
  return res.data?.result || {};
}

export async function toggleScrap(
  userAccount: string,
  payload: ScrapPayload,
): Promise<{ scrapped: boolean }> {
  const res = await axios.post(`${MainURL}/mypage/scraptoggle`, { userAccount, ...payload });
  return { scrapped: Boolean(res.data?.scrapped) };
}

export async function fetchScrapList(userAccount: string): Promise<ScrapListItem[]> {
  if (!userAccount) return [];
  const res = await axios.get(`${MainURL}/mypage/getscraplist/${encodeURIComponent(userAccount)}`);
  return Array.isArray(res.data) ? (res.data as ScrapListItem[]) : [];
}

export { keyOf as scrapKeyOf };
