import { useState, type FormEvent } from "react";
import { apiRequest, ApiError } from "../api";
import { useAppContext } from "../context/AppContext";
import { RealtimeChat } from "./RealtimeChat";
import type { AuthAccount, AuthSession } from "../types";

interface AuthResponse {
  token: string;
  shop: AuthAccount;
}

interface AuthDemoProps {
  initialName: string;
  onBack: () => void;
  onAuthenticated: (session: AuthSession) => void;
}

export function AuthDemo({
  initialName,
  onBack,
  onAuthenticated,
}: AuthDemoProps) {
  const { language, setLanguage, t } = useAppContext();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState<AuthAccount | null>(null);
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
      const data = await apiRequest<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        body,
      });

      setAccount(data.shop);
      setToken(data.token);
      setPassword("");
      onAuthenticated({ token: data.token, account: data.shop });
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        if (requestError.status === 429) {
          setError(t("authRateLimited"));
        } else if (requestError.status === 409) {
          setError(t("authAccountExists"));
        } else if (requestError.status === 400) {
          setError(t("authInvalidDetails"));
        } else {
          setError(requestError.message);
        }
      } else {
        setError(t("authNetworkError"));
      }
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
      const data = await apiRequest<{ message?: string }>(path, { token });
      if (path === "/api/auth/me") {
        setAccount((current) =>
          current && data ? { ...current, ...data } : current,
        );
      }
      setResult(JSON.stringify(data, null, 2));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t("authNetworkError"),
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
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="w-fit text-sm font-semibold text-burgundy"
        >
          ← {t("backToCover")}
        </button>
        <button
          type="button"
          onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
          className="rounded-full border border-line px-3 py-1 text-[11px] font-bold text-ink-soft"
          aria-label={t("switchLanguage")}
        >
          {language === "hi" ? "English" : "हिंदी"}
        </button>
      </div>
      <section className="mt-10 border-l-2 border-margin pl-5">
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink">
          {t("accountAccess")}
        </h1>

        {account ? (
          <div className="mt-6 space-y-4">
            <div className="border border-line bg-paper/70 p-4 text-sm text-ink">
              <p className="font-bold">{account.name}</p>
              <p>{account.email}</p>
              <p>
                {t("role")}: {account.role}
              </p>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setShowChat(true)}
                className="rounded-md border border-burgundy px-4 py-3 text-sm font-bold text-burgundy"
              >
                {t("openRealtimeChat")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void callApi("/api/auth/me")}
                className="rounded-md border border-line px-4 py-3 text-sm font-bold text-ink disabled:opacity-50"
              >
                {t("loadMyAccount")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void callApi("/api/protected")}
                className="rounded-md bg-burgundy px-4 py-3 text-sm font-bold text-[#f8edd4] disabled:opacity-50"
              >
                {t("testAuthenticatedRoute")}
              </button>
              {account.role === "admin" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void callApi("/api/admin")}
                  className="rounded-md border border-burgundy px-4 py-3 text-sm font-bold text-burgundy disabled:opacity-50"
                >
                  {t("testAdministratorRoute")}
                </button>
              )}
              <button
                type="button"
                onClick={signOut}
                className="px-4 py-2 text-sm font-bold text-due"
              >
                {t("signOut")}
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
                  {option === "login" ? t("signIn") : t("register")}
                </button>
              ))}
            </div>
            <form className="mt-5 space-y-4" onSubmit={submitCredentials}>
              {mode === "register" && (
                <>
                  <label className="block text-xs font-bold text-ink-soft">
                    {t("shopNameLabel")}
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
                    {t("ownerPhone")}
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
                {t("email")}
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
                {t("password")}
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
                  ? t("pleaseWait")
                  : mode === "register"
                    ? t("createAccount")
                    : t("signIn")}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
