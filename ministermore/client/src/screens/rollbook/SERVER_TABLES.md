# 📋 교회 출석 관리 시스템 설계서 (Rollbook System)

본 문서는 다수 교회를 지원하는 리액트/익스프레스 기반 멀티 테넌시 출석부 시스템의 구조를 정의합니다.

---

## 1. 데이터베이스 스키마 (MySQL)

### A. 메인 데이터베이스 (rollbook)

모든 서비스의 공통 설정 및 조직 구조를 관리합니다.

```sql
CREATE DATABASE IF NOT EXISTS rollbook;
USE rollbook;

-- 1. 교회 리스트 (churchList)
CREATE TABLE churches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kor_name VARCHAR(100) NOT NULL,    -- 교회 한글명
    eng_name VARCHAR(100) NOT NULL,    -- 교회 영문명 (테이블 생성 접두어)
    description TEXT,                  -- 교회 소개
    adminpasswd VARCHAR(100) NULL,     -- 운영 비밀번호 (부서관리 등)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기존 테이블에 adminpasswd 추가 시:
-- ALTER TABLE churches ADD COLUMN adminpasswd VARCHAR(100) NULL;

-- 2. 부서 리스트 (departments)
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    chief_id INT NULL,           -- leaders.id (부서 담당자 1명)
    chief_name VARCHAR(50) NULL, -- 담당자 이름 (표시용)
    group_sort VARCHAR(20) DEFAULT '소그룹',  -- 그룹 종류: 반, 가지, 순, 소그룹 등
    leader_sort VARCHAR(20) DEFAULT '교사',  -- 담당 종류: 교사, 리더, 순장, 목장 등
    student_sort VARCHAR(20) DEFAULT '학생', -- 학생 종류: 학생, 가지원, 조원, 지체, 순원 등
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
);

-- 기존 테이블에 student_sort 추가 시:
-- ALTER TABLE departments ADD COLUMN student_sort VARCHAR(20) DEFAULT '학생';
-- 기존 테이블에 group_sort, leader_sort 추가 시:
-- ALTER TABLE departments ADD COLUMN group_sort VARCHAR(20) DEFAULT '소그룹';
-- ALTER TABLE departments ADD COLUMN leader_sort VARCHAR(20) DEFAULT '교사';

-- 3. 소그룹 리스트 (smallgroups)
CREATE TABLE smallgroups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    church_id INT NOT NULL,
    dept_id INT NOT NULL,
    group_name VARCHAR(50) NOT NULL,
    leader_name VARCHAR(50) NOT NULL,
    leader_id INT NULL,
    FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 4. 리더/교사 관리 (leaders)
-- dept_id: INT, 부서별 1행. 여러 부서 진입 시 각 부서마다 등록
CREATE TABLE leaders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NULL,
    dept_id INT NULL,             -- 부서 ID (1인 1부서당 1행)
    church_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,    -- 암호화 저장 권장
    is_approved BOOLEAN DEFAULT FALSE,  -- 부서 담당자 승인 여부
    isChief BOOLEAN DEFAULT FALSE,      -- 부서 담당자 여부 (departments.chief_id와 연동)
    authlevel TINYINT DEFAULT 5         -- 접근 권한 레벨 (0~5)
);

-- authlevel 값: 0=전체관리자, 1=전체운영자, 2=부서관리자, 3=부서운영자, 4=소그룹담당, 5=소그룹부담당
-- ALTER TABLE leaders ADD COLUMN authlevel TINYINT DEFAULT 5;
```

### B. 교회별 개별 데이터베이스 (rollbookbychurch)

교회 등록 시 동적으로 생성되는 테이블입니다. 테이블명은 `ch{id}{eng_name}_[tableName]` 형식을 따릅니다.

```sql
CREATE DATABASE IF NOT EXISTS rollbookbychurch;
USE rollbookbychurch;

/* [동적 생성 예시] 
  ID가 1이고 영문명이 'green'인 경우 테이블명:
  1. ch1green_students
  2. ch1green_attendance
*/

-- 1. 학생 명단 (동적 생성용 템플릿)
CREATE TABLE ch1green_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,             -- rollbook.smallgroups 참조
    dept_id INT NULL,                  -- rollbook.departments 참조 (통계/부서별 조회용)
    name VARCHAR(50) NOT NULL,
    birth_date DATE NULL,
    school VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 출석 현황 (동적 생성용 템플릿)
-- 일요일 체크만 수행하므로 날짜(att_date)와 학생ID를 복합키로 관리
-- dept_id, group_id: 교회/부서/소그룹 페이지 통계 조회 편의용
CREATE TABLE ch1green_attendance (
    student_id INT NOT NULL,
    att_date DATE NOT NULL,            -- 해당 일요일 날짜
    status TINYINT(1) DEFAULT 1,
    dept_id INT NULL,
    group_id INT NULL,
    PRIMARY KEY (student_id, att_date)
);

-- 기존 테이블에 컬럼 추가 시:
-- ALTER TABLE ch1green_students ADD COLUMN dept_id INT NULL;
-- ALTER TABLE ch1green_attendance ADD COLUMN dept_id INT NULL, ADD COLUMN group_id INT NULL;
```

