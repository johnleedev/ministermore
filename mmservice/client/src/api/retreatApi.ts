import axios from 'axios';
import ServiceAPIURL from '../ServiceAPIURL';
import type {
  RetreatDetail,
  RetreatInfoForm,
  RetreatListItem,
  RetreatProgramRow,
  RetreatRequestRow,
} from '../screens/retreat/types';

const base = `${ServiceAPIURL}/api/retreat`;

export async function fetchRetreatList(userAccount: string): Promise<RetreatListItem[]> {
  const res = await axios.get(`${base}/list`, { params: { userAccount } });
  if (!res.data?.ok) throw new Error(res.data?.message || '목록을 불러오지 못했습니다.');
  return res.data.list ?? [];
}

export async function fetchRetreatDetail(
  bookletId: number,
  userAccount: string,
): Promise<RetreatDetail> {
  const res = await axios.get(`${base}/detail/${bookletId}`, {
    params: { userAccount },
  });
  if (!res.data?.ok) throw new Error(res.data?.message || '상세 정보를 불러오지 못했습니다.');
  return {
    main: res.data.main,
    info: res.data.info,
    programs: res.data.programs ?? [],
  };
}

export async function saveRetreatInfo(
  bookletId: number,
  userAccount: string,
  info: RetreatInfoForm,
): Promise<void> {
  const res = await axios.post(`${base}/info`, { bookletId, userAccount, info });
  if (!res.data?.ok) throw new Error(res.data?.message || '수련회 정보 저장에 실패했습니다.');
}

export async function saveRetreatPrograms(
  bookletId: number,
  userAccount: string,
  programs: RetreatProgramRow[],
): Promise<void> {
  const res = await axios.post(`${base}/programs`, { bookletId, userAccount, programs });
  if (!res.data?.ok) throw new Error(res.data?.message || '프로그램 저장에 실패했습니다.');
}

export async function fetchRetreatRequests(
  bookletId: number | string,
  userAccount: string,
): Promise<RetreatRequestRow[]> {
  const res = await axios.get(`${base}/requests/${bookletId}`, {
    params: { userAccount },
  });
  if (!res.data?.ok) throw new Error(res.data?.message || '신청자 목록을 불러오지 못했습니다.');
  return res.data.list ?? [];
}

export async function submitRetreatRequest(payload: {
  bookletId: string;
  userName: string;
  userPhone: string;
  userGroup?: string;
  note?: string;
}): Promise<void> {
  const res = await axios.post(`${base}/request`, payload);
  if (!res.data?.ok) throw new Error(res.data?.message || '참가 신청에 실패했습니다.');
}
