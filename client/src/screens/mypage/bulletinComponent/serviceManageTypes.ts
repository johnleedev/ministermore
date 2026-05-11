export interface BookletItem {
  id: number;
  title: string;
  type: string;
  churchName: string;
  mainPastor: string;
  imageMainName: string;
}

export interface EventBookletItem {
  id: number;
  eventName: string;
  date: string;
  place: string;
  address: string;
  superViser: string;
  imageMainName: string;
}

export interface BulletinItem {
  id: number;
  churchName: string;
  bulletinTitle: string;
  bulletinDate: string;
  imageMainName: string;
}

export interface BulletinWorshipRow {
  num: string;
  title: string;
  sub: string;
  right: string;
}

export interface BulletinEditorState {
  id: number;
  templateId: string;
  churchName: string;
  bulletinTitle: string;
  bulletinDate: string;
  imageMainName: string;
  introText: string;
  newsText: string;
  quiry: string;
  worshipRows: BulletinWorshipRow[];
}

export interface DonorRow {
  name: string;
  type: string;
}

export type ServiceType = 'mobile-church-notice' | 'mobile-event-notice';
