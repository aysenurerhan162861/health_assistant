import axios from "axios";
import { NotificationSetting } from "@/types/Notification";

const BASE_URL = "http://localhost:8000/api/notification";

const authHeader = () => ({
  headers: {
    "token-header": `Bearer ${localStorage.getItem("token")}`
  },
});

// Get Settings
export const getNotificationSettings = async (): Promise<NotificationSetting[]> => {
  const { data } = await axios.get(`${BASE_URL}/settings`, authHeader());
  return data;
};

// Update Setting
export const updateNotificationSetting = async (
  event_name: string,
  push_enabled: boolean,
  email_enabled: boolean
) => {
  const { data } = await axios.patch(
    `${BASE_URL}/settings`,
    { event_name, push_enabled, email_enabled },
    authHeader()
  );
  return data;
};

