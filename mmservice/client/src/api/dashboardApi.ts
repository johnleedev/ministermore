import axios from 'axios';
import ServiceAPIURL from '../ServiceAPIURL';
import {
  EMPTY_SERVICE_SUBSCRIPTIONS,
  SERVICE_TYPE_KEYS,
  type ServiceSubscriptions,
  type ServiceTypeKey,
} from '../constants/serviceCatalog';

export type SubscriptionAccess = {
  hasAccess: boolean;
  expireDate: string | null;
};

export type DashboardSubscriptions = {
  userId: string;
  subscriptions: ServiceSubscriptions;
};

/** API/DB 구 service_type → 현재 5종 키 */
const API_SUBSCRIPTION_KEY_MAP: Record<string, ServiceTypeKey> = {
  FLYER_RETREAT: 'FLYER_RETREAT',
  RETREAT: 'FLYER_RETREAT',
  CHURCH_APP: 'CHURCH_APP',
  PUSH: 'CHURCH_APP',
  ATTENDANCE: 'ATTENDANCE',
  FLYER_INTRO: 'FLYER_INTRO',
  FLYER: 'FLYER_INTRO',
  FLYER_EVENT: 'FLYER_EVENT',
  EVENT: 'FLYER_EVENT',
};

function mergeSubscriptionAccess(
  current: SubscriptionAccess,
  incoming: SubscriptionAccess,
): SubscriptionAccess {
  if (incoming.hasAccess && !current.hasAccess) return incoming;
  if (current.hasAccess && !incoming.hasAccess) return current;
  if (incoming.hasAccess && current.hasAccess) {
    const cur = current.expireDate || '';
    const next = incoming.expireDate || '';
    return { hasAccess: true, expireDate: next >= cur ? incoming.expireDate : current.expireDate };
  }
  return current.expireDate ? current : incoming;
}

function parseApiSubscriptions(raw: Record<string, unknown>): ServiceSubscriptions {
  const subscriptions = { ...EMPTY_SERVICE_SUBSCRIPTIONS };

  for (const [rawKey, value] of Object.entries(raw)) {
    const mappedKey = API_SUBSCRIPTION_KEY_MAP[String(rawKey).trim().toUpperCase()];
    if (!mappedKey || !value || typeof value !== 'object') continue;

    const access = value as SubscriptionAccess;
    subscriptions[mappedKey] = mergeSubscriptionAccess(subscriptions[mappedKey], {
      hasAccess: Boolean(access.hasAccess),
      expireDate: access.expireDate ?? null,
    });
  }

  return subscriptions;
}

export async function fetchDashboardSubscriptions(
  userId: string,
): Promise<DashboardSubscriptions> {
  const id = userId.trim();
  if (!id) {
    return { userId: '', subscriptions: { ...EMPTY_SERVICE_SUBSCRIPTIONS } };
  }

  const res = await axios.get(`${ServiceAPIURL}/api/dashboard/subscriptions`, {
    params: { userId: id },
  });

  if (!res.data?.ok) {
    throw new Error(res.data?.message || '구독 정보를 불러오지 못했습니다.');
  }

  const subs = (res.data.subscriptions ?? {}) as Record<string, unknown>;
  const subscriptions = parseApiSubscriptions(subs);

  // 신규 키가 직접 온 경우 SERVICE_TYPE_KEYS 기준으로 한 번 더 병합
  for (const key of SERVICE_TYPE_KEYS) {
    const direct = subs[key] as SubscriptionAccess | undefined;
    if (direct && typeof direct === 'object') {
      subscriptions[key] = mergeSubscriptionAccess(subscriptions[key], {
        hasAccess: Boolean(direct.hasAccess),
        expireDate: direct.expireDate ?? null,
      });
    }
  }

  return {
    userId: res.data.userId || id,
    subscriptions,
  };
}

export type { ServiceTypeKey, ServiceSubscriptions };
