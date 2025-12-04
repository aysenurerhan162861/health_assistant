export interface NotificationSetting {
  event_name: string;
  push_enabled: boolean;
  email_enabled: boolean;
}

export interface NotificationHistory {
  id: number;
  event_name: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  created_at: string;
}
