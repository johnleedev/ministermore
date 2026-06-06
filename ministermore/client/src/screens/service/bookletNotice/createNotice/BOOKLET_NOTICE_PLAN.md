# 모바일 전단지(소개) 생성 화면 계획

> **참조 코드**: `exceptbooklets/bookletNotice/BookletNoticeDetail.tsx`, `BookletNoticeTemplates/`, `createNotice/NoticeCreate.tsx`  
> **서버**: `server/routers/service/bookletNotice/` — `NoticeCreateBooklet.js`, `ChurchMain.js`, `bookletNoticeShared.js`  
> **행사 전단지(별도 DB)**: **`bookletevent`** — `server/routers/service/bookletEvent/`. 소개와 테이블을 공유하지 않는다.

## MySQL 데이터베이스 (소개)

- **스키마 이름**: `bookletnotice`
- **연결**: `server/routers/dbdatas/bookletdb.js`에서 `bookletnoticedb` 풀로 생성·export. (`bookletevent`용 `bookleteventdb`와 동일 호스트/계정, DB만 분리.)
- **빌링·소개 건 생성**: `server/routers/payment/PortoneBilling.js` → `insertChurchMainRow`에 **`bookletnoticedb`** 전달.

HTTP 마운트 예(`app.js`): `/bookletnoticemain`, `/bookletnoticecreate`.

---

## 화면 구성

### 1. 좌우 분할 레이아웃

- **왼쪽**: 모바일 미리보기 영역
  - **iPhone 형태**: 노치(다이나믹 아일랜드), 둥근 모서리(52px), 베젤, 우측 전원 버튼
  - 화면 비율 390×720px, 내용이 길면 **미리보기 화면 내부 스크롤**
  - 오른쪽 입력창에 입력한 내용이 실시간으로 반영됨

- **오른쪽**: 정보 입력 영역
  - **BookletNoticeDetail.tsx / TemplateNotice 구조 참조**: 교회명, 담임, 교단, 주소, 연락처/SNS, 인사말, 예배안내 등
  - 입력 시 왼쪽 미리보기에 즉시 반영

### 2. 미리보기 내용 기준

- 들어가는 내용은 **BookletNoticeDetail.tsx** 및 **TemplateNotice**를 참조
- 상단 히어로(메인 이미지 + 로고) → 탭(소개 | 섬김이들 | 설교영상 | 갤러리) → 소개 탭: 교회 정보 리스트, 인사말, 예배안내, 오시는길

### 3. 실시간 미리보기 동작

- 오른쪽 입력창에 텍스트를 입력하면 → 왼쪽 모바일 미리보기에 바로 표시
- 상태(state)로 입력값을 관리하고, 같은 값을 미리보기 컴포넌트에 전달해 렌더링

### 4. 진행 방식

- 위 레이아웃과 동작을 먼저 구현한 뒤, 필요한 입력 항목과 미리보기 UI를 단계적으로 추가

---

## DB 테이블 구조 (2025 리팩터)

아래 테이블은 모두 **`bookletnotice`** 스키마 안에 둔다. (과거 단일 `booklet` DB에서 분리한 경우, 동일 테이블명으로 데이터 이전 후 사용.)

### 관계 요약

- **churchMain** (신규): 전단지 메타 정보. `id`가 전체 전단지의 PK.
- **churchInfo** (기존 churchMain → 이름 변경): 소개 탭 상세 정보. `churchMainId`로 churchMain과 1:1 연결.
- **churchGallery, churchSermonVideos, churchServers**: `churchMainId` → churchMain.id (기존과 동일)

---

### churchMain (신규)

