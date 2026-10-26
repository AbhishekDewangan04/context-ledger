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
      className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-16"
    >
      <div className="glass-card p-7">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-faint transition-colors hover:text-cyan"
          >
            ← Back to site
          </Link>
        </div>

        <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet/15 text-violet-soft">
          <LockIcon className="text-xl" />
        </span>

        <h1 className="mt-5 font-display text-2xl tracking-tight">Unlock the dashboard</h1>
        <p className="mt-2 text-sm text-faint">
          The dashboard reads the same REST routes as the MCP server, with the same bearer key. It is
          kept in this tab&apos;s session storage and never sent anywhere else.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium text-ink">
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
              className="w-full rounded-xl border border-line bg-base/70 px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-faint/70 focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/40"
              placeholder="Paste your API key"
            />
            <p id="api-key-hint" className="text-xs text-faint">
              Find it in your environment variables, or run{" "}
              <span className="font-mono">openssl rand -hex 32</span> to make one.
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl border border-rose/40 bg-rose/10 px-3.5 py-2.5 text-sm text-rose">
              {error}
            </p>
          ) : null}

          <MagneticButton type="submit" disabled={checking} magnetic={false} fullWidth>
            {checking ? "Checking…" : "Unlock dashboard"}
          </MagneticButton>
        </form>
      </div>
    </main>
  );
}