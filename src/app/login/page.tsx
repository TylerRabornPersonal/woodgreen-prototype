"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { ACCOUNTS, findAccount, passwordChecks, passwordValid, type Account } from "@/lib/auth";
import { setActiveTenant } from "@/lib/portal/accounts";
import { otpauthUri, formatSecret, verifyTotp, totpNow } from "@/lib/totp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"creds" | "2fa">("creds");
  const [sel, setSel] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [acct, setAcct] = useState<Account | null>(null);

  // 2FA
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const pick = (id: string) => {
    setSel(id);
    const a = ACCOUNTS.find((x) => x.id === id);
    if (a) {
      setEmail(a.email);
      setPw(a.password);
      setErr("");
    }
  };

  const checks = passwordChecks(pw);

  const continueCreds = () => {
    const a = findAccount(email);
    if (!a || a.password !== pw) {
      setErr("Email or password is incorrect.");
      return;
    }
    if (!passwordValid(pw)) {
      setErr("Password does not meet the requirements.");
      return;
    }
    setAcct(a);
    setErr("");
    setStep("2fa");
  };

  useEffect(() => {
    if (step === "2fa" && acct) {
      QRCode.toDataURL(otpauthUri(acct.totpSecret, acct.email), { margin: 1, width: 168 }).then(setQr).catch(() => setQr(""));
    }
  }, [step, acct]);

  const verify = async () => {
    if (!acct) return;
    setVerifying(true);
    const ok = await verifyTotp(acct.totpSecret, code);
    setVerifying(false);
    if (!ok) {
      setErr("That code is incorrect or expired. Try the current one.");
      return;
    }
    if (acct.role === "tenant" && acct.tenantId) setActiveTenant(acct.tenantId);
    router.push(acct.role === "operator" ? "/admin" : "/portal");
  };

  const fillDemoCode = async () => {
    if (acct) setCode(await totpNow(acct.totpSecret));
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <Link href="/" className="login-brand"><span className="wm"><span className="n">25</span><span className="t">WOODGREEN</span></span></Link>

        {step === "creds" ? (
          <>
            <h1 className="login-h">Sign in</h1>
            <p className="login-sub">Operator console &amp; tenant portal</p>

            <label className="ctl-label">Demo account</label>
            <select className="login-select" value={sel} onChange={(e) => pick(e.target.value)}>
              <option value="">Choose an account to prefill…</option>
              {ACCOUNTS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>

            <label className="ctl-label">Email (username)</label>
            <input className="login-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="username" />

            <label className="ctl-label">Password</label>
            <input className="login-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            <ul className="pw-reqs">
              <li className={checks.length ? "ok" : ""}>At least 8 characters</li>
              <li className={checks.letter ? "ok" : ""}>One letter</li>
              <li className={checks.number ? "ok" : ""}>One number</li>
              <li className={checks.special ? "ok" : ""}>One special character</li>
            </ul>

            {err && <div className="login-err">{err}</div>}
            <button className="btn btn-pop login-btn" onClick={continueCreds} disabled={!email || !pw}>Continue →</button>
          </>
        ) : (
          <>
            <h1 className="login-h">Two-factor</h1>
            <p className="login-sub">Enter the 6-digit code from Google Authenticator</p>

            <div className="totp-enroll">
              {qr && <img className="totp-qr" src={qr} alt="Scan with Google Authenticator" width={168} height={168} />}
              <div className="totp-enroll-text">
                <div className="totp-step">First time? Scan this in Google Authenticator, or enter the key manually:</div>
                <code className="totp-key">{formatSecret(acct?.totpSecret ?? "")}</code>
                <div className="totp-acct">Account: 25 Woodgreen ({acct?.email})</div>
              </div>
            </div>

            <label className="ctl-label">Authentication code</label>
            <input className="login-input totp-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setErr(""); }} placeholder="000000" />
            <button className="linklike totp-demo" onClick={fillDemoCode}>Demo: fill the current code</button>

            {err && <div className="login-err">{err}</div>}
            <button className="btn btn-pop login-btn" onClick={verify} disabled={code.length !== 6 || verifying}>{verifying ? "Verifying…" : "Verify & sign in"}</button>
            <button className="linklike login-back" onClick={() => { setStep("creds"); setCode(""); setErr(""); }}>← Back</button>
          </>
        )}
      </div>
      <p className="login-foot">Prototype · simulated authentication. Production uses Supabase Auth with hashed passwords and enrolled TOTP.</p>
    </div>
  );
}
