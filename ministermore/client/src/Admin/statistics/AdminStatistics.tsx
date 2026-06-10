import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../Admin.scss';
import './AdminStatistics.scss';
import MainURL from '../../MainURL';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

type VisitStatByIp = {
  date: string;
  uniqueVisitors: number;
  totalVisits: number;
};

type VisitStatByCount = {
  date: string;
  totalVisits: number;
};

type CountMetrics = Record<string, VisitStatByCount[]>;

type PlatformStats = {
  visitors: VisitStatByIp[];
  metrics: CountMetrics;
};

type DashboardResponse = {
  web: PlatformStats;
  app: PlatformStats;
  users: UserStats;
};

type UserStats = {
  totalUsers: number;
  todaySignups: number;
};

type MergedStatRow = {
  date: string;
  uniqueVisitors: number;
  totalVisits: number;
  mainConnect: number;
  recruitView: number;
  retreatMenu: number;
  serviceMenu: number;
  praiseView: number;
};

const METRIC_KEYS = [
  'mainconnect',
  'recruitview',
  'retreatmenu',
  'servicemenu',
  'praisewordclick',
] as const;

const METRIC_COLUMNS: { key: (typeof METRIC_KEYS)[number]; label: string }[] = [
  { key: 'mainconnect', label: '메인 접속수' },
  { key: 'recruitview', label: 'recruit 상세 접속수' },
  { key: 'retreatmenu', label: '수련회 클릭수' },
  { key: 'servicemenu', label: '서비스 클릭수' },
  { key: 'praisewordclick', label: '찬양 클릭수' },
];

function mergePlatformStats(platform: PlatformStats): MergedStatRow[] {
  const allDates = new Set<string>();
  platform.visitors.forEach((row) => allDates.add(row.date));
  METRIC_KEYS.forEach((key) => {
    (platform.metrics[key] || []).forEach((row) => allDates.add(row.date));
  });

  return Array.from(allDates)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      const ipStat = platform.visitors.find((s) => s.date === date);
      const metricValue = (key: (typeof METRIC_KEYS)[number]) =>
        platform.metrics[key]?.find((s) => s.date === date)?.totalVisits ?? 0;

      return {
        date,
        uniqueVisitors: Number(ipStat?.uniqueVisitors ?? 0),
        totalVisits: Number(ipStat?.totalVisits ?? 0),
        mainConnect: metricValue('mainconnect'),
        recruitView: metricValue('recruitview'),
        retreatMenu: metricValue('retreatmenu'),
        serviceMenu: metricValue('servicemenu'),
        praiseView: metricValue('praisewordclick'),
      };
    });
}

type StatsTab = 'web' | 'app';

const STATS_TABS: { value: StatsTab; label: string }[] = [
  { value: 'web', label: '웹 통계' },
  { value: 'app', label: '앱 통계' },
];

const STATS_TAB_HINTS: Record<StatsTab, string> = {
  web: '홈페이지(client) 접속·메뉴 클릭 데이터입니다. 순방문자는 IP 기준입니다.',
  app: 'React Native 앱(comministermore) 데이터입니다. 순방문자는 기기 ID 기준이며, 앱 실행·탭·화면 이벤트는 app_ 접두사로 저장됩니다.',
};

function UserStatsSummary({ users }: { users: UserStats }) {
  return (
    <div className="admin-statistics-user-summary">
      <div className="admin-statistics-user-summary__card">
        <span className="admin-statistics-user-summary__label">현재 회원 수</span>
        <strong className="admin-statistics-user-summary__value">
          {users.totalUsers.toLocaleString('ko-KR')}명
        </strong>
      </div>
      <div className="admin-statistics-user-summary__card">
        <span className="admin-statistics-user-summary__label">오늘 가입</span>
        <strong className="admin-statistics-user-summary__value">
          {users.todaySignups.toLocaleString('ko-KR')}명
        </strong>
      </div>
    </div>
  );
}

