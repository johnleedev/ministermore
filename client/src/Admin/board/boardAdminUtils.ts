/** 자연스러운 한글 닉네임 (이름·별칭·짧은 문구) */
const KOREAN_NICKNAMES = [
  '민준',
  '서연',
  '지우',
  '현수',
  '수진',
  '영호',
  '재혁',
  '은혜',
  '평안',
  '소망',
  '맑은아침',
  '따뜻한마음',
  '기도하는이',
  '찬양하는형',
  '새벽기도',
  '은혜받은',
  '평안한날',
  '햇살맘',
  '별밤산책',
  '믿음의길',
  '사랑하는형',
  '축복받은',
  '감사한하루',
  '주님의손',
  '말씀사랑',
  '교회청년',
  '전도사님팬',
  '목회자친구',
  '장로님따라',
  '사모님친구',
  '신학생활',
  '예배드리는',
  '찬양팀원',
  '성경읽는',
  '기쁨가득',
  '소망찬란',
  '은혜로운',
  '축복가득',
  '평신도김',
  '교역자이',
  '다윗같은',
  '바울사랑',
  '요한복음',
  '시편읽기',
  '잠언지혜',
  '갈릴리바다',
  '베들레헴',
  '예루살렘',
  '감람산',
  '올리브',
  '양떼목자',
];

/** 의미 있는 영문 닉네임 */
const ENGLISH_NICKNAMES = [
  'grace',
  'hope',
  'faith',
  'peace',
  'joy',
  'love',
  'mercy',
  'blessed',
  'believer',
  'shepherd',
  'pastor',
  'worship',
  'praise',
  'gospel',
  'truth',
  'light',
  'salt',
  'vine',
  'lamb',
  'dove',
  'david',
  'paul',
  'john',
  'peter',
  'mary',
  'ruth',
  'esther',
  'daniel',
  'joshua',
  'samuel',
  'gentle',
  'humble',
  'faithful',
  'joyful',
  'thankful',
  'prayerful',
  'worshiper',
  'disciple',
  'servant',
  'witness',
  'morningstar',
  'goodshepherd',
  'livingwater',
  'breadoflife',
  'rockofsalvation',
  'holyspirit',
  'sonofgod',
  'childofgod',
  'graceful',
  'hopeful',
  'faithfulone',
  'peaceful',
  'joyfulheart',
  'blessedlife',
  'gospelheart',
  'worshipper',
  'praiselord',
  'biblelover',
  'psalmreader',
  'churchfriend',
  'youthleader',
  'sundayschool',
];

/** 영문+숫자 조합용 단어 */
const ENGLISH_WORDS_FOR_NUMBER = [
  'grace',
  'hope',
  'faith',
  'peace',
  'joy',
  'love',
  'mercy',
  'blessed',
  'believer',
  'shepherd',
  'pastor',
  'worship',
  'praise',
  'gospel',
  'truth',
  'light',
  'david',
  'paul',
  'john',
  'peter',
  'mary',
  'daniel',
  'joshua',
  'samuel',
  'gentle',
  'humble',
  'faithful',
  'joyful',
  'thankful',
  'disciple',
  'servant',
  'witness',
  'morning',
  'evening',
  'sunday',
  'bible',
  'psalm',
  'church',
  'youth',
  'prayer',
  'amen',
  'hallelujah',
  'maranatha',
  'emmanuel',
  'savior',
  'lord',
  'cross',
  'resurrection',
  'pentecost',
  'galilee',
  'bethlehem',
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function generateKoreanNickName() {
  return pickRandom(KOREAN_NICKNAMES);
}

function generateEnglishNickName() {
  return pickRandom(ENGLISH_NICKNAMES);
}

function generateEnglishNumberNickName() {
  const word = pickRandom(ENGLISH_WORDS_FOR_NUMBER);
  const digitCount = randomInt(2, 4);
  const min = 10 ** (digitCount - 1);
  const max = 10 ** digitCount - 1;
  return `${word}${randomInt(min, max)}`;
}

/** 한글 / 영문 / 영문+숫자 중 하나의 형태로 랜덤 닉네임 생성 */
export function generateRandomUserNickName() {
  const style = randomInt(0, 2);
  if (style === 0) return generateKoreanNickName();
  if (style === 1) return generateEnglishNickName();
  return generateEnglishNumberNickName();
}
