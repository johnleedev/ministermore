import axios from 'axios';
import { MAIN_API_BASE } from '../config/api';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

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

export function scrapKeyOf(item: { targetType: string; tableType?: string; targetId: string | number }) {
  return `${item.targetType}:${item.tableType || ''}:${String(item.targetId)}`;
}

export async function fetchScrapStatusMap(userAccount: string, targets: ScrapTarget[]) {
  if (!userAccount || !targets.length) return {};
  const res = await axios.post(`${API_BASE}/mypage/getscrapstatus`, { userAccount, targets });
  return res.data?.result || {};
}

export async function toggleScrap(userAccount: string, payload: ScrapPayload) {
  const res = await axios.post(`${API_BASE}/mypage/scraptoggle`, { userAccount, ...payload });
  return { scrapped: Boolean(res.data?.scrapped) };
}

export async function fetchScrapList(userAccount: string): Promise<ScrapListItem[]> {
  if (!userAccount) return [];
  const res = await axios.get(`${API_BASE}/mypage/getscraplist/${encodeURIComponent(userAccount)}`);
  return Array.isArray(res.data) ? (res.data as ScrapListItem[]) : [];
}
