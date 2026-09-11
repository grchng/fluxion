"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoomCode } from "src/utils/createRoomCode";

export default function HomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("displayName") ?? "";
  });
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  function saveDisplayName() {
    localStorage.setItem("displayName", displayName.trim());
  }

  function startRoom(code: string) {
    saveDisplayName();
    router.push(`/room/${code.toUpperCase()}`);
  }

  function joinRoom(code: string) {
    const roomId = code.trim().toUpperCase();
    if (!roomId) return;

    setError("");

    const tempSocket = new WebSocket(process.env.NEXT_PUBLIC_SYNC_SERVER_URL!);

    // open connection first from browser -> server
    tempSocket.addEventListener("open", () => {
      tempSocket.send(JSON.stringify({ type: "search", roomId }));
    });

    // message from server to browser
    tempSocket.addEventListener("message", (e) => {
      const message = JSON.parse(e.data);
      if (message.type !== "search-results") return;

      tempSocket.close();

      if (message.exists) {
        saveDisplayName();
        // go to that route
        router.push(`/room/${message.roomId}`);
      } else {
        setError("No room with that code");
      }
    });

    // browser --> server
    tempSocket.addEventListener("error", () => {
      setError("Could not reach server");
    });
  }

  return (
    <main className="min-h-screen bg-flux-bg px-6 py-24 font-mono">
      <div className="mx-auto w-full max-w-[330px]">
        <p className="text-[11px] tracking-[0.2em] text-flux-faint">
          &gt; SESSION INIT
        </p>

        <h1 className="mt-3.5 text-[27px] tracking-[0.3em] text-flux-yellow">
          ƒLUXION
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-flux-dim">
          Same video. Same second. Watch with friends.
        </p>

        <div className="mt-8">
          <label
            htmlFor="name-field"
            className="mb-1.5 block text-[11px] tracking-widest text-flux-dim uppercase">
            Handle
          </label>
          <input
            id="name-field"
            type="text"
            value={displayName}
            placeholder="display name"
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full border border-flux-border bg-transparent px-3 py-2 text-[13px]
            text-flux-text placeholder:text-flux-faint focus:border-flux-cyan focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="code-field"
            className="mb-1.5 block text-[11px] tracking-widest text-flux-dim">
            ROOM CODE
          </label>
          <div className="flex gap-2">
            <input
              id="code-field"
              type="text"
              value={roomCode}
              placeholder="HXQ-402"
              onChange={(event) => setRoomCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && roomCode) joinRoom(roomCode);
              }}
              className="flex-1 border border-flux-border bg-transparent px-3 py-2 text-[13px]
              tracking-widest text-flux-text placeholder:text-flux-faint focus:border-flux-cyan focus:outline-none"
            />
            <button
              onClick={() => joinRoom(roomCode)}
              disabled={!roomCode}
              className="border border-flux-cyan px-5 text-xs tracking-widest text-flux-cyan
              hover:bg-flux-cyan/10 disabled:opacity-30 disabled:hover:bg-transparent uppercase">
              Join
            </button>
          </div>
        </div>

        {error && <p className="mt-2 text-[11px] text-flux-red">// {error}</p>}

        <div className="my-6 flex items-center gap-2.5">
          <span className="h-px flex-1 bg-flux-border" />
          <span className="text-[11px] text-flux-faint uppercase">or</span>
          <span className="h-px flex-1 bg-flux-border" />
        </div>

        <button
          onClick={() => startRoom(createRoomCode())}
          className="w-full border border-flux-yellow py-2.5 text-xs tracking-[0.2em] text-flux-yellow hover:bg-flux-yellow/10 uppercase">
          Start a room
        </button>
        <p className="mt-2.5 text-center text-[11px] text-flux-faint">
          You&apos;ll get a code to share.
        </p>
      </div>
    </main>
  );
}
