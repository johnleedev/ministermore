# 화이트라벨 · 멀티 테넌시 재현 가이드

이 문서는 **현재 `ministermore`에 구현된 기능을**, 다른 테넌트(브랜드)용 앱으로 **동일하게 복제**할 때 따라야 할 아키텍처와 작업 목록을 정리합니다.

> **전제:** React Native **0.85.x**, React **19.x**, TypeScript. 전역 상태는 **Recoil이 아닌 Jotai**를 사용합니다 (React 19와 Recoil 호환 불가).

---

## 1. 멀티 테넌시 / 화이트라벨 관점에서의 구조

| 구분 | 설명 |
|------|------|
| **공유 코어** | 네비게이션, FCM/Notifee, 딥링크, WebView 래핑, 설정 UI 패턴 등 테넌트와 무관하게 재사용 |
| **테넌트별 설정** | 앱 표시 이름, 번들 ID, 커스텀 URL 스킴, 홈 WebView 기본 URL, Firebase(`google-services` / `GoogleService-Info.plist`), 아이콘·스플래시, (선택) API `baseURL` |

테넌트마다 **별도 네이티브 타깃(또는 별도 저장소)** 을 두고, 아래 **테넌트 매니페스트**만 바꾸면 같은 JS 트리로 빌드하는 방식을 권장합니다.

### 1.1 테넌트 매니페스트 (예시 필드)

| 키 | 예시 (현재 앱) | 용도 |
|----|----------------|------|
| `TENANT_ID` | `ministermore` | 로깅, 원격 설정 키 등 |
| `APP_DISPLAY_NAME` | `ministermore` | iOS/Android 표시 이름 |
| `IOS_BUNDLE_ID` / `ANDROID_APPLICATION_ID` | `com.ministermore` | 스토어·푸시 |
| `URL_SCHEME` | `ministermore` | 커스텀 스킴 딥링크 (`{scheme}://...`) |
| `HOME_WEB_URL` | `https://ministermore.co.kr/` | 홈 탭 WebView |
| `FCM` | 테넌트별 Firebase 프로젝트 | `google-services.json`, `GoogleService-Info.plist` |

---

## 2. NPM 의존성 (동일 스택 복제)

```bash
npm install @notifee/react-native @react-native-firebase/app @react-native-firebase/messaging \
  @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-gesture-handler \
  react-native-safe-area-context jotai axios react-native-vector-icons \
  @react-native-community/netinfo @react-native-async-storage/async-storage react-native-webview

npm install --save-dev @types/react-native-vector-icons
```

**iOS:** 저장소 루트에서 `cd ios && pod install`.

---

## 3. 네이티브 설정 체크리스트

### 3.1 Android

| 파일 | 내용 |
|------|------|
| `android/app/build.gradle` | `apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"` |
| `android/app/src/main/AndroidManifest.xml` | `INTERNET`, `POST_NOTIFICATIONS`; `MainActivity`에 커스텀 스킴 `VIEW` intent-filter (`android:scheme` = 테넌트 `URL_SCHEME`) |
| `android/app/google-services.json` | 테넌트 Firebase Android 앱용 |

### 3.2 iOS

| 파일 | 내용 |
|------|------|
| `ios/*/Info.plist` | `UIBackgroundModes` → `remote-notification`; 푸프용 문구 `NSPushNotificationUsageDescription`; **커스텀 URL** `CFBundleURLTypes` / `CFBundleURLSchemes`; WebView/탭용 **`UIAppFonts` → `MaterialIcons.ttf`** |
| `ios/*/AppDelegate.swift` | `FirebaseApp.configure()`, `UNUserNotificationCenter` delegate; 포그라운드는 JS(Notifee)만 쓰려면 `willPresent`에서 `completionHandler([])` |
| `GoogleService-Info.plist` | 테넌트 Firebase iOS 앱용 |

테넌트마다 **번들 ID·스킴·표시명**을 Xcode / Gradle에서 일치시킵니다.

---

## 4. 엔트리 · 앱 셸 (JS)

### 4.1 `index.js` (최소 구성)

- **반드시 최상단:** `import 'react-native-gesture-handler';`
- `AppRegistry.registerComponent(...)`

`enableScreens`, FCM `setBackgroundMessageHandler`, Notifee `onBackgroundEvent`는 **현재 프로젝트에서는 `App.tsx` 모듈 스코프**에 두어도 됩니다 (엔트리를 건드리지 않는 정책과 호환).

### 4.2 `App.tsx` (전역 초기화 한 파일에 모음)

다음 순서·역할을 그대로 맞춥니다.

1. `enableScreens()` (react-native-screens)
2. `messaging().setBackgroundMessageHandler(...)` — 백그라운드 FCM 로그 등
3. `notifee.onBackgroundEvent(...)` — 알림 탭 시 `enqueueDeepLink(link)` (데이터 키: `link` / `url` / `deep_link`)
4. 루트 UI: `GestureHandlerRootView` → `SafeAreaProvider` → `AppShell`
5. `AppShell` 내부: `NavigationContainer` + `RootTabs`, `useSetAtom(lastDeepLinkAtom)`으로 딥링크 반영
6. `useEffect`에서 순차적으로:
   - Android 33+ `POST_NOTIFICATIONS` 요청
   - `notifee.requestPermission()`
   - `messaging().registerDeviceForRemoteMessages()` + `messaging().requestPermission()` (FCM 권한)
   - `messaging().getToken()` (로그)
   - `Linking` 초기/이벤트, `AppState` active 시 `dequeueDeepLink` + `getInitialURL` + FCM/Notifee initial notification
   - `onNotificationOpenedApp`, Notifee 포그라운드 탭, `onMessage`에서 Notifee `displayNotification` (포그라운드), Android 채널 생성, `data`에 딥링크 키 복사

