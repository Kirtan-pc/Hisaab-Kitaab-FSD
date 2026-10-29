import { useEffect, useRef, useState, type FormEvent } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../api";

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface ServerToClientEvents {
  chatMessage: (message: ChatMessage) => void;
}

interface ClientToServerEvents {
  chatMessage: (
    payload: { text: string },
    acknowledge: (result: { ok?: boolean; error?: string }) => void,
  ) => void;
}

export function RealtimeChat({
  token,
  accountId,
  accountName,
  onBack,
  onUnauthorized,
}: {
  token: string;
  accountId: string;
  accountName: string;
  onBack: () => void;
  onUnauthorized?: () => void;
}) {
  const socketRef =
    useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || API_BASE_URL || window.location.origin,
      { auth: { token }, reconnection: true },
    ) as Socket<ServerToClientEvents, ClientToServerEvents>;
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      setError("");
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (connectError: Error) => {
      setConnected(false);
      setError(connectError.message);
      if (connectError.message === "Authentication required.") {
        onUnauthorized?.();
      }
    };
    const onChatMessage = (incoming: ChatMessage) => {
      setMessages((current) => [...current.slice(-99), incoming]);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("chatMessage", onChatMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("chatMessage", onChatMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    const socket = socketRef.current;
    if (!text || !socket?.connected) return;

    socket.emit("chatMessage", { text }, (result) => {
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("");
        setError("");
      }
    });
  }

  return (
    <main className="page-in-right diary-shell paper-page flex flex-col px-7 py-6">
      <button
        type="button"
        onClick={onBack}
        className="w-fit text-sm font-semibold text-burgundy"
      >
        ← Back to account
      </button>
      <section className="mt-8 flex min-h-0 flex-1 flex-col border-l-2 border-margin pl-5">
        <p className="text-[10px] font-bold tracking-[.22em] text-burgundy">
          EXPERIMENT 8 · SOCKET.IO
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink">
          Real-time messages
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Messages are shared only with authenticated connections for this shop.
        </p>
        <p
          role="status"
          className={`mt-4 text-sm font-bold ${connected ? "text-paid" : "text-due"}`}
        >
          {connected ? "Connected" : "Disconnected"}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm font-bold text-due">
            {error}
          </p>
        )}
        <ol
          aria-live="polite"
          className="my-4 min-h-40 flex-1 space-y-3 overflow-auto border border-line bg-white/50 p-3"
        >
          {messages.map((item) => (
            <li key={item.id} className="border-b border-line pb-2 text-sm">
              <p className="font-bold">
                {item.senderId === accountId
                  ? accountName
                  : `Shop ${item.senderId.slice(-6)}`}
              </p>
              <p className="break-words">{item.text}</p>
              <time className="text-xs text-ink-soft">
                {new Date(item.timestamp).toLocaleTimeString()}
              </time>
            </li>
          ))}
        </ol>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={500}
            aria-label="Message"
            placeholder="Write a message"
            className="min-w-0 flex-1 border-b-2 border-line bg-transparent py-2 outline-none focus:border-burgundy"
          />
          <button
            type="submit"
            disabled={!connected || !message.trim()}
            className="rounded-md bg-burgundy px-4 py-2 font-bold text-[#f8edd4] disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
