import { useCallback, useRef, useState } from 'react';
import {
  formatKakaoAddressForSave,
  openKakaoPostcode,
  parseKakaoPostcodeResult,
  type KakaoPostcodeResult,
} from './kakaoPostcode';

type Options = {
  onRegion?: (location: string) => void;
};

export function useKakaoAddress(options?: Options) {
  const [postcode, setPostcode] = useState('');
  const [address, setAddress] = useState('');
  const [addressExtra, setAddressExtra] = useState('');
  const [addressGuide, setAddressGuide] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const addressDetailRef = useRef<HTMLInputElement>(null);

  const onCompletePost = useCallback((data: KakaoPostcodeResult) => {
    const parsed = parseKakaoPostcodeResult(data);
    options?.onRegion?.(parsed.location);
    setPostcode(parsed.zonecode);
    setAddress(parsed.address);
    setAddressExtra(parsed.extraAddress);
    setAddressGuide(parsed.guide);
    setAddressDetail('');
    requestAnimationFrame(() => {
      addressDetailRef.current?.focus();
    });
  }, [options?.onRegion]);

  const handleAddressSearch = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!openKakaoPostcode(onCompletePost)) {
      window.alert('주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [onCompletePost]);

  const getFullAddress = useCallback(
    () => formatKakaoAddressForSave({
      address,
      extraAddress: addressExtra,
      detailAddress: addressDetail,
    }),
    [address, addressExtra, addressDetail],
  );

  const resetFromSaved = useCallback((savedAddress: string) => {
    setPostcode('');
    setAddress(savedAddress);
    setAddressExtra('');
    setAddressGuide('');
    setAddressDetail('');
  }, []);

  return {
    postcode,
    address,
    addressExtra,
    addressGuide,
    addressDetail,
    setAddress,
    setAddressDetail,
    addressDetailRef,
    handleAddressSearch,
    getFullAddress,
    resetFromSaved,
  };
}