---

## 2. 페이지 구조 및 접근 권한 (authlevel)

### authlevel 정의 (leaders.authlevel, 0~5)

| authlevel | 명칭 | 설명 |
|-----------|------|------|
| 0 | 전체관리자 | 모든 권한. 부서관리 접근, authlevel 1 운영자 지정 가능 |
| 1 | 전체운영자 | 부서관리 제외한 모든 권한 |
| 2 | 부서관리자 | 해당 부서 전체 권한. 교사 승인, 반관리 가능 |
| 3 | 부서운영자 | 해당 부서 모든 소그룹 접근, 출석/지각/결석 처리. '관리' 버튼 접근 불가 |
| 4 | 소그룹담당 | 해당 소그룹 출석/지각/결석 + '관리' 버튼(학생 등록) 가능 |
| 5 | 소그룹부담당 | 해당 소그룹 출석/지각/결석만. '관리' 버튼 접근 불가 |

### 페이지별 접근 권한

#### 1. 교회 페이지 (RollbookChurhMain)
- **부서관리 버튼**: authlevel 0만 접근
- **authlevel 1 지정**: authlevel 0만 전체운영자 지정 가능
- **부서 추가 버튼**: authlevel 0만

#### 2. 부서 페이지 (RollbookDepartment)
- **교사 승인**: authlevel 2(부서관리자)만
- **반/소그룹관리 버튼**: authlevel 2만
- **소그룹 진입**:
  - authlevel 2, 3: 모든 소그룹 진입 가능
  - authlevel 4, 5: 담당 소그룹(leader_id 일치)만 진입

#### 3. 소그룹 페이지 (RollbookGroup)
- **출석/지각/결석**: authlevel 3, 4, 5 모두 가능
- **'관리' 버튼**: authlevel 4(소그룹담당)만 표시

#### 4. 소그룹 관리 (RollbookGroupAdmin, '관리' 버튼 진입)
- **학생 추가/수정/삭제**: authlevel 4만 가능

### 페이지 순서
1. **교회 페이지** (ChurchMain) → 2. **부서 페이지** (Depart) → 3. **소그룹 페이지** (Group)

---

## 3. 페이지별 상세 기능 (Frontend: React)

### 1️⃣ ChurchList (교회 목록)

- **목록 조회:** 등록된 모든 교회 리스트 출력
- **등록:** 교회 추가 시 `churches` 테이블에 Insert 후, 서버에서 `rollbookbychurch` 내 테이블 자동 생성
- **접근:** 로그인한 사용자는 모든 교회 클릭 가능

### 2️⃣ ChurchMain (교회 페이지)

- **소개:** 특정 교회의 소개글 노출
- **부서 관리:** 관리자 계정만 버튼 표시, 하위 부서 리스트 출력 및 추가/수정/삭제
- **교사/리더 등록:** 관리자 계정이 부서별 리더 등록

### 3️⃣ Depart (부서 페이지)

- **진입:** 리더 로그인 (최종 운영자 포함 모두 로그인 필요)
- **소그룹/반관리:** 부서 담당자(isChief=1)만 버튼 표시
- **소그룹 진입:** 담당 교사/리더는 해당 소그룹만, 부서 담당자만 전체 진입 가능 (관리자 계정은 리더 로그인 필요)

### 4️⃣ Group (소그룹/출석 페이지)

- **출석 체크:** 학생 이름 클릭 시 해당 주 일요일 출석 데이터 토글
- **리더 인증:** 부서 담당자가 `is_approved`를 `true`로 변경한 리더만 로그인 가능

---

## 4. 서버 로직 (Backend: Express)

- **테이블 동적 관리:** `CREATE TABLE` 및 `DROP TABLE` 쿼리를 문자열 템플릿(`ch${id}${eng_name}_students`)을 사용하여 실행

- **인증 시스템:** JWT(JSON Web Token)를 사용하여 리더 인증 처리. 클라이언트의 `sessionStorage`와 연동하여 세션 유지

- **날짜 계산:** 출석 체크 시 현재 날짜 기준 가장 가까운 일요일(혹은 당일 일요일) 날짜를 자동 계산하여 저장

---

## 5. app.js 라우터 등록

```js
const ChurchesRouter = require('./routers/rollbook/Churches');
const DepartmentsRouter = require('./routers/rollbook/Departments');
const SmallgroupsRouter = require('./routers/rollbook/Smallgroups');
const LeadersRouter = require('./routers/rollbook/Leaders');
const AttendanceRouter = require('./routers/rollbook/Attendance');
app.use('/rollbookchurch', ChurchesRouter);
app.use('/rollbookdepart', DepartmentsRouter);
app.use('/rollbookgroup', SmallgroupsRouter);
app.use('/rollbookleaders', LeadersRouter);
app.use('/rollbookattendance', AttendanceRouter);
```

| 테이블 | 라우터 파일 | 경로 |
|--------|-------------|------|
| churches | Churches.js | /rollbookchurch |
| departments | Departments.js | /rollbookdepart |
| smallgroups | Smallgroups.js | /rollbookgroup |
| leaders | Leaders.js | /rollbookleaders |
| attendance (동적) | Attendance.js | /rollbookattendance |
