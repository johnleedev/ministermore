export type HomeinappNotificationItem = {
  id: number;
  church_id: string;
  adminLoginId?: string;
  topic?: string | null;
  title: string;
  content: string;
  readCount: number;
  sent_at: string;
};
