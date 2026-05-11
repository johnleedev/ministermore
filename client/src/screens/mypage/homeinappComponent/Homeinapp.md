# Homeinapp 작업 기록

이 문서는 `홈인앱알림` 기능에 대해 현재까지 진행한 작업 과정과 핵심 로직을 정리한 기록입니다.

## 1. 화면 구조 변경 과정

- 기존에는 `ServiceManage.tsx` 내부 우측 콘텐츠로 `교회주보`, `홈인앱알림`을 렌더링했음.
- 요구사항에 맞춰 두 화면을 `ServiceManage.tsx`와 분리하여 독립 페이지로 이동함.
- 신규 라우팅을 `MypageRouter.tsx`에 추가:
  - `/mypage/church-bulletin`
  - `/mypage/homeinapp-notification`
- `MypageMenu.tsx`의 서비스 하위 메뉴 경로도 독립 페이지 경로로 변경함.
- 기존 `/servicemanage/church-bulletin`, `/servicemanage/homeinapp-notification` 진입은 새 경로로 리다이렉트 처리함.

## 2. HomeinappNotificationMain 구성 로직

- 파일: `HomeinappNotificationMain.tsx`
- 목적: 홈인앱 알림 관리자 화면(발송 작성, 분석, 이력 확인)을 한 페이지에서 제공.
- 기존 분리 컴포넌트(`ChurchPush...`)는 요청에 따라 모두 인라인(단일 파일)로 통합함.
- 상단 우측 버튼은 `서비스관리`로 고정하고 `/mypage/servicemanage/mobile-church-notice`로 이동하도록 설정함.
- 상단 정보 영역은 셀렉트/프로필 UI를 제거하고 텍스트 기반으로 변경:
  - 좌측: 현재 교회명
  - 우측: 관리자/계정/연락처

## 3. 데이터 연동 로직 (churches 조회)

- 클라이언트에서 로그인 사용자 `userAccount` 기반으로 교회 정보를 요청.
- 서버 라우터 `server/routers/service/homeinapp/HomeinappMain.js` 추가:
  - `GET /homeinappmain/getChurchByUser/:userAccount`
  - `churches` 테이블에서 최신 1건 조회 후 반환.
- 조회 결과를 `HomeinappNotificationMain.tsx` 상단 정보에 반영.
- 데이터가 없을 때는 Recoil 사용자 정보 기반 fallback 값 표시.

## 4. 결제 플로우 변경 로직

- `HomeinappMain.tsx`의 보조 버튼을 `제작 절차 보기` -> `제작하기`로 변경.
- `제작하기` 클릭 시 `HomeinappPayment.tsx`로 이동하도록 연결.
- 결제 완료 후 바로 관리자 페이지로 가지 않고 `HomeinappComplete.tsx`로 이동하도록 변경.
- `HomeinappPayment.tsx`에서 `이메일` 항목을 `계정`으로 변경:
  - 로그인 계정 자동 입력
  - `disabled` 처리
- 결제 연동은 `PortoneRequestPay.js`가 아닌 `PortoneBilling.js`로 통일.

## 5. 서버 결제 저장 로직

- 파일: `server/routers/service/homeinapp/homeinappPaymentService.js`
- `ensureHomeinappOrdersTable` 자동 생성/보정 로직 제거.
- 결제 저장 대상을 별도 주문 테이블이 아닌 `churches` 테이블로 변경.
- `paymentId` 중복 결제 확인 후 insert 처리.
- `id`는 `YYMMDD + 영문6자리` 형식으로 생성.
- 운영 환경 이슈 대응을 위해 `homeinappdb` 로딩 실패 시 `commondb` fallback 처리.

## 6. DB 스키마 정리

홈인앱 알림/결제 연동을 위해 아래 구조를 기준으로 사용.

### 6-1) churches

