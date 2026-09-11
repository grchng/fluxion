"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  type: string;
  text: string;
  displayName?: string;
};

interface ChatPanelProps {
  messages: ChatMessage[];
  sendChat: (text: string) => void;
}

export function ChatPanel({ messages, sendChat }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  return (
    <aside>
      <div>chat messages here</div>
      {messages.map((msg, i) => (
        <div key={i}>
          {msg.displayName}: {msg.text}
        </div>
      ))}
      <div>
        <input
          type="text"
          value={draft}
          placeholder="message here"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendChat(draft);
              setDraft("");
            }
          }}
        />
      </div>
    </aside>
  );
}
