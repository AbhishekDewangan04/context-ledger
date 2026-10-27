"use client";

import { useId, useMemo, useState } from "react";
import Reveal from "@/components/ui/Reveal";

interface GeoNode {
  id: string;
  name: string;
  region: string;
  x: number;
  y: number;
  tokensUsed: number;
  tokenLimit: number;
  status: "high_usage" | "active" | "queued" | "completed";
  action: "continue" | "warn" | "stop_and_summarize";
}

const NODES: GeoNode[] = [
  {
    id: "us-west",
    name: "auth-service-session",
    region: "us-west-1 · Silicon Valley",
    x: 185,
    y: 172,
    tokensUsed: 188400,
    tokenLimit: 200000,
    status: "high_usage",
    action: "stop_and_summarize",
  },
  {
    id: "us-east",
    name: "context-ledger-mcp",
    region: "us-east-1 · N. Virginia",
    x: 295,
    y: 184,
    tokensUsed: 172000,
    tokenLimit: 200000,
    status: "high_usage",
    action: "warn",
  },
  {
    id: "sa-east",
    name: "data-pipeline-sync",
    region: "sa-east-1 · São Paulo",
    x: 375,
    y: 342,
    tokensUsed: 64200,
    tokenLimit: 200000,
    status: "active",
    action: "continue",
  },
  {
    id: "eu-west",
    name: "vector-retrieval-core",
    region: "eu-west-2 · London",
    x: 485,
    y: 160,
    tokensUsed: 182500,
    tokenLimit: 200000,
    status: "high_usage",
    action: "stop_and_summarize",
  },
  {
    id: "eu-central",
    name: "telemetry-aggregator",
    region: "eu-central-1 · Frankfurt",
    x: 525,
    y: 168,
    tokensUsed: 92000,
    tokenLimit: 200000,
    status: "active",
    action: "continue",
  },
  {
    id: "ap-south",
    name: "handoff-orchestrator",
    region: "ap-south-1 · Bangalore",
    x: 675,
    y: 254,
    tokensUsed: 51800,
    tokenLimit: 200000,
    status: "active",
    action: "continue",
  },
  {
    id: "ap-northeast",
    name: "inference-router-v4",
    region: "ap-northeast-1 · Tokyo",
    x: 840,
    y: 194,
    tokensUsed: 191200,
    tokenLimit: 200000,
    status: "high_usage",
    action: "stop_and_summarize",
  },
];

const ARCS = [
  { id: "arc-usw-use", d: "M 185 172 Q 240 152 295 184" },
  { id: "arc-use-lon", d: "M 295 184 Q 390 105 485 160" },
  { id: "arc-use-sa", d: "M 295 184 Q 350 255 375 342" },
  { id: "arc-lon-fra", d: "M 485 160 Q 505 156 525 168" },
  { id: "arc-lon-blr", d: "M 485 160 Q 575 185 675 254" },
  { id: "arc-blr-tok", d: "M 675 254 Q 760 195 840 194" },
  { id: "arc-tok-east", d: "M 840 194 Q 900 170 955 180" },
  { id: "arc-west-usw", d: "M 5 180 Q 95 155 185 172" },
];

