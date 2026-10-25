import CopyButton from "@/components/ui/CopyButton";
import Reveal from "@/components/ui/Reveal";
import { TerminalIcon } from "@/components/ui/icons";

const CLIENT_CONFIG = `{
  "mcpServers": {
    "context-ledger": {
      "url": "https://your-app.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer <CONTEXT_LEDGER_API_KEY>"
      }
    }
  }
}`;

const CURL = `curl -s https://your-app.vercel.app/api/mcp \\
  -H "Authorization: Bearer $CONTEXT_LEDGER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

export default function Connect() {
  return (
    <section id="connect" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="connect-heading">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan">Connect</p>
        <h2 id="connect-heading" className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">
          One endpoint, one bearer key
        </h2>
        <p className="mt-4 max-w-2xl text-faint">
          Streamable HTTP at <span className="font-mono text-ink">POST /api/mcp</span>. Point any MCP
          client at it, send the key you set as{" "}
          <span className="font-mono text-ink">CONTEXT_LEDGER_API_KEY</span>, and the seven tools show
          up.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <div className="glass-card h-full p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                <TerminalIcon className="text-cyan" />
                Client config
              </h3>
              <CopyButton value={CLIENT_CONFIG} label="Copy config" />
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-base/70 p-4 font-mono text-[11px] leading-relaxed text-faint">
              <code>{CLIENT_CONFIG}</code>
            </pre>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="glass-card h-full p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                <TerminalIcon className="text-violet-soft" />
                tools/list
              </h3>
              <CopyButton value={CURL} label="Copy curl" />
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-base/70 p-4 font-mono text-[11px] leading-relaxed text-faint">
              <code>{CURL}</code>
            </pre>
            <p className="mt-3 text-xs text-faint">
              Without the header the endpoint answers <span className="font-mono text-ink">401</span>.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}