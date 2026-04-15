# 모바일 전단지(행사) — 구조·데이터 계획

> **참조 코드**: `exceptbooklets/bookletEvent/BookletEventDetail.tsx`, `BookletEventDetail.scss`, `createEvent/EventCreate.tsx`, `EventCreate.scss`, `exceptbooklets/bookletEvent/BookletEventTemplates/`  
> **서버(행사)**: `server/routers/service/bookletEvent/` — `EventCreateBooklet.js`, `EventMain.js`, `bookletEventProgramRead.js`, `bookletEventCastRead.js`, `bookletEventWorshipRead.js`, `bookletEventMerge.js`, `bookletEventShared.js`  
> **서버(교회 소개·별도 DB)**: 소개 전단지는 **`bookletnotice`** DB — `server/routers/service/bookletNotice/` (`NoticeCreateBooklet.js`, `ChurchMain.js`, `bookletNoticeShared.js`). 행사와 테이블을 공유하지 않는다.

## MySQL 데이터베이스 (행사)

- **스키마 이름**: `bookletevent`
- **연결**: `server/routers/dbdatas/bookletdb.js`에서 `bookleteventdb` 풀로 생성·export. (`bookletnotice`용 `bookletnoticedb`와 동일 호스트/계정, DB만 분리.)
- **결제 후 행사 건 생성**: `server/routers/payment/PortoneRequestPay.js` → `bookleteventdb`로 `eventMain` / `eventInfo` 저장.

스키마(`CREATE TABLE`)는 **DB에서 직접 관리**한다. 앱 기동 시 `eventInfo` 등 컬럼 보강은 `EventCreateBooklet.js`의 `ensureEvent*` 로 일부 수행한다.

**마이그레이션**: 기존 단일 `booklet` DB에서 나눈 경우, 행사 관련 테이블은 **`bookletevent`** 쪽으로 옮긴 뒤 아래를 적용한다. 기존 DB에 `eventCast` 테이블만 있는 경우, 서버는 **`eventProfile`** 를 사용한다. 한 번 실행:

```sql
RENAME TABLE eventCast TO eventProfile;
```

기존 DB에 `eventWorship` 테이블만 있는 경우, 서버는 **`eventOrder`** 를 사용한다. 한 번 실행:

```sql
RENAME TABLE eventWorship TO eventOrder;
```

---

## 탭 구성 (공개·편집 공통)

표시할 탭은 **`eventInfo.visibleTabs`**(JSON 배열 문자열)로 저장된다. **소개(`info`)는 항상 포함**되고, 나머지는 편집 화면 **「탭선택」**에서 켠다. 코드상 탭 id는 `eventTemplateTypes.ts`의 `EventVisibleTabId`와 동일하다.

| 탭 id | 라벨 | 내용 |
|-------|------|------|
| **info** | 소개 | 행사 일반 소개 (`eventInfo` + 메인 이미지 등) — `TemplateNotice` |
| **greeting** | 초대의글 | 초대 카드형 문구 — `TemplateEventGreeting` |
| **program** | 프로그램 | 프로그램 상세 (`eventProgram` 행) — `TemplateEventProgram` |
| **profile** | 프로필 | 출연·참석 등 (`eventProfile` 행) — `TemplateEventProfile` |
| **order** | 순서 | 진행 순서 목록 (`eventOrder` 행) — `TemplateEventOrder` |
| **apply** | 신청하기 | 신청 안내 — `TemplateEventApply` |

레거시 URL·DB 문자열 **`cast`** / **`worship`** 은 각각 **`profile`** / **`order`** 로 정규화한다(`normalizeLegacyTabIdString`). 화면 라벨은 위 표와 `EVENT_VISIBLE_TAB_LABELS`를 따른다.

---

## DB 개요 (`bookletevent` 내 테이블명 동일)

