"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "@/components/ui/CopyButton";
import Reveal from "@/components/ui/Reveal";
import { TerminalIcon } from "@/components/ui/icons";
import { getBackendUrl } from "@/lib/backend-url";

function getClientConfig(origin: string) {
  return `{
  "mcpServers": {
    "context-ledger": {
      "type": "http",
      "url": "${origin}/api/mcp",
      "headers": { "Authorization": "Bearer <CONTEXT_LEDGER_API_KEY>" }
    }
  }
}`;
}

function getClaudeCommand(origin: string) {
  return `claude mcp add --transport http context-ledger ${origin}/api/mcp --header "Authorization: Bearer <CONTEXT_LEDGER_API_KEY>"`;
}

function getCurl(origin: string) {
  return `curl -s ${origin}/api/mcp \\
  -H "Authorization: Bearer $CONTEXT_LEDGER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;
}

export default function Connect() {
  const [origin, setOrigin] = useState(getBackendUrl());

  useEffect(() => {
    setOrigin(getBackendUrl());
  }, []);

  const clientConfig = useMemo(() => getClientConfig(origin), [origin]);
  const claudeCommand = useMemo(() => getClaudeCommand(origin), [origin]);
  const curlCommand = useMemo(() => getCurl(origin), [origin]);

  return (
    <section
      id="connect"
      className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28 scroll-mt-20 sm:scroll-mt-24"
      aria-labelledby="connect-heading"
    >
      <div className="halo opacity-30" aria-hidden="true" />

      <Reveal>
        <div className="inline-flex">
          <span className="glass-pill px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-magenta border-magenta/30 bg-magenta/10 shadow-[0_0_14px_rgba(240,68,155,0.25)]">
            Connect
          </span>
        </div>
        <h2
          id="connect-heading"
          className="mt-4 max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl text-white"
        >
          One endpoint, one bearer key
        </h2>
        <p className="mt-4 max-w-2xl text-base text-white/70 leading-relaxed sm:text-lg">
          Streamable HTTP at <span className="font-mono text-fuchsia font-medium">POST /api/mcp</span>. Point any MCP
          client at it, send the key you set as{" "}
          <span className="font-mono text-white/90">CONTEXT_LEDGER_API_KEY</span>, and the seven tools plus
          the <span className="font-mono text-white/90">resume_project</span> prompt show up.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        <Reveal className="h-full">
          <div className="glass-card-interactive flex h-full flex-col p-6 sm:p-7 rounded-3xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2.5 text-sm font-semibold text-white">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-magenta/15 text-magenta">
                  <TerminalIcon className="text-base" />
                </span>
                <span>Client config</span>
              </h3>
              <CopyButton value={clientConfig} label="Copy config" />
            </div>

            <div className="glass-code mt-5 p-4 overflow-x-auto">
              <pre className="font-mono text-xs leading-relaxed text-white/80">
                <code>{clientConfig}</code>
              </pre>
            </div>

            <p className="mt-auto pt-4 text-xs text-white/60">
              Project configuration in <span className="font-mono text-white/90">.mcp.json</span>.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06} className="h-full">
          <div className="glass-card-interactive flex h-full flex-col p-6 sm:p-7 rounded-3xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2.5 text-sm font-semibold text-white">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-fuchsia/15 text-fuchsia">
                  <TerminalIcon className="text-base" />
                </span>
                <span>Claude Code CLI</span>
              </h3>
              <CopyButton value={claudeCommand} label="Copy command" />
            </div>

            <div className="glass-code mt-5 p-4 overflow-x-auto">
              <pre className="font-mono text-xs leading-relaxed text-white/80 break-all whitespace-pre-wrap">
                <code>{claudeCommand}</code>
              </pre>
            </div>

            <p className="mt-auto pt-4 text-xs text-white/60">
              Direct connection via streamable HTTP transport.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="h-full">
          <div className="glass-card-interactive flex h-full flex-col p-6 sm:p-7 rounded-3xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2.5 text-sm font-semibold text-white">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan/15 text-cyan">
                  <TerminalIcon className="text-base" />
                </span>
                <span>tools/list</span>
              </h3>
              <CopyButton value={curlCommand} label="Copy curl" />
            </div>

            <div className="glass-code mt-5 p-4 overflow-x-auto">
              <pre className="font-mono text-xs leading-relaxed text-white/80 whitespace-pre-wrap">
                <code>{curlCommand}</code>
              </pre>
            </div>

            <p className="mt-auto pt-4 text-xs text-white/60">
              Without the header the endpoint answers <span className="font-mono text-rose font-medium">401</span>.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