function StatsSection({
  chartTitle,
  hint,
  rows,
}: {
  chartTitle: string;
  hint: string;
  rows: MergedStatRow[];
}) {
  const chartLabels = useMemo(() => [...rows].map((s) => s.date).reverse(), [rows]);

  return (
    <section style={{ marginBottom: 48 }}>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>{hint}</p>

      {rows.length === 0 ? (
        <div style={{ color: '#64748b', marginBottom: 24 }}>표시할 데이터가 없습니다.</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1100, marginBottom: 32 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '8px 12px', border: '1px solid #ddd' }}>날짜</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #ddd' }}>순방문자수</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #ddd' }}>총 방문수</th>
                  {METRIC_COLUMNS.map((col) => (
                    <th key={col.key} style={{ padding: '8px 12px', border: '1px solid #ddd' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((stat) => (
                  <tr key={stat.date}>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{stat.date}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{stat.uniqueVisitors}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{stat.totalVisits}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{stat.mainConnect}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{stat.recruitView}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{stat.retreatMenu}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{stat.serviceMenu}</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #ddd' }}>{stat.praiseView}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Line
            data={{
              labels: chartLabels,
              datasets: [
                {
                  label: '순방문자수',
                  data: [...rows].map((s) => s.uniqueVisitors).reverse(),
                  borderColor: 'rgb(255, 99, 132)',
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  tension: 0.2,
                },
                {
                  label: '총 방문수',
                  data: [...rows].map((s) => s.totalVisits).reverse(),
                  borderColor: 'rgb(54, 162, 235)',
                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
                  tension: 0.2,
                },
                {
                  label: '메인 접속수',
                  data: [...rows].map((s) => s.mainConnect).reverse(),
                  borderColor: 'rgb(255, 206, 86)',
                  backgroundColor: 'rgba(255, 206, 86, 0.2)',
                  tension: 0.2,
                },
                {
                  label: 'recruit 상세 접속수',
                  data: [...rows].map((s) => s.recruitView).reverse(),
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0.2,
                },
                {
                  label: '수련회 클릭수',
                  data: [...rows].map((s) => s.retreatMenu).reverse(),
                  borderColor: 'rgb(153, 102, 255)',
                  backgroundColor: 'rgba(153, 102, 255, 0.2)',
                  tension: 0.2,
                },
                {
                  label: '서비스 클릭수',
                  data: [...rows].map((s) => s.serviceMenu).reverse(),
                  borderColor: 'rgb(99, 255, 132)',
                  backgroundColor: 'rgba(99, 255, 132, 0.2)',
                  tension: 0.2,
                },
                {
                  label: '찬양 클릭수',
                  data: [...rows].map((s) => s.praiseView).reverse(),
                  borderColor: 'rgb(255, 159, 64)',
                  backgroundColor: 'rgba(255, 159, 64, 0.2)',
                  tension: 0.2,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: true, text: `${chartTitle} 그래프` },
              },
              scales: {
                x: { title: { display: true, text: '날짜' } },
                y: { title: { display: true, text: '수치' }, beginAtZero: true },
              },
            }}
          />
        </>
      )}
    </section>
  );
}

export default function AdminStatistics() {
  const [activeTab, setActiveTab] = useState<StatsTab>('web');
  const [webStats, setWebStats] = useState<PlatformStats>({ visitors: [], metrics: {} });
  const [appStats, setAppStats] = useState<PlatformStats>({ visitors: [], metrics: {} });
  const [userStats, setUserStats] = useState<UserStats>({ totalUsers: 0, todaySignups: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVisitStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<DashboardResponse>(`${MainURL}/admin/statistics/dashboard`);
      setWebStats(res.data?.web ?? { visitors: [], metrics: {} });
      setAppStats(res.data?.app ?? { visitors: [], metrics: {} });
      setUserStats({
        totalUsers: Number(res.data?.users?.totalUsers ?? 0),
        todaySignups: Number(res.data?.users?.todaySignups ?? 0),
      });
    } catch {
      setError('통계 데이터를 불러오지 못했습니다.');
      setWebStats({ visitors: [], metrics: {} });
      setAppStats({ visitors: [], metrics: {} });
      setUserStats({ totalUsers: 0, todaySignups: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVisitStats();
  }, [fetchVisitStats]);

  const webRows = useMemo(() => mergePlatformStats(webStats), [webStats]);
  const appRows = useMemo(() => mergePlatformStats(appStats), [appStats]);
  const activeRows = activeTab === 'web' ? webRows : appRows;
  const activeTabMeta = STATS_TABS.find((t) => t.value === activeTab)!;

  return (
    <div className="admin-register service-detail-overview">
      <div className="inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>방문자 통계 (최근 30일)</h2>
          <button
            type="button"
            onClick={() => void fetchVisitStats()}
            disabled={loading}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '불러오는 중...' : '새로고침'}
          </button>
        </div>

        {!loading && !error && <UserStatsSummary users={userStats} />}

        <div className="service-detail-overview__tabs" role="tablist" aria-label="통계 플랫폼">
          {STATS_TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={activeTab === value}
              className={`service-detail-overview__tab${activeTab === value ? ' is-active' : ''}`}
              onClick={() => setActiveTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="service-detail-overview__empty">로딩중...</div>
        ) : error ? (
          <div className="service-detail-overview__empty" style={{ color: '#dc2626' }}>
            {error}
          </div>
        ) : (
          <StatsSection
            chartTitle={activeTabMeta.label}
            hint={STATS_TAB_HINTS[activeTab]}
            rows={activeRows}
          />
        )}
      </div>
      <div style={{ height: '200px' }} />
    </div>
  );
}
