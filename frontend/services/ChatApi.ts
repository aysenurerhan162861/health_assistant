// services/ChatApi.ts
let socket: WebSocket | null = null;

export const connectWebSocket = (
  room: string,
  onMessage: (msg: string) => void,
  onOpen?: () => void,
  onClose?: () => void
) => {
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

export const sendMessage = (msg: string) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket açık değil — mesaj gönderilemedi.");
    return;
  }
  socket.send(msg);
};
