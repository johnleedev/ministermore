export type RetreatListItem = {
  id: number;
  userAccount: string | null;
  churchName: string | null;
  orderTitle: string | null;
  ordererName: string | null;
  ordererPhone: string | null;
  link: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  hasInfo: boolean;
  eventName: string | null;
  infoId: number | null;
};

export type RetreatInfoForm = {
  eventName: string;
  eventNameEn: string;
  date: string;
  place: string;
  superViser: string;
  address: string;
  quiry: string;
  placeNaver: string;
  placeKakao: string;
  programType: string;
  visibleTabs: string;
  applyNote: string;
  eventGreeting: string;
  imageMain: string;
};

export type RetreatProgramRow = {
  id?: number;
  showOrder: string;
  subTitle: string;
  title: string;
  dateTime: string;
  career: string;
  postImage: string;
  showDateTime: boolean;
};

export type RetreatRequestRow = {
  id: number;
  bookletId: string;
  userName: string;
  userPhone: string;
  userGroup: string | null;
  note: string | null;
  created_at: string;
};

export type { RetreatCustomQuestion, RetreatCustomAnswers } from './retreatRequestForm';

export type RetreatAnswerRow = {
  id: number;
  bookletId: string;
  userName: string;
  userPhone: string;
  userGroup: string | null;
  userGender: string | null;
  userAge: string | null;
  note: string | null;
  customAnswers: Record<string, string | string[]>;
  created_at: string;
};

export type RetreatAnswersResponse = {
  customQuestions: import('./retreatRequestForm').RetreatCustomQuestion[];
  list: RetreatAnswerRow[];
};

export type RetreatPublicDetail = {
  main: {
    id: number;
    orderTitle: string | null;
    link: string | null;
  };
  info: (RetreatInfoForm & { id?: number; bookletId?: string }) | null;
  programs: Array<RetreatProgramRow & { showDateTime?: boolean | number }>;
};

export type RetreatDetail = {
  main: {
    id: number;
    orderTitle: string | null;
    link: string | null;
  };
  info: (RetreatInfoForm & { id?: number; bookletId?: string }) | null;
  programs: Array<RetreatProgramRow & { showDateTime?: boolean | number }>;
};