---

## 5. 소스 파일 트리 (공유 코어 기준)

```
pendingDeepLink.ts          # 백그라운드에서 JS 올라오기 전 딥링크 큐
src/config/api.ts   # 테넌트별 홈 WebView URL (화이트라벨 시 이 파일명·export를 테넌트 설정으로 대체 가능)
src/deepLink.ts             # FCM/Notifee data에서 link·url·deep_link 추출
src/state/atoms.ts          # lastDeepLinkAtom, homeWebViewBackRequestAtom
src/navigation/RootTabs.tsx # 4탭, initialRouteName Home, 스타일, 웹뷰 뒤로가기 탭 버튼
src/screens/HomeScreen.tsx  # WebView + ref + goBack 핸들러 등록
src/screens/NotificationsScreen.tsx
src/screens/SettingsScreen.tsx  # 알림 전용 설정 UI (그룹형 리스트)
src/api/client.ts           # axios 인스턴스 (테넌트별 baseURL로 확장)
```

---

## 6. 하단 탭 명세 (동작 그대로 복제)

| 순서 | 이름(라우트) | 동작 |
|------|----------------|------|
| 1 | `Back` | **탭 전환 아님.** `tabBarButton`으로 커스텀 — `homeWebViewBackRequestAtom` 증가 + `Home`으로 이동, 포커스된 `HomeScreen`에서 `WebView.goBack()` 실행 |
| 2 | `Home` | `MAIN_API_BASE` 로드하는 `WebView` |
| 3 | `Notifications` | 알림 목록 플레이스홀더 (추후 API 연동) |
| 4 | `Settings` | FCM/Notifee 권한·Android POST·토큰 요약, 시스템 설정 열기, 그룹형 카드 UI |

공통: `headerShown: false`, `tabBarShowLabel: false`, 활성 탭 틴트 `#000000`.

---

## 7. 딥링크 · 푸시 데이터 규약

- **커스텀 스킴:** `{URL_SCHEME}://...` — Android `intent-filter`, iOS `CFBundleURLTypes`와 **동일 문자열** 사용.
- **FCM `data` 페이로드:** 아래 키 중 문자열이 있으면 딥링크로 처리: `link`, `url`, `deep_link`.
- 포그라운드 `onMessage`에서 Notifee로 띄울 때 `data`를 복사해 두어, 탭 시에도 동일 키로 처리 가능.

---

## 8. 화이트라벨 적용 시 최소 변경 작업 순서

1. 새 Git 브랜치 또는 새 저장소에서 RN 템플릿 정렬 (동일 RN/React 버전 권장).
2. [섹션 2](#2-npm-의존성-동일-스택-복제) 패키지 설치 + iOS `pod install`.
3. Firebase 프로젝트 생성 → Android/iOS 앱 등록 → 설정 파일 교체.
4. [섹션 3](#3-네이티브-설정-체크리스트) 번들 ID, `URL_SCHEME`, 표시명, URL Types, 폰트, 권한 문구 일괄 변경.
5. `src/config/api.ts`의 **`MAIN_API_BASE`** 을 테넌트 홈 URL로 변경 (파일 경로를 `src/config/tenant.ts` 등으로 통일해도 됨).
6. `src/deepLink.ts`의 키 목록은 서버 규약과 맞추고, 필요 시 테넌트별로만 다른 키를 쓰려면 설정 객체로 승격.
7. `RootTabs`의 Material 아이콘 이름·`URL_SCHEME`·앱 이름 문자열을 매니페스트에서 주입하도록 리팩터 (선택).
8. 스토어용 아이콘·스플래시 교체.

---

## 9. 알려진 제약

- **React 19 + Recoil**은 런타임 오류(`ReactCurrentDispatcher`)가 납니다. 전역 상태는 **Jotai**(또는 Zustand 등) 유지.
- `react-native-vector-icons` 10.x는 deprecate 안내가 있음. 장기적으로는 아이콘 패키지 분리 마이그레이션 검토.

---

## 10. 동작 검증 시나리오 (테넌트 빌드 후)

- [ ] 콜드 스타트 후 **홈 WebView** 로드
- [ ] 다른 탭 → **왼쪽 뒤로가기 탭** → 홈 WebView 히스토리 뒤로가기
- [ ] 커스텀 스킴 URL로 앱 오픈 시 딥링크 처리 (로그 또는 atom)
- [ ] 포그라운드 FCM 수신 시 Notifee 알림
- [ ] 알림 탭 시 딥링크 큐/atom 반영
- [ ] 설정 화면에서 권한 재요청·시스템 설정 이동

---

이 문서만으로도 **동일 아키텍처의 화이트라벨 앱**을 새로 뽑을 수 있도록 구성했습니다. 테넌트별 값은 [1.1](#11-테넌트-매니페스트-예시-필드)을 단일 소스(JSON/YAML/빌드 타임 env)로 옮기면 멀티 테넌시 빌드 파이프라인과 맞추기 쉽습니다.
