import axios from 'axios';
import ServiceAPIURL from '../ServiceAPIURL';
import type { RetreatAuthState } from '../RecoilStore';
import {
  normalizeCustomQuestions,
  type RetreatCustomQuestion,
} from '../screens/retreat/lib/retreatRequestForm';
import type {
  RetreatAnswersResponse,
  RetreatDetail,
  RetreatInfoForm,
  RetreatListItem,
  RetreatProgramRow,
  RetreatPublicDetail,
  RetreatRequestRow,
} from '../screens/retreat/lib/types';

const base = `${ServiceAPIURL}/api/retreat`;

export type RetreatAuthParams = Pick<RetreatAuthState, 'churchName' | 'passwd' | 'ownerpw'>;

function authParams(auth: RetreatAuthParams) {
  const params: Record<string, string> = {
    churchName: auth.churchName,
    passwd: auth.passwd,
  };
  if (auth.ownerpw?.trim()) {
    params.ownerpw = auth.ownerpw.trim();
  }
  return params;
}

function authBody(auth: RetreatAuthParams, extra: Record<string, unknown> = {}) {
  return { ...authParams(auth), ...extra };
}

export async function loginRetreat(payload: {
  churchName: string;
  passwd: string;
  ownerpw?: string;
}): Promise<{ role: 'user' | 'admin'; churchName: string }> {
  const res = await axios.post(`${base}/login`, payload);
  if (!res.data?.ok) throw new Error(res.data?.message || '로그인에 실패했습니다.');
  return {
    role: res.data.role,
    churchName: res.data.churchName,
  };
}

export async function fetchRetreatList(auth: RetreatAuthParams): Promise<RetreatListItem[]> {
  const res = await axios.get(`${base}/list`, { params: authParams(auth) });
  if (!res.data?.ok) throw new Error(res.data?.message || '목록을 불러오지 못했습니다.');
  return res.data.list ?? [];
}

export async function fetchRetreatDetail(
  bookletId: number,
  auth: RetreatAuthParams,
): Promise<RetreatDetail> {
  const res = await axios.get(`${base}/detail/${bookletId}`, {
    params: authParams(auth),
  });
  if (!res.data?.ok) throw new Error(res.data?.message || '상세 정보를 불러오지 못했습니다.');
  return {
    main: res.data.main,
    info: res.data.info,
    programs: res.data.programs ?? [],
  };
}

export async function fetchRetreatPublicDetail(bookletId: number): Promise<RetreatPublicDetail> {
  const res = await axios.get(`${base}/public/${bookletId}`);
  if (!res.data?.ok) throw new Error(res.data?.message || '전단지를 불러오지 못했습니다.');
  return {
    main: res.data.main,
    info: res.data.info,
    programs: res.data.programs ?? [],
  };
}

export async function saveRetreatInfo(
  bookletId: number,
  auth: RetreatAuthParams,
  info: RetreatInfoForm,
  options?: {
    imageMainName?: string;
    mainImageFiles?: Array<File | null>;
  },
): Promise<{ imageMain?: string }> {
  const hasFiles = options?.mainImageFiles?.some(Boolean);
  if (hasFiles) {
    const formData = new FormData();
    formData.append('bookletId', String(bookletId));
    formData.append('churchName', auth.churchName);
    formData.append('passwd', auth.passwd);
    if (auth.ownerpw?.trim()) formData.append('ownerpw', auth.ownerpw.trim());
    formData.append('info', JSON.stringify(info));
    formData.append(
      'imageMainName',
      options?.imageMainName ?? info.imageMain ?? '',
    );
    options?.mainImageFiles?.forEach((file, i) => {
      if (file) formData.append(`mainImage_${i}`, file);
    });
    const res = await axios.post(`${base}/info`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!res.data?.ok) throw new Error(res.data?.message || '수련회 정보 저장에 실패했습니다.');
    return { imageMain: res.data.imageMain };
  }

  const res = await axios.post(`${base}/info`, authBody(auth, { bookletId, info }));
  if (!res.data?.ok) throw new Error(res.data?.message || '수련회 정보 저장에 실패했습니다.');
  return { imageMain: res.data.imageMain };
}

export async function saveRetreatPrograms(
  bookletId: number,
  auth: RetreatAuthParams,
  programs: RetreatProgramRow[],
): Promise<void> {
  const res = await axios.post(`${base}/programs`, authBody(auth, { bookletId, programs }));
  if (!res.data?.ok) throw new Error(res.data?.message || '프로그램 저장에 실패했습니다.');
}

export async function fetchRetreatRequests(
  bookletId: number | string,
  auth: RetreatAuthParams,
): Promise<RetreatRequestRow[]> {
  const res = await axios.get(`${base}/requests/${bookletId}`, {
    params: authParams(auth),
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

export async function fetchRetreatRequestMain(
  bookletId: number | string,
): Promise<RetreatCustomQuestion[]> {
  const res = await axios.get(`${base}/request-main/${bookletId}`);
  if (!res.data?.ok) throw new Error(res.data?.message || '질문지를 불러오지 못했습니다.');
  return normalizeCustomQuestions(res.data.customQuestions);
}

export async function saveRetreatRequestMain(
  bookletId: number,
  auth: RetreatAuthParams,
  customQuestions: RetreatCustomQuestion[],
): Promise<void> {
  const res = await axios.post(`${base}/request-main`, {
    bookletId,
    ...authParams(auth),
    customQuestions,
  });
  if (!res.data?.ok) throw new Error(res.data?.message || '질문지 저장에 실패했습니다.');
}

export async function submitRetreatAnswer(payload: {
  bookletId: string;
  userName: string;
  userPhone: string;
  userGroup?: string;
  userGender?: string;
  userAge?: string;
  note?: string;
  customAnswers?: Record<string, string | string[]>;
}): Promise<void> {
  const res = await axios.post(`${base}/answer`, payload);
  if (!res.data?.ok) throw new Error(res.data?.message || '참가 신청에 실패했습니다.');
}

export async function fetchRetreatAnswers(
  bookletId: number | string,
  auth: RetreatAuthParams,
): Promise<RetreatAnswersResponse> {
  const res = await axios.get(`${base}/answers/${bookletId}`, {
    params: authParams(auth),
  });
  if (!res.data?.ok) throw new Error(res.data?.message || '신청자 목록을 불러오지 못했습니다.');
  return {
    customQuestions: normalizeCustomQuestions(res.data.customQuestions),
    list: res.data.list ?? [],
  };
}