전단지 단위 메타 정보. NoticeApplyPay 결제·신규 발급 시 1행 생성.

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | int | AUTO_INCREMENT | PK |
| userAccount | varchar(100) | '' | 사용자 계정 |
| ordererName | varchar(100) | '' | 주문자 이름 |
| ordererPhone | varchar(50) | '' | 주문자 전화번호 |
| orderTitle | varchar(255) | '' | 주문 제목 |
| link | varchar(500) | NULL | `/generateNoticeHtml` 생성 시 채워지는 공유용 모바일 전단지 URL (`https://ministermore.co.kr/hp/notice/{id}{영문명}.html`) |
| portonePaymentId | varchar(255) | NULL | 빌링키 첫 결제 ID (있을 때만 INSERT) |
| portonePaidAmount | int | NULL | 결제 금액(원) |
| portoneOrderName | varchar(255) | NULL | PortOne `orderName` (월간 이용권 정기결제) |
| portonePlan | varchar(32) | NULL | `monthly` 등 |
| schedulePaymentId | varchar(255) | NULL | 다음 회차 예약 결제 ID |
| billingKey | varchar(512) | NULL | PortOne 빌링키 |
| portonePaidAt | varchar(64) | NULL | 결제 시각 (ISO 8601) |
| portoneTimeToPay | varchar(64) | NULL | 다음 결제 예정 시각 (ISO 8601 UTC) |
| portoneScheduleId | varchar(255) | NULL | PortOne 스케줄 ID |
| created_at | timestamp | CURRENT_TIMESTAMP | |
| updated_at | timestamp | CURRENT_TIMESTAMP ON UPDATE | |

> **2026 리팩터**: `templateId` 컬럼 제거 — 디자인 선택 기능 폐기(단일 고정 톤).

---

### churchInfo (기존 churchMain → 이름 변경)

소개 탭 상세 정보. `churchMainId`로 churchMain과 연결.

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | int | AUTO_INCREMENT | PK |
| churchMainId | int | NOT NULL | FK → churchMain.id |
| title | varchar(255) | '새 교회 소개' | |
| churchName | varchar(255) | '' | 교회명 (한글) |
| churchNameEn | varchar(255) | '' | 교회 영문명 — 영문·숫자만 허용. 공유용 HTML 파일명·URL 슬러그로 사용 |
| mainPastor | varchar(100) | '' | 담임목사 |
| religiousbody | varchar(100) | '' | 교단 |
| address | varchar(500) | '' | 주소 |
| quiry | varchar(50) | '' | 문의/연락처 |
| youtube | varchar(500) | '' | 유튜브 |
| blog | varchar(500) | '' | 블로그 |
| instar | varchar(500) | '' | 인스타그램 |
| facebook | varchar(500) | '' | 페이스북 |
| mainPastorMessage | text | NULL | 인사말 |
| churchGreeting | text | NULL | 인사말 블록 JSON (sub, title, desc) |
| mainPastorCareer | text | NULL | 담임 경력 |
| worshipTimes | text | NULL | 예배시간 |
| placeNaver | varchar(500) | '' | 네이버 지도 |
| placeKakao | varchar(500) | '' | 카카오맵 |
| placeHomepage | varchar(500) | '' | 홈페이지 |
| imageMainName | varchar(255) | '' | 메인 이미지 (JSON 5슬롯 또는 단일 파일명 — 레거시) |
| mainLogo | varchar(255) | '' | 로고 |
| mainPastorImage | varchar(255) | '' | 담임 사진 |
| worshipImage | varchar(255) | '' | 예배 이미지 |
| youtubeNoticeImage | varchar(255) | '' | 유튜브 공지 이미지 |
| youtubeNoticeUrl | varchar(500) | '' | 유튜브 공지 URL |
| userAccount | varchar(100) | '' | 사용자 계정 (레거시) |
| created_at | timestamp | CURRENT_TIMESTAMP | |
| updated_at | timestamp | CURRENT_TIMESTAMP ON UPDATE | |

> **2026 리팩터**: `type`, `categoryOrder` 컬럼 제거 (소개 전용으로 고정·블록 순서도 고정).

---

### churchGallery

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | int | AUTO_INCREMENT | PK |
| churchMainId | int | NOT NULL | FK → churchMain.id |
| image | varchar(255) | '' | |
| title | varchar(255) | '' | |
| description | text | NULL | |

### churchSermonVideos

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | int | AUTO_INCREMENT | PK |
| churchMainId | int | NOT NULL | FK → churchMain.id |
| title | varchar(255) | '' | |
| url | varchar(500) | '' | |
| thumbnail | varchar(255) | '' | |
| sortOrder | int | 0 | |

### churchServers

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | int | AUTO_INCREMENT | PK |
| churchMainId | int | NULL | FK → churchMain.id |
| title | varchar(45) | NULL | 섹션 제목 |
| serverName | varchar(45) | NULL | 이름 |
| duty | varchar(45) | NULL | 직분 |
| notice | varchar(45) | NULL | 소개/메모 |
| image | varchar(100) | NULL | 사진 |

