/** DB·API 컬럼명(카멜·스네이크 혼용) → 관리자 화면용 한글 라벨 */
const FIELD_LABEL_KO: Record<string, string> = {
  id: 'ID',
  servicetype: '서비스 유형',
  ordername: '주문명',
  ordertitle: '주문 제목',
  useraccount: '로그인 계정',
  churchname: '교회명',
  orderername: '주문자명',
  ordererphone: '연락처',
  amount: '공급가액',
  vat: '부가세',
  totalamount: '총 결제금액',
  paymentstatus: '결제 상태',
  paymentid: '결제 식별자',
  billingkey: '빌링키',
  memo: '메모',
  status: '처리 상태',
  createdat: '등록일시',
  updatedat: '수정일시',
  representatives: '담당자명',
  phonenumber: '전화번호',
  portonepaymentid: 'PortOne 결제 ID',
  portonepaidamount: '결제 금액',
  portoneordername: 'PG 주문명',
  portoneplan: '정기 결제 플랜',
  schedulepaymentid: '다음 결제 예약 ID',
  portonepaidat: '결제 일시',
  portonetimetopay: '다음 결제 예정',
  portonescheduleid: '스케줄 ID',
  portonetxid: 'PortOne 거래 ID',
  firebasekey: 'Firebase 키(파일명)',
  firebasekeypath: 'Firebase 키 경로',
  linkurl: '링크 URL',
  templateid: '템플릿 ID',
  churchmainid: 'churchMain ID',
  eventmainid: 'eventMain ID',
  booklettype: '제작 유형',
  eventbooklettype: '행사 전단지 유형',
  visibletabs: '표시 탭',
  visibletabsjson: '표시 탭(JSON)',
  description: '설명',
  engname: '영문명',
  korname: '한글명',
  title: '제목',
  churchnameen: '교회명(영문)',
  mainpastor: '담임목사',
  religiousbody: '교단',
  adminpasswd: '관리자 비밀번호',
};

function normalizeFieldKey(key: string): string {
  return String(key ?? '').toLowerCase().replace(/_/g, '');
}

export function serviceFieldLabelKo(key: string): string {
  const n = normalizeFieldKey(key);
  return FIELD_LABEL_KO[n] ?? key;
}
