import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { recoilLoginState } from '../../../../RecoilStore';
import './BulletinTemplateSelect.scss';
import {
  BULLETIN_EDITOR_TABS,
  DEFAULT_BULLETIN_TEMPLATE,
  type BulletinEditorTabId,
} from './bulletinTemplateTypes';

const SAMPLE_TAB: BulletinEditorTabId = 'order';

export default function BulletinTemplateSelect() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
  const [orderTitle, setOrderTitle] = useState('');
  const [ordererName, setOrdererName] = useState('');
  const [ordererPhone, setOrdererPhone] = useState('');

  const templateId = DEFAULT_BULLETIN_TEMPLATE;
  const tabsWrapClass = `bulletin-create__tabs-wrap--${templateId}`;

  const handleStart = useCallback(() => {
    if (!isLogin) {
      alert('로그인이 필요합니다.');
      return;
    }
    const titleTrim = orderTitle.trim();
    const nameTrim = ordererName.trim();
    const phoneDigits = ordererPhone.trim().replace(/\s/g, '');
    if (!titleTrim || !nameTrim || !phoneDigits) {
      alert('주보 제목, 이름, 연락처를 모두 입력해 주세요.');
      return;
    }
    const q = new URLSearchParams();
    q.set('title', titleTrim);
    navigate(`/service/bookletbulletincreate?${q.toString()}`);
  }, [isLogin, navigate, orderTitle, ordererName, ordererPhone]);

  return (
    <div className="bulletin-template-select">
      <div className="bulletin-template-select__body">
        <div className="bulletin-template-select__inner">
          <aside className="bulletin-create__preview-wrap" aria-label="샘플 미리보기">
            <div className="bulletin-create__phone-frame">
              <div className="bulletin-create__phone-notch" />
              <div className="bulletin-create__phone-screen">
                <div className="bulletin-create__preview">
                  <div className="bulletin-create__preview-hero">
                    <p className="bulletin-create__preview-hero-kicker">Sunday Worship Bulletin</p>
                    <h2 className="bulletin-create__preview-hero-title">샘플 교회</h2>
                    <p className="bulletin-create__preview-hero-date">이번 주 주보 · 2026년 4월 15일</p>
                  </div>

                  <div className={`bulletin-create__preview-tabs ${tabsWrapClass}`}>
                    {BULLETIN_EDITOR_TABS.map((t) => (
                      <div
                        key={t.id}
                        className={`bulletin-create__preview-tab ${SAMPLE_TAB === t.id ? 'on' : ''}`}
                      >
                        {t.label}
                      </div>
                    ))}
                  </div>

                  <div className="bulletin-create__preview-body">
                    <p className="bulletin-create__preview-section-title">예배 순서</p>
                    <div className="bulletin-create__order-list">
                      {[
                        { num: '1', title: '예배로 부름', sub: 'Call to Worship', right: '09:00' },
                        { num: '2', title: '찬양과 기도', sub: 'Praise & Prayer', right: '09:10' },
                        { num: '3', title: '말씀 선포', sub: 'Sermon Message', right: '09:30' },
                      ].map((r) => (
                        <div key={r.num} className="bulletin-create__order-item">
                          <div className="bulletin-create__order-left">
                            <div className="bulletin-create__order-num">{r.num}</div>
                            <div className="bulletin-create__order-label">
                              <b>{r.title}</b>
                              <span>{r.sub}</span>
                            </div>
                          </div>
                          <span className="bulletin-create__order-right">{r.right}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="bulletin-template-select__form-wrap" aria-label="주문 정보">
            <div className="bulletin-template-select__form-scroll">
              <div className="bulletin-template-select__form-head">
                <h1>모바일 주보 제작</h1>
                <p>
                  주보 제목과 연락처를 입력한 뒤 작성 화면으로 이동합니다. 왼쪽은 레이아웃 샘플입니다.
                </p>
              </div>

              <div className="bulletin-create__field">
                <label htmlFor="bulletin-order-title">주보 제목</label>
                <input
                  id="bulletin-order-title"
                  type="text"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  placeholder="예: 제○○주 주일예배 주보"
                  autoComplete="off"
                />
              </div>
              <div className="bulletin-create__field">
                <label htmlFor="bulletin-order-name">이름</label>
                <input
                  id="bulletin-order-name"
                  type="text"
                  value={ordererName}
                  onChange={(e) => setOrdererName(e.target.value)}
                  placeholder="담당자 이름"
                  autoComplete="name"
                />
              </div>
              <div className="bulletin-create__field">
                <label htmlFor="bulletin-order-phone">연락처</label>
                <input
                  id="bulletin-order-phone"
                  type="text"
                  inputMode="tel"
                  value={ordererPhone}
                  onChange={(e) => setOrdererPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  autoComplete="tel"
                />
              </div>

              <p className="bulletin-template-select__hint">
                서버 저장·결제 연동은 추후 연결할 수 있도록 동일한 단계(템플릿 선택 → 작성 → 완료)로 구성했습니다.
              </p>
            </div>

            <div className="bulletin-template-select__form-footer">
              <button type="button" className="bulletin-template-select__submit" onClick={handleStart}>
                주보 작성 시작
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
