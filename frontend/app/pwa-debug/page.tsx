"use client";

import React, { useEffect, useState } from "react";

export default function PwaDebugPage() {
  const [swRegistration, setSwRegistration] = useState<any>(null);
  const [manifest, setManifest] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [iconChecks, setIconChecks] = useState<any[]>([]);
  const [secureContext, setSecureContext] = useState<boolean | null>(null);
  const [controller, setController] = useState<any>(null);
  const [promptInfo, setPromptInfo] = useState<any>(null);
  const [promptResult, setPromptResult] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // SW registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        setSwRegistration(reg || null);
      });
    }

    // Manifest
    fetch("/manifest.json", { credentials: 'same-origin' })
      .then((r) => r.json())
      .then(async (m) => {
        setManifest(m);

        // Validate manifest icons (if any)
        if (m && Array.isArray(m.icons)) {
          const checks: any[] = [];
          for (const icon of m.icons) {
            try {
              const url = icon.src.startsWith("/") ? icon.src : `/${icon.src}`;
              const res = await fetch(url, { method: "GET", credentials: 'same-origin' });
              checks.push({ src: url, ok: res.ok, status: res.status, contentType: res.headers.get("content-type"), size: res.headers.get("content-length") });
            } catch (err) {
              checks.push({ src: icon.src, ok: false, error: String(err) });
            }
          }
          setIconChecks(checks);
        }
      })
      .catch(() => setManifest(null));

    // Deferred prompt
    const winDp = (window as any).deferredInstallPrompt || null;
    setDeferredPrompt(winDp);
    setPromptInfo(winDp ? { exists: true } : { exists: false });

    // Secure context
    setSecureContext(!!window.isSecureContext);

    // Controller (active SW controller)
    setController((navigator as any).serviceWorker?.controller || null);

    // Installed check
    const isPWAMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setInstalled(isPWAMode);
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "Inter, Arial, sans-serif" }}>
      <h1>PWA Debug Status</h1>
      <section style={{ marginTop: 12 }}>
        <h2>Service Worker</h2>
        <pre>{JSON.stringify({ registered: !!swRegistration, scope: swRegistration?.scope, controller: !!controller }, null, 2)}</pre>
        <p>Secure Context: {secureContext ? "yes" : "no"}</p>
      </section>

      <section style={{ marginTop: 12 }}>
        <h2>Manifest</h2>
        <pre>{manifest ? JSON.stringify(manifest, null, 2) : "manifest.json not found or failed to parse"}</pre>
        {iconChecks.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <h3>Icon checks</h3>
            <ul>
              {iconChecks.map((c, i) => (
                <li key={i}>
                  {c.src} — {c.ok ? `OK (status ${c.status})` : `FAIL`} {c.contentType ? `(${c.contentType})` : ""} {c.size ? `size:${c.size}` : ""} {c.error ? `error:${c.error}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section style={{ marginTop: 12 }}>
        <h2>Install Prompt</h2>
        <pre>{JSON.stringify({ deferredPrompt: !!deferredPrompt, installed, windowDeferred: !!(window as any).deferredInstallPrompt }, null, 2)}</pre>
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={async () => {
                const dp = (window as any).deferredInstallPrompt || null;
                setDeferredPrompt(dp);
                setPromptInfo(dp ? { exists: true } : { exists: false });
                console.log('Refreshed deferred prompt state ->', dp);
              }}
              style={{ padding: '8px 12px', borderRadius: 8, background: '#e0e0e0', border: 'none', cursor: 'pointer' }}
            >
              Refresh prompt state
            </button>

            <button
              onClick={async () => {
                setPromptResult(null);
                try {
                  const dp = (window as any).deferredInstallPrompt || deferredPrompt;
                  console.log('Attempting to prompt with:', dp);
                  if (!dp) {
                    setPromptResult({ ok: false, reason: 'no-prompt' });
                    return;
                  }
                  await dp.prompt();
                  const choice = await dp.userChoice;
                  console.log('Prompt result:', choice);
                  setPromptResult({ ok: true, choice });
                  try { (window as any).deferredInstallPrompt = null; } catch {}
                } catch (err) {
                  console.error('Prompt failed:', err);
                  setPromptResult({ ok: false, error: String(err) });
                }
              }}
              style={{ padding: '8px 12px', borderRadius: 8, background: '#ffd54f', border: 'none', cursor: 'pointer' }}
            >
              Try native prompt
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Prompt state:</strong>
            <pre>{JSON.stringify(promptInfo || { exists: !!deferredPrompt }, null, 2)}</pre>
            <strong>Last prompt result:</strong>
            <pre>{promptResult ? JSON.stringify(promptResult, null, 2) : 'none'}</pre>
          </div>
        </div>
        <p style={{ marginTop: 8, color: "#777" }}>
          Open DevTools &gt; Console to see runtime logs from the PWA code (beforeinstallprompt capture logs, SW registration logs).
        </p>
      </section>
    </div>
  );
}
