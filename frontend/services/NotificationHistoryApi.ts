import axios from "axios";
import { NotificationHistory } from "../types/NotificationHistory";

// Backend URL
const BASE_URL = "http://localhost:8000/api/notification";

export const getNotifications = async (): Promise<NotificationHistory[]> => {
  try {
    const token = localStorage.getItem("token") || "";
    const res = await axios.get(`${BASE_URL}/history`, {
      headers: {
        "token-header": `Bearer ${token}`,
      },
    });
    // Okunmamışları önde tut
    return res.data.sort((a: NotificationHistory, b: NotificationHistory) => {
      if (a.read === b.read) return 0;
      return a.read ? 1 : -1; // okunmamışlar önce
    });
  } catch (err) {
    console.error("Bildirimleri çekerken hata:", err);
    return [];
  }
};

export const markNotificationRead = async (id: number) => {
  try {
    const token = localStorage.getItem("token") || "";
    await axios.patch(`${BASE_URL}/mark_read/${id}`, null, {
      headers: { "token-header": `Bearer ${token}` },
    });
  } catch (err) {
    console.error("Bildirim okunmadı olarak işaretlenemedi:", err);
  }
};
