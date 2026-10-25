import { ImageResponse } from "next/og";

export const alt = "Context Ledger — persistent memory for AI coding agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(140deg, #07070D 38%, #170B31 100%)",
          color: "#ECECF5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "28px", color: "#A78BFA" }}>
          Context Ledger
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", fontSize: "72px", fontWeight: 700, lineHeight: 1.05 }}>
            Persistent memory for AI coding agents
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#9A9DB4" }}>
            7 MCP tools · budget guardrails · one-call handoff
          </div>
        </div>
        <div style={{ display: "flex", fontSize: "24px", color: "#22D3EE" }}>POST /api/mcp</div>
      </div>
    ),
    size,
  );
}