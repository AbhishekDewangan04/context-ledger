"use client";

import Link from "next/link";
import { useState } from "react";
import { InvalidApiKeyError, fetchProjects } from "@/lib/api";
import { writeApiKey } from "@/lib/api-key";
import MagneticButton from "@/components/ui/MagneticButton";
import { LockIcon } from "@/components/ui/icons";

interface Props {
  onUnlock: (apiKey: string) => void;
}

export default function ApiKeyGate({ onUnlock }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const key = value.trim();

    if (!key) {
      setError("Paste the key you set as CONTEXT_LEDGER_API_KEY.");
      return;
    }

    setChecking(true);
    setError(null);

    try {
      await fetchProjects(key);
      writeApiKey(key);
      onUnlock(key);
    } catch (caught) {
      if (caught instanceof InvalidApiKeyError) {
        setError(
          "That key was rejected. Check CONTEXT_LEDGER_API_KEY in your environment — the value has to match exactly.",
        );
      } else if (caught instanceof Error) {
        setError(caught.message);
      } else {
        setError("Could not reach the ledger. Try again.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <main
      id="main"
      className="relative mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-5 py-16"
    >
      <div className="halo-liquid opacity-40" aria-hidden="true" />

      <div className="glass-card relative z-10 p-8 sm:p-9 rounded-[2rem] border-white/15">
        <div className="mb-5">
          <Link
            href="/"
            className="glass-pill px-3 py-1 text-xs text-white/70 transition-colors hover:text-cyan hover:border-cyan/40"
          >
            ← Back to site
          </Link>
        </div>

        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-rose via-magenta to-fuchsia text-white shadow-[0_0_20px_rgba(236,72,153,0.55)]">
          <LockIcon className="text-xl text-white" />
        </span>

        <h1 className="mt-5 font-display text-2xl sm:text-3xl font-medium tracking-tight text-white">
          Unlock the dashboard
        </h1>
        <p className="mt-2 text-sm text-white/70 leading-relaxed font-normal">
          The dashboard reads the same REST routes as the MCP server, with the same bearer key. It is
          kept in this tab&apos;s session storage and never sent anywhere else.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-xs font-semibold uppercase tracking-wider text-white/70">
              API key
            </label>
            <input
              id="api-key"
              name="api-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-describedby="api-key-hint"
              aria-invalid={Boolean(error)}
              className="w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 font-mono text-sm text-white placeholder:text-white/30 backdrop-blur-xl transition-all duration-200 focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/40"
              placeholder="Paste your API key"
            />
            <p id="api-key-hint" className="text-xs text-white/50">
              Find it in your environment variables, or run{" "}
              <span className="font-mono text-white/80">openssl rand -hex 32</span> to make one.
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-xs text-rose leading-relaxed shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              {error}
            </p>
          ) : null}

          <div className="pt-2">
            <MagneticButton type="submit" disabled={checking} magnetic={false} fullWidth variant="primary">
              {checking ? "Checking…" : "Unlock dashboard"}
            </MagneticButton>
          </div>
        </form>
      </div>
    </main>
  );
}