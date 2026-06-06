import MmserviceURL from './MmserviceURL';

/** 서비스 제작(mmservice) 페이지로 이동 */
export default function goToMmservice(path: string) {
  const base = MmserviceURL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  window.location.href = `${base}${normalized}`;
}