---

## DB 마이그레이션 (churchMain → churchInfo 분리)

기존 `churchMain` 테이블이 있는 경우, 아래 순서로 마이그레이션합니다.  
churchGallery, churchSermonVideos, churchServers의 `churchMainId`는 계속 `churchMain.id`를 참조합니다.

**적용 대상 스키마**: `bookletnotice` (또는 마이그레이션 전 단일 `booklet`에서 이 스키마로 테이블을 옮긴 뒤 실행).

```sql
-- 1. churchMain → churchInfo 이름 변경
ALTER TABLE churchMain RENAME TO churchInfo;

-- 2. churchInfo에 churchMainId 컬럼 추가 (추후 churchMain 생성 후 채움)
ALTER TABLE churchInfo ADD COLUMN churchMainId INT NULL AFTER id;

-- 3. 새 churchMain 테이블 생성 (id를 기존과 동일하게 유지해 FK 호환)
CREATE TABLE churchMain (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userAccount VARCHAR(100) DEFAULT '',
  ordererName VARCHAR(100) DEFAULT '',
  ordererPhone VARCHAR(50) DEFAULT '',
  orderTitle VARCHAR(255) DEFAULT '',
  link VARCHAR(500) NULL,
  portonePaymentId VARCHAR(255) NULL,
  portonePaidAmount INT NULL,
  portoneOrderName VARCHAR(255) NULL,
  portonePlan VARCHAR(32) NULL,
  schedulePaymentId VARCHAR(255) NULL,
  billingKey VARCHAR(512) NULL,
  portonePaidAt VARCHAR(64) NULL,
  portoneTimeToPay VARCHAR(64) NULL,
  portoneScheduleId VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. churchInfo 데이터로 churchMain 채우기 (id 동일 유지)
INSERT INTO churchMain (id, userAccount, ordererName, ordererPhone)
SELECT id, COALESCE(userAccount, ''), '', '' FROM churchInfo;

-- 5. churchInfo.churchMainId 채우기
UPDATE churchInfo SET churchMainId = id;
ALTER TABLE churchInfo MODIFY churchMainId INT NOT NULL;
```

※ churchGallery, churchSermonVideos, churchServers의 churchMainId는 기존 churchMain.id를 참조하므로, 새 churchMain에 동일 id로 INSERT하면 FK가 그대로 유지됩니다.  
※ 실제 마이그레이션 전 `churchMain`(→ churchInfo) 백업을 권장합니다.

### 2026 리팩터 — 템플릿/카테고리 컬럼 제거

```sql
-- 디자인 템플릿 폐기
ALTER TABLE churchMain DROP COLUMN templateId;

-- 소개 전용 고정·블록 순서 고정으로 type/categoryOrder 폐기
ALTER TABLE churchInfo DROP COLUMN type;
ALTER TABLE churchInfo DROP COLUMN categoryOrder;
```

### 공유용 HTML 링크 컬럼 추가

```sql
ALTER TABLE churchMain ADD COLUMN link VARCHAR(500) NULL AFTER orderTitle;
```

### 영문 식별명(churchNameEn) 추가

```sql
ALTER TABLE churchInfo ADD COLUMN churchNameEn VARCHAR(255) DEFAULT '' AFTER churchName;
```

---

## 클라이언트·서버 라우트 매핑

### 라우트

| 경로 | 컴포넌트 | 용도 |
|------|----------|------|
| `/service/bookletnoticepay` | `NoticeApplyPay` | 결제·신규 발급(현재 결제 stub) |
| `/service/bookletnoticecreate?id={churchMainId}` | `NoticeCreate` | 편집 화면 (id 없으면 결제 페이지로 redirect) |
| `/service/bookletnoticecomplete` | `NoticeComplete` | 작성 완료 → 공유 링크 표시·복사 |
| `/mypage/servicemanage/mobile-church-notice` | `ServiceManage` | 사용자 전단지 목록·수정·삭제·링크 복사 |

### 서버 엔드포인트 (`server/routers/service/bookletNotice/`)

