"use client";

import { useEffect, useRef, useState } from "react";

type message = {
  type: string;
  text: string;
  displayName: string;
};

interface ChatPanelProps {
  messages: message[];
  sendChat: (text: string) => void;
}

export function ChatPanel({ messages, sendChat }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  return (
    <aside className="flex h-full flex-col border-l border-flux-border bg-flux-stage/90 font-mono bg-ye">
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2.5">
        <p className="text-[10px] tracking-widest text-flux-faint">
          &gt; CHANNEL OPEN
        </p>

        {messages.map((msg, index) =>
          msg.type === "system" ? (
            <p key={index} className="text-[11px] text-flux-dim">
              // {msg.text}
            </p>
          ) : (
            <p key={index} className="text-xs leading-relaxed">
              <span style={{ color: "yellow" }}>{msg.displayName}&gt;</span>
              <span className="text-flux-text">{msg.text}</span>
            </p>
          ),
        )}
      </div>

      <div className="border-t border-flux-border p-2">
        <input
          type="text"
          value={draft}
          placeholder="_ transmit"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendChat(draft);
              setDraft("");
            }
          }}
          aria-label="Chat message"
          className="w-full bg-transparent text-xs text-flux-text placeholder:text-flux-faint focus:outline-none"
        />
      </div>
    </aside>
  );
}