```sql
CREATE TABLE churches (
    id VARCHAR(12) PRIMARY KEY,          -- 날짜6자리 + 영문6자리 (예: 260422KRAABC)
    churchName VARCHAR(100) NOT NULL,
    representatives TEXT,                -- 예: "홍길동, 김철수, 이영희"
    phoneNumber VARCHAR(20),             -- 교회 대표 번호
    deviceId VARCHAR(100) DEFAULT NULL,  -- 대표 등록 기기 식별값(선택)
    userAccount TEXT,                    -- 예: [{"loginId":"admin1","passwordHash":"..."}]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    portonePaymentId VARCHAR(255) DEFAULT NULL,
    portonePaidAmount INT DEFAULT NULL,
    portoneOrderName VARCHAR(255) DEFAULT NULL,
    portonePlan VARCHAR(30) DEFAULT NULL,
    schedulePaymentId VARCHAR(255) DEFAULT NULL,
    billingKey VARCHAR(255) DEFAULT NULL,
    portonePaidAt VARCHAR(64) DEFAULT NULL,
    portoneTimeToPay VARCHAR(64) DEFAULT NULL,
    portoneScheduleId VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```



### 6-2) users

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id VARCHAR(12) NOT NULL,
    deviceId VARCHAR(100) UNIQUE,        -- 기기 고유 식별값(권장)
    fcmToken VARCHAR(255) NOT NULL UNIQUE,
    deviceType ENUM('android', 'ios', 'web') DEFAULT 'android',
    isActive BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6-3) notifications

```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id VARCHAR(12) NOT NULL,
    adminLoginId VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    readCount INT DEFAULT 0,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 7. 최근 UI 이슈 및 보정

- 이슈: `HomeinappNotificationMain.tsx`의 본문 섹션(`hipush-content-grid`)이 1400px을 넘어 보이는 현상.
- 조치: `HomeinappNotificationMain.scss`에서 폭 제약 보강.
  - 그리드 우측 컬럼 최소폭 완화
  - `width/max-width: 100%` 적용
  - 사이드 컬럼 `min-width: 0` 추가
  - 이력 테이블 `min-width` 제거 + `table-layout: fixed` 적용

---

필요 시 다음 단계:
- 실제 푸시 발송 API(Firebase Admin) 연동
- 발송 이력/통계를 더미 데이터에서 DB 기반 조회로 전환
- 교회별 권한 검증(요청 계정과 교회 매핑) 강화

## 8. Firebase 멀티 프로젝트(교회별 분리 발송) 운영 가이드

Firebase 프로젝트가 2개 이상이고, 하나의 관리자 페이지에서 교회별로 알림을 따로 보내야 하는 경우 아래 구조로 운영합니다.

### 8-1) DB 구조 보완

각 교회가 어떤 Firebase 설정(키 파일)을 사용하는지 식별할 수 있어야 하므로 `churches` 테이블에 키 파일 경로를 저장합니다.

추가로, 토큰 재발급/재설치 상황을 안정적으로 처리하려면 `deviceId`를 병행 수집하는 것이 좋습니다.

- 앱에서 `deviceId + fcmToken`을 함께 서버로 전송
- 서버는 `deviceId` 기준으로 기존 레코드를 찾고 토큰만 최신값으로 갱신
- 권장 SQL 패턴:

```sql
INSERT INTO users (church_id, deviceId, fcmToken, deviceType, isActive)
VALUES (?, ?, ?, ?, TRUE)
ON DUPLICATE KEY UPDATE
  fcmToken = VALUES(fcmToken),
  deviceType = VALUES(deviceType),
  isActive = TRUE;
```


### 8-2) 백엔드에서 여러 프로젝트 초기화하기 (Node.js)

Firebase Admin SDK 초기화 시 앱 이름을 부여하여 프로젝트를 구분합니다.

```

### 8-3) 특정 프로젝트로 알림 발송하기

발송 시 `admin.messaging(app)`처럼 특정 인스턴스를 지정해서 호출합니다.

