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
          background: "linear-gradient(135deg, #06050e 0%, #150a24 50%, #200826 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "28px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f43f5e, #ec4899, #d946ef)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "22px",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="6" cy="6" r="2.5" fill="#ffffff" />
              <circle cx="18" cy="6" r="2.5" fill="#ffffff" />
              <circle cx="12" cy="18" r="2.5" fill="#ffffff" />
              <path d="M8 6h8M7 8l4 8M17 8l-4 8" stroke="#ffffff" strokeWidth="1.8" />
            </svg>
          </div>
          <span style={{ color: "#ffffff", fontWeight: 600 }}>Context Ledger</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "70px",
              fontWeight: 700,
              lineHeight: 1.05,
              background: "linear-gradient(115deg, #ff72a1 0%, #f43f5e 30%, #e879f9 70%, #ffffff 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Persistent memory for AI coding agents
          </div>
          <div style={{ display: "flex", fontSize: "28px", color: "#cbd5e1" }}>
            7 MCP tools · stop at 90% budget · one-call handoff summary
          </div>
        </div>
        <div style={{ display: "flex", fontSize: "22px", color: "#22d3ee" }}>
          Remote MCP server · Streamable HTTP · POST /api/mcp
        </div>
      </div>
    ),
    size,
  );
}