import { useState } from 'react';
import '../Company.scss';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainURL from '../../../MainURL';
import { useRecoilValue } from 'recoil';
import { recoilLoginState, recoilUserData } from '../../../RecoilStore';

const INQUIRY_CATEGORIES = ['오류 신고', '기능 제안', '이용 문의', '광고·제휴', '기타'] as const;

type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

export default function Inquiry() {
  const navigate = useNavigate();
  const isLogin = useRecoilValue(recoilLoginState);
  const userData = useRecoilValue(recoilUserData);
  const [category, setCategory] = useState<InquiryCategory | ''>('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const registerInquiry = async () => {
    if (!category) {
      alert('문의 종류를 선택해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('문의 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${MainURL}/inquiry/submit`, {
        category,
        content: content.trim(),
        contact: contact.trim(),
        userAccount: isLogin ? userData.userAccount : '',
        userNickName: isLogin ? userData.userNickName : '',
        platform: 'web',
      });
      if (res.data?.success) {
        alert('문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.');
        navigate(-1);
      } else {
        alert(res.data?.message || '문의 접수에 실패했습니다.');
      }
    } catch {
      alert('문의 접수에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="company">
      <div className="inner">
        <div className="subpage__main">
          <div className="subpage__main__title">문의하기</div>
          <div className="subpage__main__content company-inquiry">
            <p className="company-inquiry__lead">
              오류 신고, 기능 제안, 이용 문의, 광고·제휴 등 궁금한 점을 남겨주시면 운영팀이
              확인 후 답변드립니다.
            </p>

            <div className="company-inquiry__field">
              <div className="company-inquiry__label">문의 종류</div>
              <div className="company-inquiry__chips">
                {INQUIRY_CATEGORIES.map(item => (
                  <button
                    key={item}
                    type="button"
                    className={`company-inquiry__chip${category === item ? ' is-active' : ''}`}
                    onClick={() => setCategory(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="company-inquiry__field">
              <div className="company-inquiry__label">문의 내용</div>
              <textarea
                className="company-inquiry__textarea"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="문의 내용을 입력해주세요."
                maxLength={5000}
                rows={12}
              />
              <div className="company-inquiry__counter">{content.length}/5000</div>
            </div>

            <div className="company-inquiry__field">
              <div className="company-inquiry__label">연락받으실 연락처</div>
              <input
                className="company-inquiry__input"
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="전화번호나 메일"
                maxLength={100}
                autoComplete="tel email"
              />
            </div>

            <div className="company-inquiry__actions">
              <button
                type="button"
                className="company-inquiry__submit"
                disabled={submitting}
                onClick={() => void registerInquiry()}>
                {submitting ? '접수 중...' : '문의 접수하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
