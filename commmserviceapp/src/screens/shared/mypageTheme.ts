/** 온보딩·마이페이지·알림 공통 디자인 토큰 (HTML mockup 기준) */
export const mpColors = {
  bg: '#f5f8fd',
  card: '#ffffff',
  primary: '#1967ff',
  primarySoft: '#eff6ff',
  text: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  textLight: '#94a3b8',
  border: '#e8eef8',
  borderSoft: '#e3ebf8',
  chipBorder: '#d9e4f7',
  dotInactive: '#d6e2f5',
  toggleOff: '#d9e3f3',
  shadow: 'rgba(148, 163, 184, 0.12)',
  pillJobBg: '#eaf2ff',
  pillJobText: '#1967ff',
  pillRetreatBg: '#edf9f0',
  pillRetreatText: '#2f8f4e',
  pillCommunityBg: '#f6eeff',
  pillCommunityText: '#7c3aed',
  pillWorshipBg: '#fff3e8',
  pillWorshipText: '#c97316',
  pillNoticeBg: '#fff4d9',
  pillNoticeText: '#a16207',
  tipBg: '#eff6ff',
  tipText: '#3563b8',
  highlightBg: '#f8fbff',
  highlightBorder: '#e4ecfb',
  logoGradientStart: '#1d4ed8',
  logoGradientEnd: '#63b3ff',
} as const;

/** App.tsx SafeAreaLayout이 status bar inset을 처리하므로 화면에서는 추가 inset.top 불필요 */
export const MP_SCREEN_PADDING_H = 18;
export const MP_SCREEN_PADDING_TOP = 8;

export type NotificationCategory = 'all' | 'notice' | 'job' | 'retreat' | 'community' | 'worship';

export const NOTIFICATION_TABS: { key: NotificationCategory; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'notice', label: '공지' },
  { key: 'job', label: '구인구직' },
  { key: 'retreat', label: '수련회' },
  { key: 'community', label: '게시판' },
  { key: 'worship', label: '예배사역' },
];

export function inferNotificationCategory(title: string, content: string): Exclude<NotificationCategory, 'all'> {
  const text = `${title} ${content}`;
  if (/공지|안내|점검|업데이트|서비스\s*공지/.test(text)) return 'notice';
  if (/수련회|장소|후기|강사/.test(text)) return 'retreat';
  if (/게시판|게시글|댓글|답변|등업/.test(text)) return 'community';
  if (/예배|찬양|콘티|설교|적용찬양/.test(text)) return 'worship';
  return 'job';
}

export function categoryPillStyle(category: Exclude<NotificationCategory, 'all'>) {
  switch (category) {
    case 'notice':
      return { bg: mpColors.pillNoticeBg, text: mpColors.pillNoticeText, label: '공지' };
    case 'retreat':
      return { bg: mpColors.pillRetreatBg, text: mpColors.pillRetreatText, label: '수련회' };
    case 'community':
      return { bg: mpColors.pillCommunityBg, text: mpColors.pillCommunityText, label: '게시판' };
    case 'worship':
      return { bg: mpColors.pillWorshipBg, text: mpColors.pillWorshipText, label: '예배사역' };
    default:
      return { bg: mpColors.pillJobBg, text: mpColors.pillJobText, label: '구인구직' };
  }
}

export function formatNotificationListTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (d >= startOfToday) return `오늘 · ${time}`;
  if (d >= startOfYesterday) return `어제 · ${time}`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function notificationDaySection(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '이전';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (d >= startOfToday) return '오늘';
  if (d >= startOfYesterday) return '어제';
  return '이전';
}