```

### 8-4) 주의사항 및 팁

- 메모리 관리: 교회(프로젝트)가 수천 개라면 모든 인스턴스를 메모리에 들고 있는 것이 부담될 수 있습니다. 일반적인 사역자 서비스 규모에서는 위와 같은 캐싱 방식이 빠르고 효율적입니다.
- 키 파일 업로드: 관리자 페이지에서 각 교회의 `.json` 키 파일을 업로드받아 서버 특정 경로에 저장하고, 그 경로를 DB에 기록하는 로직이 필요합니다.
- 기본 앱(Default App) 주의: `admin.initializeApp()`을 인자 없이 여러 번 호출하면 에러가 납니다. 반드시 두 번째 인자로 고유한 이름(`churchId`)을 전달해야 합니다.
- 토큰 정리 전략:
  - 권장: `deviceId` 기반으로 토큰을 갱신하여 중복 레코드를 원천 차단
  - 대안: 토큰 기준 운영 시 발송 실패(`invalid token`)를 받는 즉시 DB에서 해당 토큰을 삭제하는 자동 청소 로직 적용

이 방식을 사용하면 단 하나의 관리자 서버에서 수십, 수백 개의 서로 다른 Firebase 프로젝트로 푸시 알림을 개별 발송할 수 있습니다. 각 교회가 자체 프로젝트를 가지므로 알림 통계도 분리 관리할 수 있다는 장점이 있습니다.

## 9. 앱-서버 푸시 운영 로직 정리

### 9-1) 교회 등록 및 토큰 전송 로직 (App -> Server)

사용자가 앱을 처음 설치하고 교회 코드(12자리)를 입력했을 때 실행되는 흐름입니다.

- 앱(Client)
  - Firebase SDK에서 `fcmToken` 발급
  - 사용자 입력값 `church_id`(예: `260422KRAABC`), `fcmToken`, `deviceType`을 서버 API로 전송
- 서버(Server)
  - 전달받은 `church_id`가 `churches` 테이블에 존재하는지 검증
  - `users` 테이블에 토큰 저장(이미 존재하면 `church_id` 갱신 및 재활성화)

```sql
INSERT INTO users (church_id, fcmToken, deviceType)
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE
  church_id = VALUES(church_id),
  isActive = TRUE;
```

### 9-2) 토큰 갱신 로직 (App -> Server)

FCM 토큰은 영구값이 아니므로 앱 업데이트, 캐시 삭제, 보안 정책 변경 등으로 갱신될 수 있습니다.

- 앱(Client)
  - `onTokenRefresh`(Firebase 리스너) 발생 시 새 토큰을 서버에 즉시 전송
- 서버(Server)
  - 이전 토큰을 새 토큰으로 교체하거나, 기존 레코드를 정리 후 새 레코드를 생성
  - 목표: 기기당 최신 토큰 1개 유지

### 9-3) 알림 수신 및 클릭 처리 (Firebase -> App)

서버 발송 이후 앱 측에서 필요한 처리입니다.

- 앱(Client)
  - Foreground(앱 사용 중): OS 팝업이 안 뜰 수 있으므로 앱 내 커스텀 배너/알럿 처리 필요
  - Background/Terminated(백그라운드/종료): OS 알림 표시
  - 알림 클릭 시 Deep Link로 특정 페이지(예: 공지사항 상세) 이동 처리 권장

### 9-4) 토큰 무효화(Cleaning) 로직 (Server -> DB)

앱 삭제 여부는 서버가 즉시 알 수 없고, 실제 발송 시 Firebase 응답에서 확인됩니다.

- 서버(Server)
  - 발송 후 Firebase 에러(`NotRegistered` 등)를 받으면 죽은 토큰으로 판단
  - 즉시 `isActive = FALSE`로 전환하거나 해당 행 삭제
  - 목적: 다음 발송 대상에서 제외하여 발송 성능/성공률 유지
