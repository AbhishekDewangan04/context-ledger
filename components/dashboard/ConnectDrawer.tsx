"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CopyButton from "@/components/ui/CopyButton";
import { CloseIcon, TerminalIcon } from "@/components/ui/icons";

interface Props {
  open: boolean;
  onClose: () => void;
  apiKey?: string | null;
}

export default function ConnectDrawer({ open, onClose, apiKey }: Props) {
  const [origin, setOrigin] = useState("");
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Save active element when opening to restore focus on close
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus the first focusable element inside drawer upon opening
  useEffect(() => {
    if (open && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [open]);

  const mcpUrl = useMemo(() => {
    return origin ? `${origin}/api/mcp` : "/api/mcp";
  }, [origin]);

  const maskedKey = apiKey
    ? "•".repeat(Math.min(apiKey.length, 12)) || "••••••••"
    : "••••••••";

  // Client config: visible display has masked key; copy has real key
  const clientConfigDisplay = useMemo(() => {
    return JSON.stringify(
      {
        mcpServers: {
          "context-ledger": {
            type: "http",
            url: mcpUrl,
            headers: {
              Authorization: `Bearer ${maskedKey}`,
            },
          },
        },
      },
      null,
      2,
    );
  }, [mcpUrl, maskedKey]);

  const clientConfigCopy = useMemo(() => {
    const key = apiKey || "<CONTEXT_LEDGER_API_KEY>";
    return JSON.stringify(
      {
        mcpServers: {
          "context-ledger": {
            type: "http",
            url: mcpUrl,
            headers: {
              Authorization: `Bearer ${key}`,
            },
          },
        },
      },
      null,
      2,
    );
  }, [mcpUrl, apiKey]);

  const claudeCodeCommandDisplay = `claude mcp add --transport http context-ledger ${mcpUrl} --header "Authorization: Bearer ${maskedKey}"`;
  const claudeCodeCommandCopy = `claude mcp add --transport http context-ledger ${mcpUrl} --header "Authorization: Bearer ${apiKey || "<CONTEXT_LEDGER_API_KEY>"}"`;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-drawer-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop (click outside to close) */}
      <div
        className="fixed inset-0 bg-base/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <aside
        ref={drawerRef}
        className="glass-card relative z-10 flex h-full w-full max-w-md flex-col border-l border-line bg-base-elevated/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 overflow-y-auto"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan/15 text-cyan">
              <TerminalIcon className="text-base" />
            </span>
            <h2 id="connect-drawer-title" className="font-display text-lg font-semibold text-ink">
              Connect MCP Client
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-glass text-faint transition-colors hover:border-cyan/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            aria-label="Close drawer"
          >
            <CloseIcon className="text-sm" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Live Endpoint */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-faint">
                Live MCP Endpoint URL
              </span>
              <CopyButton value={mcpUrl} label="Copy URL" />
            </div>
            <div className="rounded-xl border border-line bg-base/80 p-3 font-mono text-xs text-cyan break-all">
              {mcpUrl}
            </div>
          </div>

          {/* Client Config */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-faint">
                Client Config (mcpServers)
              </span>
              <CopyButton value={clientConfigCopy} label="Copy Config" />
            </div>
            <pre className="overflow-x-auto rounded-xl border border-line bg-base/80 p-4 font-mono text-[11px] leading-relaxed text-faint">
              <code>{clientConfigDisplay}</code>
            </pre>
          </div>

          {/* Claude Code CLI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-faint">
                Claude Code CLI Command
              </span>
              <CopyButton value={claudeCodeCommandCopy} label="Copy Command" />
            </div>
            <div className="rounded-xl border border-line bg-base/80 p-4 font-mono text-[11px] leading-relaxed text-faint break-all">
              <code>{claudeCodeCommandDisplay}</code>
            </div>
            <p className="text-[11px] text-faint">
              API key is masked visually. The copy button copies your active key ready to paste into your terminal.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
