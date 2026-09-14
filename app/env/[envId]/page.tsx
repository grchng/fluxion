"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { ChatPanel } from "src/components/ChatPanel";
import { ChatMessage } from "src/types/shared";

export default function EnvPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [displayName] = useState(() => {
    if (typeof window === "undefined") return "Guest";
    return localStorage.getItem("displayName") ?? "Guest";
  });
  const [isCopied, setIsCopied] = useState(false);

  const params = useParams();
  const envId = String(params.envId).toUpperCase();
  const socketRef = useRef<WebSocket | null>(null);

  function copyEnvCode() {
    navigator.clipboard.writeText(envId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

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
          envId,
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
  }, [envId, displayName]);

  return (
    <main className="min-h-screen bg-flux-bg p-3 font-mono">
      <div className="flex">
        <p className="mb-2 text-xs text-flux-text uppercase">Env {envId}</p>
        <button
          onClick={copyEnvCode}
          aria-label="Copy env link"
          className="text-flux-dim hover:text-flux-cyan flex justify-center">
          {isCopied ? (
            <Check size={14} className="text-flux-cyan" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
      <div className="flex h-[400px] gap-0 border border-flux-border">
        <div className="flex-1 bg-flux-stage" />
        <div className="w-[190px]">
          <ChatPanel messages={messages} sendChat={sendChat} />
        </div>
      </div>
    </main>
  );
}
