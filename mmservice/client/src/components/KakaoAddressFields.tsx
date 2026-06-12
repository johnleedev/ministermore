import type { RefObject } from 'react';
import './KakaoAddressFields.scss';

type Props = {
  postcode: string;
  address: string;
  addressExtra: string;
  addressGuide: string;
  addressDetail: string;
  onAddressDetailChange: (value: string) => void;
  onSearch: (e?: React.MouseEvent) => void;
  detailInputRef?: RefObject<HTMLInputElement>;
  inputClassName?: string;
};

export function KakaoAddressFields({
  postcode,
  address,
  addressExtra,
  addressGuide,
  addressDetail,
  onAddressDetailChange,
  onSearch,
  detailInputRef,
  inputClassName = '',
}: Props) {
  const inputCls = ['kakao-address-fields__input', inputClassName].filter(Boolean).join(' ');

  return (
    <div className="kakao-address-fields">
      <div className="kakao-address-fields__row kakao-address-fields__row--postcode">
        <input
          type="text"
          className={`${inputCls} kakao-address-fields__postcode`}
          value={postcode}
          placeholder="우편번호"
          readOnly
          onClick={() => {
            if (!postcode.trim()) {
              onSearch();
            }
          }}
        />
        <button type="button" className="kakao-address-fields__search-btn" onClick={onSearch}>
          우편번호 찾기
        </button>
      </div>
      <input
        type="text"
        className={inputCls}
        value={address}
        placeholder="주소"
        readOnly
      />
      {addressExtra.trim() !== '' && (
        <input
          type="text"
          className={`${inputCls} kakao-address-fields__extra`}
          value={addressExtra}
          placeholder="참고항목"
          readOnly
        />
      )}
      {addressGuide.trim() !== '' && (
        <p className="kakao-address-fields__guide">{addressGuide}</p>
      )}
      <input
        ref={detailInputRef}
        type="text"
        className={inputCls}
        value={addressDetail}
        placeholder="상세주소"
        onChange={(e) => onAddressDetailChange(e.target.value)}
      />
    </div>
  );
}
