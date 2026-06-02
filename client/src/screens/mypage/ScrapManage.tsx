import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import MypageMenu from './MypageMenu';
import './Mypage.scss';
import { recoilUserData } from '../../RecoilStore';
import { fetchScrapList, type ScrapListItem } from './scrapApi';

type FilterType = 'all' | 'recruit' | 'retreat_place' | 'retreat_casting';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'recruit', label: '구인구직' },
  { id: 'retreat_place', label: '수련회 장소' },
  { id: 'retreat_casting', label: '수련회 강사' },
];

function fallbackPath(item: ScrapListItem) {
  if (item.targetType === 'recruit') {
    if (item.tableType === 'church') return `/recruit/recruitchoirdetail?id=${item.targetId}`;
    if (item.tableType === 'institute') return `/recruit/recruitinstitutedetail?id=${item.targetId}`;
    return `/recruit/recruitministerdetail?id=${item.targetId}`;
  }
  if (item.targetType === 'retreat_place') {
    return `/retreat/place/detail?id=${item.targetId}`;
  }
  return `/retreat/casting/detail?id=${item.targetId}`;
}

export default function ScrapManage() {
  const navigate = useNavigate();
  const [userData] = useRecoilState(recoilUserData);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [list, setList] = useState<ScrapListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchScrapList(userData.userAccount || '');
        if (!cancelled) setList(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userData.userAccount]);

  const filteredList = useMemo(() => {
    if (filter === 'all') return list;
    return list.filter(item => item.targetType === filter);
  }, [filter, list]);

  return (
    <div className="mypage">
      <div className="inner">
        <MypageMenu />
        <div className="subpage__main">
          <div className="subpage__main__title">스크랩 관리</div>
          <div className="subpage__main__content">
            <div className="postingList">
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {FILTERS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: filter === tab.id ? '#333' : '#fff',
                      color: filter === tab.id ? '#fff' : '#333',
                      border: '1px solid #333',
                    }}
                    onClick={() => setFilter(tab.id)}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="noPosts">
                  <p>불러오는 중입니다...</p>
                </div>
              ) : filteredList.length > 0 ? (
                filteredList.map(item => (
                  <div
                    key={item.id}
                    className="postingItem"
                    onClick={() => {
                      navigate(item.linkPath || fallbackPath(item));
                      window.scrollTo(0, 0);
                    }}>
                    <div className="postingHeader">
                      <div className="postingTitle">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                          <span className="categoryTag">{item.targetType}</span>
                          <h3 style={{ margin: 0 }}>{item.title || '(제목 없음)'}</h3>
                        </div>
                        <span className="postingDate">{new Date(item.createdAt).toLocaleString('ko-KR')}</span>
                      </div>
                    </div>
                    <div className="postingInfo">
                      {item.subtitle ? (
                        <div className="infoRow">
                          <span className="infoLabel">부제:</span>
                          <span className="infoValue">{item.subtitle}</span>
                        </div>
                      ) : null}
                      {item.meta ? (
                        <div className="infoRow">
                          <span className="infoLabel">정보:</span>
                          <span className="infoValue">{item.meta}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="noPosts">
                  <p>스크랩한 항목이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
