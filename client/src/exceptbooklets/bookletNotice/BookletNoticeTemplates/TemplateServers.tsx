import { FaUser, FaGuitar, FaChild, FaHandsHelping, FaRegEnvelope } from 'react-icons/fa';
import MainURL from '../../../MainURL';

const TEAM_ICONS = [FaUser, FaGuitar, FaChild, FaHandsHelping];
const TEAM_STYLES = [
  { bg: '#dcfce7', icon: '#22c55e' }, // green
  { bg: '#fef9c3', icon: '#eab308' }, // yellow
  { bg: '#fce7f3', icon: '#ec4899' }, // pink
  { bg: '#f3f4f6', icon: '#6b7280' }, // gray
];

function getTeamIconAndColor(index: number) {
  const i = index % TEAM_ICONS.length;
  return { Icon: TEAM_ICONS[i], ...TEAM_STYLES[i] };
}

interface ServerItem {
  title: string;
  serverName: string;
  duty: string;
  notice: string;
  image: string;
  imageUrl?: string;
}

export interface PastorPostData {
  mainPastor?: string;
  mainPastorImage?: string;
  mainPastorMessage?: string;
}

function serverRowHasContent(s: ServerItem): boolean {
  return !!(
    String(s.serverName ?? '').trim() ||
    String(s.duty ?? '').trim() ||
    String(s.notice ?? '').trim() ||
    String(s.image ?? '').trim() ||
    String(s.imageUrl ?? '').trim()
  );
}

function ServersList(props: { serversDataList: { title: string; serverList: ServerItem[] }[] }) {
  const { serversDataList = [] } = props;

  const teamList = serversDataList
    .map((g) => ({
      title: g.title || '사역팀',
      servers: g.serverList.filter(serverRowHasContent),
    }))
    .filter((g) => g.servers.length > 0);

  const displayCount = teamList.reduce((sum, g) => sum + g.servers.length, 0);

  if (displayCount === 0) {
    return null;
  }

  const getImageUrl = (item: ServerItem) => {
    if (item.imageUrl) return item.imageUrl;
    if (item.image?.startsWith('blob:') || item.image?.startsWith('data:') || item.image?.startsWith('http')) {
      return item.image;
    }
    return item.image ? `${MainURL}/images/bookletnotice/servers/${item.image}` : '';
  };

  return (
    <div className="notice-detail__servers">
      <div className="notice-detail__servers-header">
        <h2 className="notice-detail__servers-title">섬김이들을 소개합니다</h2>
        <span className="notice-detail__servers-badge">총 {displayCount}명</span>
      </div>

      <div className="notice-detail__servers-team">
        {teamList.map((group, gIdx) => (
          <div key={gIdx} className="notice-detail__servers-group">
            <div className="notice-detail__servers-list">
              {group.servers.map((server, sIdx) => {
                const { Icon, bg, icon } = getTeamIconAndColor(gIdx * 10 + sIdx);
                return (
                  <div key={sIdx} className="notice-detail__servers-card">
                    <div
                      className="notice-detail__servers-card-avatar"
                      style={{ backgroundColor: bg, color: icon }}
                    >
                      {getImageUrl(server) ? (
                        <img src={getImageUrl(server)} alt={server.serverName} />
                      ) : (
                        <Icon className="notice-detail__servers-card-icon" />
                      )}
                    </div>
                    <div className="notice-detail__servers-card-body">
                      {group.title ? (
                        <p className="notice-detail__servers-card-group-title">{group.title}</p>
                      ) : null}
                      <div className="notice-detail__servers-card-row">
                        <div>
                          <h4 className="notice-detail__servers-card-name">
                            {server.serverName}
                            {server.duty && (
                              <span className="notice-detail__servers-card-duty"> | {server.duty}</span>
                            )}
                          </h4>
                          {server.notice && (
                            <p className="notice-detail__servers-card-desc">{server.notice}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface TemplateServersProps {
  serversDataList: { title: string; serverList: ServerItem[] }[];
  /** BookletNoticeDetail 섬김이 탭 — 담임목사 블록 포함 */
  withPastorBlock?: boolean;
  postData?: PastorPostData;
  pastorCareer?: string[];
}

export default function TemplateServers(props: TemplateServersProps) {
  const { serversDataList = [], withPastorBlock, postData, pastorCareer = [] } = props;

  const list = <ServersList serversDataList={serversDataList} />;

  if (!withPastorBlock) {
    return list;
  }

  return (
    <div className="notice-detail__servants">
      <div className="notice-detail__pastor-block">
        <div className="notice-detail__pastor-head">
          <p className="notice-detail__pastor-label">담임목사</p>
          {postData?.mainPastor && (
            <p className="notice-detail__pastor-name">{postData.mainPastor}</p>
          )}
        </div>
        <div className="notice-detail__pastor-body">
          {postData?.mainPastorImage && (
            <div className="notice-detail__pastor-photo">
              <img
                src={`${MainURL}/images/bookletnotice/pastors/${postData.mainPastorImage}`}
                alt="담임목사"
              />
            </div>
          )}
          <div className="notice-detail__pastor-copy">
            <div className="notice-detail__pastor-greeting">
              <p className="notice-detail__pastor-label">인사말</p>
              <p className="notice-detail__pastor-text">
                {postData?.mainPastorMessage || '인사말이 등록되지 않았습니다.'}
              </p>
            </div>
            <div className="notice-detail__pastor-career">
              <p className="notice-detail__pastor-label">담임목사 약력</p>
              {pastorCareer.length > 0 ? (
                <p className="notice-detail__pastor-text">
                  {pastorCareer.map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </p>
              ) : (
                <p className="notice-detail__pastor-text">약력이 등록되지 않았습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {list}
    </div>
  );
}
