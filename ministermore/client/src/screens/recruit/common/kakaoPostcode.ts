/** https://postcode.map.kakao.com/guide 예제(sample6) 기반 */

export type KakaoPostcodeResult = {
  zonecode: string;
  userSelectedType: 'R' | 'J';
  roadAddress: string;
  jibunAddress: string;
  bname: string;
  buildingName: string;
  apartment: 'Y' | 'N';
  autoRoadAddress: string;
  autoJibunAddress: string;
  sido: string;
  sigungu: string;
};

export type ParsedKakaoAddress = {
  zonecode: string;
  address: string;
  extraAddress: string;
  guide: string;
  location: string;
};

/** 가이드 sample6: 사용자 선택 주소 + 참고항목 조합 */
export function parseKakaoPostcodeResult(data: KakaoPostcodeResult): ParsedKakaoAddress {
  let address = '';
  let extraAddress = '';

  if (data.userSelectedType === 'R') {
    address = data.roadAddress;
  } else {
    address = data.jibunAddress;
  }

  if (data.userSelectedType === 'R') {
    if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
      extraAddress += data.bname;
    }
    if (data.buildingName !== '' && data.apartment === 'Y') {
      extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
    }
    if (extraAddress !== '') {
      extraAddress = ` (${extraAddress})`;
    }
  }

  let guide = '';
  if (data.autoRoadAddress) {
    guide = `(예상 도로명 주소 : ${data.autoRoadAddress}${extraAddress})`;
  } else if (data.autoJibunAddress) {
    guide = `(예상 지번 주소 : ${data.autoJibunAddress})`;
  }

  return {
    zonecode: data.zonecode,
    address,
    extraAddress,
    guide,
    location: `${data.sido} ${data.sigungu}`,
  };
}

export function formatKakaoAddressForSave(parts: {
  address: string;
  extraAddress: string;
  detailAddress: string;
}): string {
  return [parts.address.trim(), parts.extraAddress.trim(), parts.detailAddress.trim()]
    .filter(Boolean)
    .join(' ');
}

type PostcodeConstructor = new (options: {
  oncomplete: (data: KakaoPostcodeResult) => void;
}) => {
  open: () => void;
};

function getPostcodeConstructor(): PostcodeConstructor | undefined {
  const win = window as typeof window & {
    kakao?: { Postcode?: PostcodeConstructor };
    daum?: { Postcode?: PostcodeConstructor };
  };
  return win.kakao?.Postcode ?? win.daum?.Postcode;
}

export function openKakaoPostcode(onComplete: (data: KakaoPostcodeResult) => void): boolean {
  const Postcode = getPostcodeConstructor();
  if (!Postcode) {
    return false;
  }

  new Postcode({ oncomplete: onComplete }).open();
  return true;
}
