import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import axios from "axios";
import { recoilUserData } from "../../../RecoilStore";
import MainURL from "../../../MainURL";
import "./ChurchappPayment.scss";

type ChurchappInquiryResponse = {
  ok: boolean;
  message?: string;
};

async function recordServiceApply(payload: {
  serviceType: string;
  orderName: string;
  userAccount: string;
  churchName: string;
  ordererName: string;
  ordererPhone: string;
  paymentStatus: string;
  memo?: string;
}) {
  try {
    const res = await axios.post<ChurchappInquiryResponse>(`${MainURL}/serviceapply/record`, payload);
    return !!res.data?.ok;
  } catch (err) {
    console.error("failed to record service apply (churchapp):", err);
    return false;
  }
}

export default function ChurchappPayment() {
  const navigate = useNavigate();
  const userData = useRecoilValue(recoilUserData);

  const [churchName, setChurchName] = useState(userData?.authChurch || "");
  const [managerName, setManagerName] = useState(userData?.userNickName || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(userData?.userAccount || "");
  const [memo, setMemo] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return !!churchName.trim() && !!managerName.trim() && !!phone.trim() && !!email.trim() && agree;
  }, [agree, churchName, email, managerName, phone]);

  const handleSubmitInquiry = async () => {
    if (!canSubmit || submitLoading) return;

    setSubmitLoading(true);
    try {
      const ok = await recordServiceApply({
        serviceType: "churchapp",
        orderName: "교회앱 제작 상담 신청",
        userAccount: email.trim(),
        churchName: churchName.trim(),
        ordererName: managerName.trim(),
        ordererPhone: phone.trim(),
        paymentStatus: "requested",
        memo: memo.trim(),
      });

      if (!ok) {
        alert("문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      alert("문의가 접수되었습니다. 확인 후 연락드리겠습니다.");
      navigate("/service/churchapp");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("churchapp inquiry submit error:", error);
      if (axios.isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
        const payload = error.response.data as { message?: string };
        alert(payload.message || "문의 전송 중 오류가 발생했습니다.");
      } else {
        alert("문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="churchapp-payment">
      <div className="churchapp-payment__body">
        <div className="churchapp-payment__inner">
          <section className="churchapp-payment__form-wrap">
            <div className="churchapp-payment__form-tabs">
              <button type="button" className="churchapp-payment__form-tab on">
                문의 정보
              </button>
              <button type="button" className="churchapp-payment__form-tab" disabled>
                검토 안내
              </button>
            </div>

            <div className="churchapp-payment__form-block">
              <h3 className="churchapp-payment__form-block-title">교회앱 제작 문의 정보</h3>
              <div className="churchapp-payment__form-grid">
                <label className="churchapp-payment__label">
                  <span>교회명</span>
                  <input
                    className="churchapp-payment__input"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="교회명을 입력해 주세요"
                  />
                </label>

                <label className="churchapp-payment__label">
                  <span>담당자명</span>
                  <input
                    className="churchapp-payment__input"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="담당자명을 입력해 주세요"
                  />
                </label>

                <label className="churchapp-payment__label">
                  <span>연락처</span>
                  <input
                    className="churchapp-payment__input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="예) 010-1234-5678"
                  />
                </label>

                <label className="churchapp-payment__label">
                  <span>계정</span>
                  <input
                    className="churchapp-payment__input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="로그인 계정"
                    disabled
                  />
                </label>

                <label className="churchapp-payment__label churchapp-payment__label--full">
                  <span>요청사항</span>
                  <textarea
                    className="churchapp-payment__textarea"
                    rows={5}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="원하시는 앱 구성, 기능, 디자인 참고사항을 적어주세요."
                  />
                </label>
              </div>
            </div>
          </section>

          <aside className="churchapp-payment__summary-wrap">
            <div className="churchapp-payment__summary-card">
              <h2 className="churchapp-payment__form-title">결제</h2>
              <div className="churchapp-payment__payment-block">
                <h3 className="churchapp-payment__plan-section-title">비용 안내</h3>
                <div className="churchapp-payment__plan-cards churchapp-payment__plan-cards--single">
                  <div className="churchapp-payment__plan-card churchapp-payment__plan-card--selected">
                    <p className="churchapp-payment__plan-card-price">1,000,000원 ~</p>
                    <p className="churchapp-payment__plan-card-vat">(부가세 10% 별도)</p>
                  </div>
                </div>
                <dl className="churchapp-payment__price-list">
                  <div>
                    <dt>상품 금액</dt>
                    <dd>상담 후 확정</dd>
                  </div>
                  <div>
                    <dt>부가세 (10%)</dt>
                    <dd>상담 후 확정</dd>
                  </div>
                  <div className="is-total">
                    <dt>총 결제금액</dt>
                    <dd>상담 후 확정</dd>
                  </div>
                </dl>
              </div>

              <div className="churchapp-payment__footer-wrap">
                <label className="churchapp-payment__agree">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  문의 내용 전송 및 회신 안내에 동의합니다.
                </label>

                <button
                  type="button"
                  className="churchapp-payment__submit-btn"
                  disabled={!canSubmit || submitLoading}
                  onClick={handleSubmitInquiry}
                >
                  {submitLoading ? "전송 중..." : "문의 보내기"}
                </button>

                <button
                  type="button"
                  className="churchapp-payment__back-btn"
                  onClick={() => {
                    navigate("/service/churchapp");
                    window.scrollTo(0, 0);
                  }}
                >
                  이전으로
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
