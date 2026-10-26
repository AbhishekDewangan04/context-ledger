"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "@/components/ui/CopyButton";
import Reveal from "@/components/ui/Reveal";
import { TerminalIcon } from "@/components/ui/icons";

const PLACEHOLDER = "https://your-app.vercel.app";

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
  const [origin, setOrigin] = useState(PLACEHOLDER);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  const clientConfig = useMemo(() => getClientConfig(origin), [origin]);
  const claudeCommand = useMemo(() => getClaudeCommand(origin), [origin]);
  const curlCommand = useMemo(() => getCurl(origin), [origin]);

  return (
    <section
      id="connect"
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24 scroll-mt-20 sm:scroll-mt-24"
      aria-labelledby="connect-heading"
    >
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan">Connect</p>
        <h2 id="connect-heading" className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">
          One endpoint, one bearer key
        </h2>
        <p className="mt-4 max-w-2xl text-faint">
          Streamable HTTP at <span className="font-mono text-ink">POST /api/mcp</span>. Point any MCP
          client at it, send the key you set as{" "}
          <span className="font-mono text-ink">CONTEXT_LEDGER_API_KEY</span>, and the seven tools plus
          the <span className="font-mono text-ink">resume_project</span> Resume prompt show up.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <Reveal className="h-full">
          <div className="glass-card flex h-full flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                <TerminalIcon className="text-cyan" />
                Client config
              </h3>
              <CopyButton value={clientConfig} label="Copy config" />
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-base/70 p-4 font-mono text-[11px] leading-relaxed text-faint">
              <code>{clientConfig}</code>
            </pre>
            <p className="mt-auto pt-3 text-xs text-faint">
              Project configuration in <span className="font-mono text-ink">.mcp.json</span>.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06} className="h-full">
          <div className="glass-card flex h-full flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                <TerminalIcon className="text-violet-soft" />
                Claude Code CLI
              </h3>
              <CopyButton value={claudeCommand} label="Copy command" />
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-base/70 p-4 font-mono text-[11px] leading-relaxed text-faint">
              <code>{claudeCommand}</code>
            </pre>
            <p className="mt-auto pt-3 text-xs text-faint">
              Direct connection via streamable HTTP transport.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="h-full">
          <div className="glass-card flex h-full flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                <TerminalIcon className="text-cyan" />
                tools/list
              </h3>
              <CopyButton value={curlCommand} label="Copy curl" />
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-base/70 p-4 font-mono text-[11px] leading-relaxed text-faint">
              <code>{curlCommand}</code>
            </pre>
            <p className="mt-auto pt-3 text-xs text-faint">
              Without the header the endpoint answers <span className="font-mono text-ink">401</span>.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}