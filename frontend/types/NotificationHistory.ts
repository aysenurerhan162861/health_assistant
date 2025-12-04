export interface NotificationHistory {
  id: number;
  user_id: number;
  event_name: string;
  title: string;
  body: string;
  event_metadata?: any;
  read: boolean;
  created_at: string;
}
