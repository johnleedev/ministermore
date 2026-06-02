import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MainURL from '../../MainURL';
import type { CommunityBoardConfig, CommunityPost } from '../../screens/board/BoardTypes';
import {
  BOARD_NOTICE_SORT,
  COMMUNITY_REGION_OPTIONS,
  EVENTS_BOARD_CONFIG,
  FREE_BOARD_CONFIG,
  USED_BOARD_CONFIG,
} from '../../screens/board/boardConfigs';

type BoardKey = 'free' | 'events' | 'used';

type Props = {
  sourceConfig: CommunityBoardConfig;
  post: CommunityPost | null;
  onClose: () => void;
  onMoved: () => void;
};

const BOARD_BY_KEY: Record<BoardKey, CommunityBoardConfig> = {
  free: FREE_BOARD_CONFIG,
  events: EVENTS_BOARD_CONFIG,
  used: USED_BOARD_CONFIG,
};

const BOARD_LABELS: Record<BoardKey, string> = {
  free: '자유게시판',
  events: '집회세미나',
  used: '중고장터',
};

const getAdminMovePostRoute = (config: CommunityBoardConfig) =>
  config.adminMovePostRoute ?? `${config.routePrefix}adminmovepost`;

const pickDefaultSort = (post: CommunityPost, targetConfig: CommunityBoardConfig) => {
  const options = targetConfig.categoryOptions;
  if (options.includes(post.sort)) return post.sort;
  const fallback = options.find((c) => c !== BOARD_NOTICE_SORT) ?? options[0] ?? '';
  return fallback;
};

export default function CommunityBoardMoveModal({ sourceConfig, post, onClose, onMoved }: Props) {
  const sourceKey = sourceConfig.sort as BoardKey;

  const targetOptions = useMemo(() => {
    return (Object.keys(BOARD_BY_KEY) as BoardKey[]).filter((key) => key !== sourceKey);
  }, [sourceKey]);

  const [targetBoard, setTargetBoard] = useState<BoardKey>(targetOptions[0] ?? 'events');
  const [selectedSort, setSelectedSort] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>(COMMUNITY_REGION_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);

  const targetConfig = BOARD_BY_KEY[targetBoard];
  const targetHasRegion = Boolean(targetConfig.regionOptions?.length);

  const sortOptions = useMemo(() => {
    const base = [...targetConfig.categoryOptions];
    if (post?.sort === BOARD_NOTICE_SORT && !base.includes(BOARD_NOTICE_SORT)) {
      return [BOARD_NOTICE_SORT, ...base];
    }
    return base;
  }, [post?.sort, targetConfig.categoryOptions]);

  useEffect(() => {
    if (!post) return;
    setTargetBoard(targetOptions[0] ?? 'events');
  }, [post, targetOptions]);

  useEffect(() => {
    if (!post || !targetConfig) return;
    setSelectedSort(pickDefaultSort(post, targetConfig));
    if (targetHasRegion) {
      const fromPost = post.region?.trim();
      if (fromPost && COMMUNITY_REGION_OPTIONS.includes(fromPost as (typeof COMMUNITY_REGION_OPTIONS)[number])) {
        setSelectedRegion(fromPost);
      } else {
        setSelectedRegion(COMMUNITY_REGION_OPTIONS[0]);
      }
    }
  }, [post, targetBoard, targetConfig, targetHasRegion]);

  useEffect(() => {
    if (!post) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [post, submitting, onClose]);

  if (!post) return null;

  const movePost = async () => {
    if (!selectedSort) {
      alert('이동할 게시판의 종류를 선택해주세요.');
      return;
    }
    if (targetHasRegion && !selectedRegion) {
      alert('지역을 선택해주세요.');
      return;
    }

    const sourceLabel = BOARD_LABELS[sourceKey];
    const targetLabel = BOARD_LABELS[targetBoard];
    const regionNote = targetHasRegion ? `\n지역: ${selectedRegion}` : '';
    const confirmed = window.confirm(
      `「${post.title}」 글을\n${sourceLabel} → ${targetLabel}(으)로 옮기시겠습니까?\n\n종류: ${selectedSort}${regionNote}\n\n댓글·좋아요·첨부 이미지도 함께 이동됩니다.`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const route = getAdminMovePostRoute(sourceConfig);
      const res = await axios.post(`${MainURL}/${sourceConfig.apiBase}/${route}`, {
        postId: post.id,
        sourceBoard: sourceKey,
        targetBoard,
        sort: selectedSort,
        region: targetHasRegion ? selectedRegion : undefined,
      });

      if (res.data?.ok) {
        alert(res.data.message || '게시글이 이동되었습니다.');
        onMoved();
        onClose();
      } else {
        alert(res.data?.message || '이동에 실패했습니다.');
      }
    } catch {
      alert('이동 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-board-manage__modal-backdrop" onClick={submitting ? undefined : onClose}>
      <div
        className="admin-board-manage__modal admin-board-manage__modal--move"
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-move-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-board-manage__modal-head">
          <h3 id="board-move-title">게시판 이동</h3>
          <button
            type="button"
            className="admin-board-manage__modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="admin-board-manage__modal-body">
          <div className="admin-notice-post__form admin-board-manage__move-form">
            <p className="admin-board-manage__modal-meta">
              현재: <strong>{BOARD_LABELS[sourceKey]}</strong> · 글 번호 {post.id}
            </p>
            <p className="admin-board-manage__move-title" title={post.title}>
              {post.title}
            </p>

            <div className="admin-notice-post__field">
              <p className="admin-notice-post__label">이동할 게시판 *</p>
              <div className="admin-notice-post__chips">
                {targetOptions.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`admin-notice-post__chip${targetBoard === key ? ' admin-notice-post__chip--on' : ''}`}
                    onClick={() => setTargetBoard(key)}
                    disabled={submitting}
                  >
                    {BOARD_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-notice-post__field">
              <p className="admin-notice-post__label">종류 (이동 후) *</p>
              <div className="admin-notice-post__chips">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`admin-notice-post__chip${selectedSort === option ? ' admin-notice-post__chip--on' : ''}`}
                    onClick={() => setSelectedSort(option)}
                    disabled={submitting}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {targetHasRegion ? (
              <div className="admin-notice-post__field">
                <p className="admin-notice-post__label">지역 *</p>
                <div className="admin-notice-post__chips">
                  {COMMUNITY_REGION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`admin-notice-post__chip${selectedRegion === option ? ' admin-notice-post__chip--on' : ''}`}
                      onClick={() => setSelectedRegion(option)}
                      disabled={submitting}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="admin-board-manage__move-hint">
                  자유게시판 글은 지역 정보가 없습니다. 이동 시 지역을 선택해주세요.
                </p>
              </div>
            ) : (
              <p className="admin-board-manage__move-hint admin-board-manage__move-hint--block">
                {BOARD_LABELS[targetBoard]}에는 지역 항목이 없습니다. 기존 지역 값은 저장되지 않습니다.
              </p>
            )}
          </div>
        </div>

        <div className="admin-board-manage__modal-foot">
          <button
            type="button"
            className="admin-notice-post__btn admin-notice-post__btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="button"
            className="admin-notice-post__btn admin-notice-post__btn--primary"
            onClick={() => void movePost()}
            disabled={submitting}
          >
            {submitting ? '이동 중…' : '이동'}
          </button>
        </div>
      </div>
    </div>
  );
}
