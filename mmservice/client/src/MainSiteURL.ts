/** ministermore 메인 사이트 URL */
const MainSiteURL =
  process.env.REACT_APP_MAIN_SITE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://ministermore.co.kr' : 'http://localhost:3000');

export default MainSiteURL;