| 테이블 | 역할 |
|--------|------|
| **eventMain** | 전단지 단위 메타(주문자·템플릿·타임스탬프). `POST /bookleteventcreate/...` 등으로 생성. |
| **eventInfo** | 행사 본문. `bookletId` = `String(eventMain.id)`. `programType`: `concert` \| `worship`(프로그램 탭 UI·`postImage` 처리). **`visibleTabs`**: 표시 탭 id JSON 배열(TEXT). |
| **eventProgram** | **저장의 기준** — 프로그램 행 전부. `saveProgram`은 여기에 `DELETE` 후 `INSERT`. 레거시 `eventProgramConcert` / `eventProgramWorship` 행은 같은 booklet에 대해 삭제만 수행. |
| **eventProfile** | **프로필** 행(구 `eventCast`). `saveCast`는 `DELETE` 후 `INSERT`. |
| **eventOrder** | **순서** 행(구 `eventWorship`). `saveWorship`은 `DELETE` 후 `INSERT`. 프로필 `eventProfile`와 **별도 테이블**. |
| **레거시** | `eventProgramConcert`, `eventProgramWorship`, 구 `eventProgram`, `eventPrograms` — **조회 폴백**만 (`bookletEventProgramRead.js`). 신규 저장 데이터는 `eventProgram`에만 쌓인다. |

`eventMain`에만 본문이 있던 옛 데이터: `eventInfo`가 없으면 조회 시 `eventMain` 컬럼을 병합한다(`bookletEventMerge.js`).

---

## 화면 구성

### BookletEventDetail (공개)

- `MainHeroCarousel` + 탭 바(선택된 탭만 표시)
- 소개: `TemplateNotice` (지도·문의·프로그램 요약 버튼 등; 프로그램 탭이 없으면 해당 버튼 숨김)
- 프로그램: `getdataprogramspart` / `bookleteventcreate`·`bookleteventmain`
- 프로필: `getdatacastpart` / 동일
- 순서: `getdataworshippart` / 동일

### EventCreate (편집)

- 좌측: 미리보기(태그 구조 동일)
- 우측 상단: **탭선택**(소개 필수 + 나머지 탭) → `saveIntro` 시 `visibleTabs` 함께 저장
- 우측: 탭별 폼 — 소개(`saveIntro`) → 프로그램(`saveProgram`) → 프로필(`saveCast`) → 순서(`saveWorship`) 등

### 프로그램 유형 (프로그램 탭 UI)

- **음악회형 (`concert`)**: 이미지 슬롯·`postImage` JSON
- **예배형 (`worship`)**: 이미지 없음, 저장 시 `postImage`는 `[]`
- 각 행 **시간·일시** 옆 **노출/비노출** → DB `showDateTime`

---

## 데이터 필드 요약

### 소개 (`getdatabookletspart` 병합)

`eventName`, `date`, `place`, `superViser`, `address`, `quiry`, `placeNaver`, `placeKakao`, `imageMain` / `imageMainName`, `programType`, `templateId`, **`visibleTabs`** 등.

### 프로그램 (`getdataprogramspart`)

| 필드 | 설명 |
|------|------|
| id, bookletId, showOrder(sortOrder) | PK·순서 |
| subTitle, title | 제목 계열 |
| dateTime | 일시·시간 문자열 |
| showDateTime | 시간·일시 필드 노출 여부 |
| career | 설명(JSON 배열·문자열) |
| postImage | 이미지 파일명(JSON) — worship이면 조회 시 `[]` 처리 |

### 프로필 (`getdatacastpart`)

| 필드 | 설명 |
|------|------|
| **id** | 행 PK (`AUTO_INCREMENT`). 조회 응답에 포함. |
| **bookletId** | 전단지 ID — `String(eventMain.id)`와 동일. |
| showOrder | 표시 순서 |
| personName | 이름 |
| roleName | 역할·직분 |
| note | 비고 |
| **postImage** | 사진 — `images/bookletevent/programimages/` 파일명(TEXT). 레거시 `photo`는 조회 시 병합 가능. |

`saveCast`는 전단지 단위로 기존 행을 지운 뒤 다시 넣는다. 페이로드에는 **`id` 없이** `personName` 등만 보내며, **`bookletId`는 서버가 `eventMainId`로 넣는다.**

### 순서 (`getdataworshippart`) — **eventOrder**

