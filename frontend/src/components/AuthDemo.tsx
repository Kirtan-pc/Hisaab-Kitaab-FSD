import { useState, type FormEvent } from "react";
import { apiUrl } from "../api";
import { RealtimeChat } from "./RealtimeChat";

interface Account {
  id: string;
  name: string;
  email: string;
  ownerPhone: string;
  role: "user" | "admin";
}

interface AuthResponse {
  token: string;
  shop: Account;
}

interface AuthDemoProps {
  initialName: string;
  onBack: () => void;
}

export function AuthDemo({ initialName, onBack }: AuthDemoProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showChat, setShowChat] = useState(false);

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult("");

    const body =
      mode === "register"
        ? { name, email, ownerPhone, password }
        : { email, password };

    try {
      const response = await fetch(apiUrl(`/api/auth/${mode}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as AuthResponse | { message?: string };
      if (!response.ok || !("token" in data) || !("shop" in data)) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "The authentication request failed.",
        );
      }

      setAccount(data.shop);
      setToken(data.token);
      setPassword("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not connect to the backend.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function callApi(path: string) {
    if (!token) return;
    setBusy(true);
    setError("");
    setResult("");

    try {
      const response = await fetch(apiUrl(path), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        if (response.status === 401) {
          setAccount(null);
          setToken("");
        }
        throw new Error(data.message ?? "The API request failed.");
      }
      setResult(JSON.stringify(data, null, 2));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not connect to the backend.",
      );
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    setAccount(null);
    setToken("");
    setResult("");
    setError("");
    setShowChat(false);
  }

  if (account && showChat) {
    return (
      <RealtimeChat
        token={token}
        accountId={account.id}
        accountName={account.name}
        onBack={() => setShowChat(false)}
      />
    );
  }

  return (
    <main className="page-in-right diary-shell paper-page flex flex-col px-7 py-6">
      <button
        type="button"
        onClick={onBack}
        className="w-fit text-sm font-semibold text-burgundy"
      >
        ← Back to cover
      </button>
      <section className="mt-10 border-l-2 border-margin pl-5">
        <p className="text-[10px] font-bold tracking-[.22em] text-burgundy">
          EXPERIMENT 6 · JWT
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink">
          Account access
        </h1>

        {account ? (
          <div className="mt-6 space-y-4">
            <div className="border border-line bg-paper/70 p-4 text-sm text-ink">
              <p className="font-bold">{account.name}</p>
              <p>{account.email}</p>
              <p>Role: {account.role}</p>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setShowChat(true)}
                className="rounded-md border border-burgundy px-4 py-3 text-sm font-bold text-burgundy"
              >
                Open real-time message demo
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void callApi("/api/auth/me")}
                className="rounded-md border border-line px-4 py-3 text-sm font-bold text-ink disabled:opacity-50"
              >
                Load my account (/api/auth/me)
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void callApi("/api/protected")}
                className="rounded-md bg-burgundy px-4 py-3 text-sm font-bold text-[#f8edd4] disabled:opacity-50"
              >
                Test authenticated route
              </button>
              {account.role === "admin" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void callApi("/api/admin")}
                  className="rounded-md border border-burgundy px-4 py-3 text-sm font-bold text-burgundy disabled:opacity-50"
                >
                  Test administrator route
                </button>
              )}
              <button
                type="button"
                onClick={signOut}
                className="px-4 py-2 text-sm font-bold text-due"
              >
                Sign out
              </button>
            </div>
            {result && (
              <pre className="overflow-auto border border-line bg-white/60 p-3 text-xs text-ink">
                {result}
              </pre>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 border-b border-line">
              {(["login", "register"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setMode(option);
                    setError("");
                  }}
                  className={`px-3 py-3 text-sm font-bold ${
                    mode === option
                      ? "border-b-2 border-burgundy text-burgundy"
                      : "text-ink-soft"
                  }`}
                >
                  {option === "login" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>
            <form className="mt-5 space-y-4" onSubmit={submitCredentials}>
              {mode === "register" && (
                <>
                  <label className="block text-xs font-bold text-ink-soft">
                    Shop name
                    <input
                      required
                      maxLength={100}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-base text-ink outline-none focus:border-burgundy"
                      autoComplete="organization"
                    />
                  </label>
                  <label className="block text-xs font-bold text-ink-soft">
                    Owner phone
                    <input
                      required
                      type="tel"
                      value={ownerPhone}
                      onChange={(event) => setOwnerPhone(event.target.value)}
                      className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-base text-ink outline-none focus:border-burgundy"
                      autoComplete="tel"
                    />
                  </label>
                </>
              )}
              <label className="block text-xs font-bold text-ink-soft">
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-base text-ink outline-none focus:border-burgundy"
                  autoComplete="email"
                />
              </label>
              <label className="block text-xs font-bold text-ink-soft">
                Password
                <input
                  required
                  type="password"
                  minLength={mode === "register" ? 12 : 1}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full border-b-2 border-line bg-transparent py-2 text-base text-ink outline-none focus:border-burgundy"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                />
              </label>
              {error && (
                <p role="alert" className="text-sm font-bold text-due">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-burgundy px-4 py-3 font-bold text-[#f8edd4] disabled:opacity-50"
              >
                {busy
                  ? "Please wait…"
                  : mode === "register"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
