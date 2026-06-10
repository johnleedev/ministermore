import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MAIN_API_BASE } from '../config/api';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');
const DEVICE_ID_KEY = 'admin_stats_device_id';
const SESSION_TRACKED_PREFIX = 'admin_stats_session:';

export function getTodayDate(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = `rn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

/** countall — type은 app_ 접두사로 저장 (웹 통계와 분리) */
export async function trackAppCountup(type: string): Promise<void> {
  const date = getTodayDate();
  const fullType = type.startsWith('app_') ? type : `app_${type}`;
  await axios.post(`${API_BASE}/admin/countup`, { date, type: fullType }).catch(() => null);
}

/** 일 1회: 순방문(기기) + 메인 접속 */
export async function trackAppSession(): Promise<void> {
  const date = getTodayDate();
  const sessionKey = `${SESSION_TRACKED_PREFIX}${date}`;
  const done = await AsyncStorage.getItem(sessionKey);
  if (done) {
    return;
  }

  const deviceId = await getDeviceId();
  await Promise.all([
    axios
      .post(`${API_BASE}/admin/homeusercount`, { date, ip: `app:${deviceId}` })
      .catch(() => null),
    trackAppCountup('mainconnect'),
  ]);
  await AsyncStorage.setItem(sessionKey, '1');
}
