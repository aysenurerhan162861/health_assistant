// services/ChatApi.ts
let socket: WebSocket | null = null;

export const connectWebSocket = (
  room: string,
  onMessage: (msg: string) => void,
  onOpen?: () => void,
  onClose?: () => void
) => {
  // Yeni bağlantı öncesi eski soketi kapat
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.close();
    } catch {}
  }

  const token = localStorage.getItem("token");
  if (!token) return console.error("Token bulunamadı.");

  const wsUrl = `ws://localhost:8000/ws/chat?token=${token}&room=${room}`;
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("WS OPEN");
    onOpen?.();
  };

  socket.onmessage = (event) => {
    onMessage(event.data);
  };

  socket.onclose = () => {
    console.log("WS CLOSE");
    onClose?.();
  };

  socket.onerror = (err) => console.error("WS ERROR:", err);
};

export const sendMessage = (msg: string, retry = true) => {
  if (!socket) {
    console.error("WebSocket açık değil — mesaj gönderilemedi.");
    return;
  }

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(msg);
    return;
  }

  // CONNECTING durumunda kısa bir retry denemesi yap
  if (socket.readyState === WebSocket.CONNECTING && retry) {
    setTimeout(() => sendMessage(msg, false), 100);
    return;
  }

  console.error("WebSocket açık değil — mesaj gönderilemedi.");
};

export const disconnectWebSocket = () => {
  if (socket) {
    try {
      socket.close();
    } catch {}
    socket = null;
  }
};
