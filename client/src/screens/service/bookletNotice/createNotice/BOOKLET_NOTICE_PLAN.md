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

전단지 단위 메타 정보. NoticeTemplateSelect에서 선택한 디자인 등 저장.

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | int | AUTO_INCREMENT | PK |
| userAccount | varchar(100) | '' | 사용자 계정 |
| templateId | varchar(50) | 'classic' | 디자인 템플릿 (classic / modern / minimal / warm 등) |
| ordererName | varchar(100) | '' | 주문자 이름 |
| ordererPhone | varchar(50) | '' | 주문자 전화번호 |
| created_at | timestamp | CURRENT_TIMESTAMP | |
| updated_at | timestamp | CURRENT_TIMESTAMP ON UPDATE | |

※ 추후 type, categoryOrder 등 추가 예정

---

### churchInfo (기존 churchMain → 이름 변경)

소개 탭 상세 정보. `churchMainId`로 churchMain과 연결.

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | int | AUTO_INCREMENT | PK |
| churchMainId | int | NOT NULL | FK → churchMain.id |
| title | varchar(255) | '새 교회 소개' | |
| type | varchar(50) | 'notice' | |
| categoryOrder | text | NULL | |
| churchName | varchar(255) | '' | 교회명 |
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
| imageMainName | varchar(255) | '' | 메인 이미지 |
| mainLogo | varchar(255) | '' | 로고 |
| mainPastorImage | varchar(255) | '' | 담임 사진 |
| worshipImage | varchar(255) | '' | 예배 이미지 |
| youtubeNoticeImage | varchar(255) | '' | 유튜브 공지 이미지 |
| youtubeNoticeUrl | varchar(500) | '' | 유튜브 공지 URL |
| userAccount | varchar(100) | '' | 사용자 계정 (레거시) |
| created_at | timestamp | CURRENT_TIMESTAMP | |
| updated_at | timestamp | CURRENT_TIMESTAMP ON UPDATE | |

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
  templateId VARCHAR(50) DEFAULT 'classic',
  ordererName VARCHAR(100) DEFAULT '',
  ordererPhone VARCHAR(50) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. churchInfo 데이터로 churchMain 채우기 (id 동일 유지)
INSERT INTO churchMain (id, userAccount, templateId, ordererName, ordererPhone)
SELECT id, COALESCE(userAccount, ''), 'classic', '', '' FROM churchInfo;

-- 5. churchInfo.churchMainId 채우기
UPDATE churchInfo SET churchMainId = id;
ALTER TABLE churchInfo MODIFY churchMainId INT NOT NULL;
```

※ churchGallery, churchSermonVideos, churchServers의 churchMainId는 기존 churchMain.id를 참조하므로, 새 churchMain에 동일 id로 INSERT하면 FK가 그대로 유지됩니다.  
※ 실제 마이그레이션 전 `churchMain`(→ churchInfo) 백업을 권장합니다.

### ordererName, ordererPhone 추가 (기존 churchMain에 컬럼이 없는 경우)

```sql
ALTER TABLE churchMain ADD COLUMN ordererName VARCHAR(100) DEFAULT '' AFTER templateId;
ALTER TABLE churchMain ADD COLUMN ordererPhone VARCHAR(50) DEFAULT '' AFTER ordererName;
```

---

## 구현 상태

- [x] 화면 좌우 분할 (왼쪽: 미리보기, 오른쪽: 입력)
- [x] BookletNoticeDetail/TemplateNotice 기준 입력 항목 및 미리보기 연동
- [x] 미리보기 영역 스크롤 (내용 길 때 화면 내 스크롤)
- [x] 미리보기 모바일 형태 iPhone 스타일 (노치, 둥근 프레임)
- [x] 저장/API 연동 (`/bookletnoticecreate`, `bookletnoticedb` → `churchMain` 등)
- [x] MySQL **`bookletnotice`** 스키마 전용 연결 (`bookletnoticedb`)
- [ ] 이미지 업로드 범위 확장 등 추가 개선 (필요 시)
