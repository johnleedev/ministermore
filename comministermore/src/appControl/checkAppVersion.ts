import { Platform } from 'react-native';
import axios from 'axios';
import { MAIN_API_BASE } from '../config/api';
import { APP_VERSION_CODE, APP_VERSION_NAME } from '../config/appVersion';

export type ForceUpdateInfo = {
  message: string;
  storeUrl: string;
  latestVersionName?: string | null;
};

type CheckResponse = {
  success?: boolean;
  forceUpdate?: boolean;
  message?: string | null;
  storeUrl?: string | null;
  latestVersionName?: string | null;
};

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

/** 앱 시작 시 버전 확인. 강제 업데이트 필요 시 정보 반환, 아니면 null */
export async function fetchForceUpdateInfo(): Promise<ForceUpdateInfo | null> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  try {
    const { data } = await axios.get<CheckResponse>(`${API_BASE}/appcontrol/check`, {
      params: {
        platform,
        versionCode: APP_VERSION_CODE,
        versionName: APP_VERSION_NAME,
      },
      timeout: 8000,
    });

    if (!data?.success || !data.forceUpdate) {
      return null;
    }

    return {
      message:
        data.message ||
        '새 버전이 출시되었습니다. 스토어에서 업데이트 후 이용해 주세요.',
      storeUrl: data.storeUrl || '',
      latestVersionName: data.latestVersionName,
    };
  } catch (error) {
    console.warn('[appcontrol] version check failed:', error);
    return null;
  }
}