| 필드 | 설명 |
|------|------|
| **id** | PK, `AUTO_INCREMENT` |
| **bookletId** | 전단지 FK (`eventMain.id`와 동일 문자열) |
| showOrder | 표시 순서 |
| **subTitle** | 부제(예: varchar 100) |
| **title** | 제목 |
| **charger** | 담당 |
| **notice** | 안내·비고(TEXT). 레거시 `content` 컬럼만 있던 데이터는 마이그레이션 또는 조회 매핑으로 대응 가능 |

`saveWorship`도 `DELETE` 후 `INSERT`. 클라이언트는 `worshipData` 배열로 `subTitle`, `title`, `charger`, `notice`를 보낸다.

---

## `eventProgram` / `eventProfile` / `eventOrder` 스키마 (참고)

운영 DB에 맞는 컬럼·타입으로 직접 생성한다. 서버는 대략 다음을 가정한다.

**eventProgram** (통합): `id`, `bookletId`, `showOrder`, `subTitle`, `title`, `dateTime`, `career`, `postImage`, `showDateTime` …

**eventProfile** (프로필, 구 `eventCast`):

| 컬럼 | 역할 |
|------|------|
| **id** | PK, `AUTO_INCREMENT` |
| **bookletId** | 전단지 FK, `NOT NULL` 권장 |
| showOrder, personName, roleName, note | 본문 필드 |
| **postImage** | 이미지 파일명(TEXT) |

**eventOrder** (순서, 구 `eventWorship` — 프로필과 별도):

| 컬럼 | 역할 |
|------|------|
| **id** | PK, `AUTO_INCREMENT` |
| **bookletId** | 전단지 FK |
| showOrder | 표시 순서 |
| subTitle, title, charger | varchar 길이는 DB 정의에 따름 |
| notice | TEXT |

---

## API (`/bookleteventcreate`, `/bookleteventmain`)

Express 마운트는 `app.js` 기준 `/bookleteventcreate`, `/bookleteventmain` 등. 내부 라우트 핸들러 이름 예:

| 메서드 | 설명 |
|--------|------|
| `getdatabookletspart` | 소개·메타 병합 |
| `getdataprogramspart` | `eventProgram` 우선, 없으면 concert/worship/레거시 폴백 |
| `getdatacastpart` | `eventProfile` 행 |
| `getdataworshippart` | `eventOrder` 행 |
| `saveIntro` | 소개·메인 이미지·**`visibleTabs`** |
| `saveProgram` | `programType` + `programData` → **`eventProgram`만 INSERT** |
| `saveCast` | `castData` 배열 → **`eventProfile`** |
| `saveWorship` | `worshipData` 배열 → **`eventOrder`** |
| `uploadProgramImage` | 프로그램·프로필 이미지 → `images/bookletevent/programimages/` |

공개 조회용 라우트(`EventMain.js`)는 동일 엔드포인트 이름을 맞춰 둘 수 있다.

---

## BookletEventTemplates (행사)

- **TemplateNotice.tsx** — 소개 탭
- **TemplateEventGreeting.tsx** — 초대의글 탭
- **TemplateEventProgram.tsx** — 프로그램 탭
- **TemplateEventProfile.tsx** — 프로필 탭 (`editorPreview` 옵션: EventCreate 좌측 미리보기 전용 UI)
- **TemplateEventOrder.tsx** — 순서 탭
- **TemplateEventApply.tsx** — 신청하기 탭

(미션클럽 등 다른 전단지용 `TemplateGallery` 등은 이 행사 플로우와 별개.)

---

## 구현 상태

- [x] 좌우 분할(미리보기 / 입력), iPhone 스타일 미리보기
- [x] 소개 · 초대의글 · 프로그램 · 프로필 · **순서** · 신청하기 탭 (`BookletEventDetail`, `EventCreate`, `eventTemplateTypes`)
- [x] **`visibleTabs`** / 탭선택(소개 필수)
- [x] `eventProgram` 기준 저장·조회(레거시 폴백 읽기)
- [x] `eventProfile` 저장·조회(프로필, API `saveCast` / `getdatacastpart`)
- [x] **`eventOrder` 저장·조회(순서, API `saveWorship` / `getdataworshippart`)** — `subTitle`, `title`, `charger`, `notice`
- [x] `programType`, `showDateTime`, 프로그램 이미지(음악회형)
- [x] MySQL **`bookletevent`** 스키마 전용 연결 (`bookleteventdb`)