- **`/bookletnoticecreate/create`** — churchMain 1행 신규 INSERT (결제 stub 흐름 / NoticeApplyPay 진입 시).
- **`/bookletnoticecreate/getdatabookletspart`** — id 또는 userAccount 기준 churchMain + churchInfo 조회 (`link` 포함).
- **`/bookletnoticecreate/saveIntro`** — 소개 탭(메인 이미지·담임 사진·텍스트) 저장 (multer).
- **`/bookletnoticecreate/saveServants` / `saveSermon` / `saveGallery`** — 각 탭 저장 (multer).
- **`/bookletnoticecreate/generateNoticeHtml`** — `build/hp/notice/id{churchMainId}{churchNameEn}.html` 작성 + `churchMain.link` UPDATE → fileUrl·이름 응답.
- **`/bookletnoticecreate/deleteBooklet`** — userAccount 검증 후 churchInfo/Servers/Sermon/Gallery/Main DB 행 + 업로드 이미지(`build/images/bookletnotice/{mainimages,pastors,servers,sermonthumbnail,gallery}`) + 공유 HTML(`build/hp/notice/{file}.html`) 모두 정리.
- **`/bookletnoticemain/getUserBooklets/:userAccount`** — ServiceManage 목록용. `m.link` 포함.

### 결제 흐름 (테스트용 stub)

- `client/src/screens/service/bookletNotice/createNotice/NoticeApplyPay.tsx` — PortOne 호출·카드 입력 검증을 제거하고 `POST /bookletnoticecreate/create` 한 번만 호출하여 새 churchMain id를 받고 `NoticeCreate` 로 이동 (alert "결제가 되었습니다").
- `server/routers/payment/PortoneBilling.js` — `/billingkey`, `/homeinapp/billingkey` 의 외부 fetch 호출 모두 제거. `billingKey/paymentId/schedulePaymentId/timeToPay`를 stub으로 생성해 `insertChurchMainRow` (notice) / `insertHomeinappOrderWithPayment` (homeinapp) 로 MySQL 저장 흐름만 유지.
- 결제 재활성화 시: PortOne API 호출과 카드/Customer 검증을 다시 추가하고 `customData`에서 plan·serviceType 등을 받아 분기.

---

## 기능 변경 이력 (2026 리팩터)

### 1) 템플릿 선택 기능 폐기

- 삭제: `client/src/screens/service/bookletNotice/createNotice/noticeTemplateTypes.ts`.
- `NoticeApplyPay.tsx`: `NoticeTemplateId`·`DEFAULT_NOTICE_TEMPLATE`·`templateId` 전송 제거.
- `NoticeCreate.tsx`: `templateId` state·미리보기 클래스(`--{template}`)·`TEMPLATE_INTRO_ORDER` 매핑 제거. 소개 블록 순서는 `['greeting','worship','sns','location','mapActions']` 인라인 고정.
- `NoticeCreate.scss`: 템플릿별 색상 변형(`--classic/--modern/...`) 8개씩 삭제, classic 톤을 베이스 `.notice-create__preview-body` 에 병합.
- 서버: `bookletNoticeShared.js`의 `TEMPLATE_STR_TO_INT/INT_TO_STR/toTemplateInt/toTemplateStr` 제거. `insertChurchMainRow`·`saveIntro`·SELECT/INSERT/검색 라우트에서 `templateId/type/categoryOrder` 모두 제거. `/saveCategoryOrder` 라우트 삭제.
- 사이드 영향: `bookletEventShared.js`가 노티스에서 가져오던 템플릿 헬퍼를 자체 정의로 옮김 (이벤트 도메인은 디자인 선택 유지).
- `serviceManageTypes.ts`의 `BookletItem.type` 제거.

### 2) 공유용 HTML + 링크 컬럼

- `POST /bookletnoticecreate/generateNoticeHtml` — `build/hp/notice/id{churchMainId}{englishName}.html` 생성 (메타·OG 태그·redirect 포함).
- 파일명 우선순위: 입력한 `churchNameEn` → 없으면 ASCII 변환된 churchName → 최후 `'church'`.
- 생성 직후 `churchMain.link` UPDATE (fire-and-forget). 응답에 `fileUrl`·`churchName`·`churchNameEn` 포함.
- 모든 목록·상세 SELECT에 `m.link` 포함하여 클라이언트에서 직접 사용.

### 3) 교회 영문명 (`churchNameEn`)

- `NoticeCreate.tsx`: "교회명" 아래 영문 식별명 입력 필드 추가.
  - 입력 필터: `replace(/[^a-zA-Z0-9]/g, '')` — **영문·숫자만** 허용. 한글 입력 감지 시 500ms 디바운스 alert.
  - 보조 속성: `autoCapitalize="off"`, `autoComplete="off"`, `spellCheck={false}`.
