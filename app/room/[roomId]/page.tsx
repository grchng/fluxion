"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { ChatPanel } from "src/components/ChatPanel";
import { ChatMessage } from "src/types/shared";

export default function RoomPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [displayName] = useState(() => {
    if (typeof window === "undefined") return "Guest";
    return localStorage.getItem("displayName") ?? "Guest";
  });
  const params = useParams();
  const roomId = String(params.roomId).toUpperCase();
  const socketRef = useRef<WebSocket | null>(null);

  function sendChat(text: string) {
    const newMessage = { type: "chat", text, displayName };
    socketRef.current?.send(JSON.stringify(newMessage));
    setMessages((prev) => [...prev, newMessage]);
  }

  useEffect(() => {
    // start server
    const socket = new WebSocket(process.env.NEXT_PUBLIC_SYNC_SERVER_URL!);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      // create room
      socket.send(
        JSON.stringify({
          type: "join",
          roomId,
          displayName,
        }),
      );
    });

    // send msg
    socket.addEventListener("message", (e) => {
      const message = JSON.parse(e.data);
      setMessages((prev) => [...prev, message]);
    });

    return () => socket.close();
  }, [roomId, displayName]);

  return (
    <main>
      Room {roomId}
      <ChatPanel messages={messages} sendChat={sendChat} />
    </main>
  );
}