export default function GeoMap() {
  const [hoveredNode, setHoveredNode] = useState<GeoNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showHeatmap, setShowHeatmap] = useState(false);

  const filterId = useId();

  const filteredNodes = useMemo(() => {
    return NODES.filter((node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.region.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "all" || activeFilter === "active") {
        return true;
      }
      if (activeFilter === "high_usage") {
        return node.status === "high_usage";
      }
      if (activeFilter === "queued") {
        return node.status === "queued";
      }
      if (activeFilter === "completed") {
        return node.status === "completed";
      }
      return true;
    });
  }, [searchQuery, activeFilter]);

  const highUsageCount = NODES.filter((n) => n.status === "high_usage").length;
  const totalCount = NODES.length;

  return (
    <section
      aria-label="Interactive Project & Token Geo-Map"
      className="relative mx-auto max-w-6xl px-5 sm:px-8 py-4 sm:py-6"
    >
      {/* Ambient gradient glow to blend seamlessly with hero lighting without hard edges */}
      <div
        className="pointer-events-none absolute -inset-x-8 -top-16 -bottom-16 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 30%, rgba(217, 70, 239, 0.22), transparent 70%), radial-gradient(ellipse 45% 45% at 75% 65%, rgba(140, 104, 243, 0.16), transparent 72%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      <Reveal>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-pink-500/20 bg-gradient-to-b from-[#190a2a]/92 via-[#11061c]/94 to-[#0a0510]/98 p-5 sm:p-6 lg:p-7 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85),0_0_36px_-18px_rgba(217,70,239,0.25)] backdrop-blur-2xl">
          {/* Subtle top edge specular highlight */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/30 to-transparent"
            aria-hidden="true"
          />

          {/* Card Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {/* Badge + Category label */}
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-300/60">
                  VISUALIZATION TOOL
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="mt-2.5 font-display text-xl sm:text-2xl font-semibold tracking-tight text-white">
                Interactive Project & Token Geo-Map
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-white/60">
                Demo workspace · hover any node for its token ledger
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-64 lg:w-72 shrink-0">
              <label htmlFor={`search-${filterId}`} className="sr-only">
                Search projects or regions
              </label>
              <div className="relative flex items-center">
                <svg
                  className="pointer-events-none absolute left-3.5 h-3.5 w-3.5 text-pink-300/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <input
                  id={`search-${filterId}`}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects, regions..."
                  className="w-full rounded-full border border-pink-500/20 bg-white/[0.04] py-1.5 pl-9 pr-3.5 text-xs text-white placeholder-white/35 transition-colors focus:border-magenta/60 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-magenta/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-xs text-white/40 hover:text-white"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Map Canvas Area */}
          <div className="relative mt-4 sm:mt-5 overflow-hidden rounded-2xl border border-pink-500/15 bg-[#090412]/95 shadow-[inset_0_2px_14px_rgba(0,0,0,0.85)]">
            <svg
              viewBox="0 0 960 440"
              className="w-full h-auto block select-none"
              preserveAspectRatio="xMidYMid meet"
              aria-label="World map showing AI agent project nodes and token budgets"
            >
              <defs>
                {/* Continents gradient fill in deep plum/violet */}
                <linearGradient id="continentFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2c163d" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#12071a" stopOpacity="0.9" />
                </linearGradient>

                {/* Europe/Asia subtle facet highlight */}
                <linearGradient id="continentFacet" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#381b4e" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#150820" stopOpacity="0.92" />
                </linearGradient>

                {/* Glow filter for arcs */}
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Glow filter for pink nodes */}
                <filter id="pinkGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Glow filter for green nodes */}
                <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Tactical Geo Grid */}
              <g opacity="0.16">
                {[55, 110, 165, 220, 275, 330, 385].map((y) => (
                  <line
                    key={`gy-${y}`}
                    x1="0"
                    y1={y}
                    x2="960"
                    y2={y}
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="0.75"
                    strokeDasharray="2 6"
                  />
                ))}
                {[80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 880].map((x) => (
                  <line
                    key={`gx-${x}`}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2="440"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="0.75"
                    strokeDasharray="2 6"
                  />
                ))}
              </g>

              {/* Continents: Angular faceted low-poly vector cartography matching screenshot */}
              <g stroke="rgba(148, 163, 195, 0.28)" strokeWidth="1" strokeLinejoin="round">
                {/* North America */}
                {/* Alaska / NW */}
                <polygon
                  points="95,100 135,92 195,108 190,138 120,132"
                  fill="url(#continentFill)"
                />
                {/* Northern Canada */}
                <polygon
                  points="195,108 260,88 348,92 372,132 305,152 245,138 190,138"
                  fill="url(#continentFacet)"
                />
                {/* Greenland */}
                <polygon
                  points="350,56 405,48 412,88 368,104"
                  fill="url(#continentFill)"
                />
                {/* US West / Plains */}
                <polygon
                  points="120,132 190,138 245,138 238,205 168,202"
                  fill="url(#continentFill)"
                />
                {/* US East / Great Lakes / Coast */}
                <polygon
                  points="245,138 305,152 355,142 328,212 238,205"
                  fill="url(#continentFacet)"
                />
                {/* Mexico / Central America */}
                <polygon
                  points="168,202 238,205 282,238 274,258 240,240 215,220"
                  fill="url(#continentFill)"
                />
                <polygon
                  points="274,258 298,272 292,295 272,284"
                  fill="url(#continentFill)"
                />

                {/* South America */}
                {/* Northern Brazil / Amazon */}
                <polygon
                  points="306,294 365,280 412,312 396,370 338,362 306,318"
                  fill="url(#continentFacet)"
                />
                {/* Southern Cone / Chile / Argentina */}
                <polygon
                  points="338,362 396,370 354,432 334,424"
                  fill="url(#continentFill)"
                />

                {/* Europe */}
                {/* UK & Ireland */}
                <polygon
                  points="472,115 494,110 488,138 468,134"
                  fill="url(#continentFill)"
                />
                {/* Scandinavia */}
                <polygon
                  points="498,78 534,70 540,126 510,118"
                  fill="url(#continentFacet)"
                />
                {/* Western / Central Europe */}
                <polygon
                  points="488,142 562,132 574,178 514,188 478,178"
                  fill="url(#continentFill)"
                />
                {/* Iberia */}
                <polygon
                  points="468,178 498,178 488,208 462,202"
                  fill="url(#continentFacet)"
                />

                {/* Africa */}
                {/* North Africa / Sahara */}
                <polygon
                  points="472,212 596,206 620,242 570,284 492,260 456,224"
                  fill="url(#continentFacet)"
                />
                {/* Sub-Saharan / Central / South Africa */}
                <polygon
                  points="492,260 570,284 560,372 534,392 500,340 492,280"
                  fill="url(#continentFill)"
                />
                {/* Madagascar */}
                <polygon
                  points="584,338 598,334 590,370 578,362"
                  fill="url(#continentFill)"
                />

                {/* Asia */}
                {/* Russia / Siberia / Northern Asia */}
                <polygon
                  points="562,88 718,80 842,98 884,145 812,156 738,138 620,130"
                  fill="url(#continentFill)"
                />
                {/* Middle East */}
                <polygon
                  points="568,188 635,188 642,234 598,240"
                  fill="url(#continentFacet)"
                />
                {/* Central & East Asia (China) */}
                <polygon
                  points="632,142 758,146 828,170 816,238 748,238 678,202"
                  fill="url(#continentFacet)"
                />
                {/* South Asia (India) */}
                <polygon
                  points="658,222 712,222 702,278 672,258"
                  fill="url(#continentFill)"
                />
                {/* Southeast Asia */}
                <polygon
                  points="738,240 796,244 782,296 742,278"
                  fill="url(#continentFill)"
                />
                {/* Japan */}
                <polygon
                  points="848,158 872,172 864,208 844,185"
                  fill="url(#continentFacet)"
                />
                {/* Indonesia archipelago */}
                <polygon
                  points="764,306 824,310 804,328 756,320"
                  fill="url(#continentFill)"
                />

                {/* Australia */}
                <polygon
                  points="768,342 858,336 864,402 794,416 764,376"
                  fill="url(#continentFacet)"
                />
                {/* New Zealand */}
                <polygon
                  points="880,380 902,386 892,422 876,410"
                  fill="url(#continentFill)"
                />
              </g>

              {/* Heatmap overlay (optional layer toggled by legend chip) */}
              {showHeatmap && (
                <g opacity="0.45" style={{ mixBlendMode: "screen" }}>
                  {NODES.map((node) => (
                    <circle
                      key={`heat-${node.id}`}
                      cx={node.x}
                      cy={node.y}
                      r={node.status === "high_usage" ? 54 : 32}
                      fill={
                        node.status === "high_usage"
                          ? "radial-gradient(circle, #f43f5e 0%, transparent 70%)"
                          : "radial-gradient(circle, #10b981 0%, transparent 70%)"
                      }
                      style={{
                        fill:
                          node.status === "high_usage"
                            ? "rgba(244, 63, 94, 0.45)"
                            : "rgba(16, 185, 129, 0.35)",
                        filter: "blur(18px)",
                      }}
                    />
                  ))}
                </g>
              )}

              {/* Dashed Arc Connections */}
              <g
                stroke="#d946ef"
                strokeWidth="1.25"
                strokeDasharray="4 4"
                fill="none"
                opacity="0.65"
                filter="url(#pinkGlow)"
              >
                {ARCS.map((arc) => (
                  <path key={arc.id} d={arc.d} />
                ))}
              </g>

              {/* Nodes */}
              {NODES.map((node) => {
                const isFiltered = filteredNodes.some((fn) => fn.id === node.id);
                const isHigh = node.status === "high_usage";
                const isHovered = hoveredNode?.id === node.id;

                const primaryColor = isHigh ? "#fb527f" : "#10b981";
                const glowFilter = isHigh ? "url(#pinkGlow)" : "url(#greenGlow)";

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-opacity duration-200"
                    opacity={isFiltered ? 1 : 0.25}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => setHoveredNode(node)}
                  >
                    {/* Outer pulse wave */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="14"
                      fill={primaryColor}
                      opacity={isHovered ? 0.35 : 0.18}
                      className="animate-ping"
                      style={{ transformOrigin: `${node.x}px ${node.y}px`, animationDuration: "3s" }}
                    />

                    {/* Ambient glow halo */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isHovered ? 12 : 9}
                      fill={primaryColor}
                      opacity={isHovered ? 0.6 : 0.4}
                      filter={glowFilter}
                    />

                    {/* Solid core center */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isHovered ? 5.5 : 4.5}
                      fill={primaryColor}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2 : 1.25}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredNode && (
              <div
                className="pointer-events-none absolute z-20 w-64 -translate-x-1/2 -translate-y-full transform transition-all duration-150"
                style={{
                  left: `${(hoveredNode.x / 960) * 100}%`,
                  top: `${(hoveredNode.y / 440) * 100 - 4}%`,
                }}
              >
                <div className="mb-2 rounded-xl border border-white/16 bg-[#160f2a]/95 p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.9),0_0_24px_rgba(140,104,243,0.3)] backdrop-blur-xl">
                  {/* Tooltip Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-white truncate">
                      {hoveredNode.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                        hoveredNode.status === "high_usage"
                          ? "bg-rose/20 text-rose border border-rose/40"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      }`}
                    >
                      {Math.round((hoveredNode.tokensUsed / hoveredNode.tokenLimit) * 100)}%
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-white/50">{hoveredNode.region}</p>

                  {/* Token Bar */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] font-mono text-white/60 mb-1">
                      <span>Tokens</span>
                      <span>
                        {hoveredNode.tokensUsed.toLocaleString()} /{" "}
                        {hoveredNode.tokenLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${
                          hoveredNode.status === "high_usage"
                            ? "bg-gradient-to-r from-rose to-fuchsia"
                            : "bg-emerald-400"
                        }`}
                        style={{
                          width: `${(hoveredNode.tokensUsed / hoveredNode.tokenLimit) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recommendation action */}
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-white/40">Ledger action:</span>
                    <span
                      className={`font-mono font-medium ${
                        hoveredNode.action === "stop_and_summarize"
                          ? "text-rose"
                          : hoveredNode.action === "warn"
                          ? "text-amber"
                          : "text-emerald-400"
                      }`}
                    >
                      {hoveredNode.action}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Filter Legend Chips & Counter */}
          <div className="mt-3.5 sm:mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Legend Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Active Project */}
              <button
                type="button"
                onClick={() =>
                  setActiveFilter(activeFilter === "active" ? "all" : "active")
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeFilter === "active" || activeFilter === "all"
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "border border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Active Project</span>
                <span className="font-mono text-[11px] opacity-75">{totalCount}</span>
              </button>

              {/* High Token Usage */}
              <button
                type="button"
                onClick={() =>
                  setActiveFilter(
                    activeFilter === "high_usage" ? "all" : "high_usage"
                  )
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeFilter === "high_usage"
                    ? "border border-pink-500/50 bg-pink-500/15 text-pink-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                    : "border border-pink-500/30 bg-pink-500/8 text-pink-300/90 hover:border-pink-500/50"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                <span>High Token Usage</span>
                <span className="font-mono text-[11px] opacity-75">{highUsageCount}</span>
              </button>

              {/* Queued */}
              <button
                type="button"
                onClick={() =>
                  setActiveFilter(activeFilter === "queued" ? "all" : "queued")
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeFilter === "queued"
                    ? "border border-amber-500/50 bg-amber-500/15 text-amber-300"
                    : "border border-amber-500/25 bg-amber-500/5 text-amber-300/80 hover:border-amber-500/40"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>Queued</span>
                <span className="font-mono text-[11px] opacity-75">0</span>
              </button>

              {/* Completed */}
              <button
                type="button"
                onClick={() =>
                  setActiveFilter(
                    activeFilter === "completed" ? "all" : "completed"
                  )
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeFilter === "completed"
                    ? "border border-purple-500/50 bg-purple-500/15 text-purple-300"
                    : "border border-purple-500/25 bg-purple-500/5 text-purple-300/80 hover:border-purple-500/40"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                <span>Completed</span>
                <span className="font-mono text-[11px] opacity-75">0</span>
              </button>

              {/* Usage Heatmap */}
              <button
                type="button"
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  showHeatmap
                    ? "border border-cyan/40 bg-cyan/15 text-cyan shadow-[0_0_12px_rgba(98,215,244,0.25)]"
                    : "border border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    showHeatmap ? "bg-cyan" : "bg-white/40"
                  }`}
                />
                <span>Usage Heatmap</span>
              </button>
            </div>

            {/* Counter */}
            <div className="text-xs font-mono text-white/50 shrink-0 sm:text-right">
              <span className="text-white/70 font-semibold">{totalCount} nodes</span> ·{" "}
              <span className="text-rose/90 font-medium">{highUsageCount} over 80%</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