- 완료(complete) 클릭 시 `churchName` 또는 `churchNameEn`이 비어 있으면 "교회명과 영문명을 입력해 주세요" alert + 소개 탭으로 이동 + 입력창 포커스.
- `churchInfo.churchNameEn` 컬럼에 저장(`saveIntro` INSERT/UPDATE).
- `makeNoticeHtml`에서 `한글교회명 (EnglishChurchName)` 형태로 title·OG·description 노출. 별도 `meta name="church-name-ko/en"` 추가.

### 4) 완료 페이지 (NoticeComplete)

- `fileUrl`·`churchName`·`churchNameEn`·`churchMainId`를 `location.state`로 받음.
- 모바일 전단지 링크 박스 추가: URL 표시 + "주소 복사" (Clipboard API + `execCommand('copy')` 폴백) + "새 탭에서 열기".
- "전단지 수정하기" 버튼은 `ServiceManage`의 수정 흐름과 동일하게 `/service/bookletnoticecreate?id={churchMainId}` 로 이동. state가 비어 있으면 `/mypage/servicemanage/mobile-church-notice` 폴백.

### 5) 서비스 관리 (ServiceManage)

- 목록 카드 `postingInfo` 에 **링크 행** 추가: 새 탭 링크 + 1.8s 피드백이 있는 "주소 복사" 버튼. `item.link` 가 없으면 "아직 생성되지 않았습니다." 안내.
- `BookletItem.link?: string` 타입 추가 (서버는 이미 `getUserBooklets` 에서 `m.link` 반환).
- **삭제**(`/bookletnoticecreate/deleteBooklet`)가 다음을 모두 처리:
  1. `churchMain.id + userAccount` 권한 검증과 동시에 `link` 조회.
  2. 자식 테이블(`churchServers / churchSermonVideos / churchGallery / churchInfo`) 파일명 수집.
  3. 업로드 이미지 `safeUnlink` (경로 탈출 방지). 메인 이미지(JSON 5슬롯) / 담임 사진 / 섬김이 사진 / 설교 썸네일 / 갤러리 이미지 모두 정리.
  4. `link`에서 `/hp/notice/{file}.html` 추출 후 HTML 파일 삭제.
  5. 자식 DB 행 DELETE → `churchMain` DELETE (응답은 churchMain 결과 기준).

### 6) 결제 흐름 일시 비활성화

- 외부 PortOne API 호출은 제거하고 `TEST_BK_*` / `notice_*` ID 등의 stub으로 MySQL 저장 흐름만 유지.
- 결제 재오픈 시 NoticeApplyPay·PortoneBilling.js 의 PortOne fetch·카드 검증을 복원.

---

## 구현 상태

- [x] 화면 좌우 분할 (왼쪽: 미리보기, 오른쪽: 입력)
- [x] BookletNoticeDetail/TemplateNotice 기준 입력 항목 및 미리보기 연동
- [x] 미리보기 영역 스크롤 (내용 길 때 화면 내 스크롤)
- [x] 미리보기 모바일 형태 iPhone 스타일 (노치, 둥근 프레임)
- [x] 저장/API 연동 (`/bookletnoticecreate`, `bookletnoticedb` → `churchMain` 등)
- [x] MySQL **`bookletnotice`** 스키마 전용 연결 (`bookletnoticedb`)
- [x] 디자인 템플릿 선택 기능 제거 — DB·미리보기·라우트 일괄 정리
- [x] 교회 영문 식별명(`churchNameEn`) 입력·검증·HTML 파일명 반영
- [x] `/generateNoticeHtml` — 공유용 HTML 자동 생성 + `churchMain.link` 갱신
- [x] 완료 페이지: 링크 표시·복사·새 탭 열기 + churchMainId 기반 수정 버튼
- [x] 마이페이지 서비스 관리: 카드에 링크 노출·복사, 삭제 시 DB·이미지·HTML 모두 제거
- [x] 결제 흐름 일시 stub (테스트용) — PortOne fetch 제거, MySQL 저장만 유지
- [ ] PortOne 결제 흐름 재활성화 (운영 전환 시)
- [ ] 이미지 업로드 범위 확장 등 추가 개선 (필요 시)
