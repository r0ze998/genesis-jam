import React, { useEffect, useState, useRef } from "react";

const API = "http://localhost:3002";

interface Civilization {
  id: number;
  name: string;
  iron: number;
  food: number;
  wood: number;
  population: number;
  isAlive: boolean;
}

interface GameEvent {
  tick: number;
  timestamp: number;
  civId: number;
  civName: string;
  agentRole: string;
  message: string;
}

interface WorldState {
  tick: number;
  civilizations: Civilization[];
  events: GameEvent[];
}

const ResourceBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div style={{ marginBottom: 4 }}>
    <div style={{ fontSize: 8, marginBottom: 2, display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div style={{ width: "100%", height: 8, background: "#1a1a2e", border: "1px solid #333", imageRendering: "pixelated" }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", background: color, transition: "width 0.5s" }} />
    </div>
  </div>
);

const CivCard = ({ civ }: { civ: Civilization }) => {
  const borderColor = civ.id === 1 ? "#ff6b35" : "#35ff6b";
  return (
    <div style={{
      border: `2px solid ${borderColor}`,
      padding: 12,
      width: 260,
      background: "#111122",
      opacity: civ.isAlive ? 1 : 0.4,
    }}>
      <div style={{ fontSize: 10, color: borderColor, marginBottom: 8, textAlign: "center" }}>
        {civ.id === 1 ? "⚔️" : "🌿"} {civ.name} {!civ.isAlive && "💀"}
      </div>
      <div style={{ fontSize: 8, marginBottom: 8, textAlign: "center", color: "#aaa" }}>
        👥 Population: {civ.population}
      </div>
      <ResourceBar label="🪨 Iron" value={civ.iron} max={150} color="#ff6b35" />
      <ResourceBar label="🌾 Food" value={civ.food} max={150} color="#35ff6b" />
      <ResourceBar label="🪵 Wood" value={civ.wood} max={150} color="#d4a574" />
    </div>
  );
};

const EventLog = ({ events }: { events: GameEvent[] }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const roleColor = (role: string, civId: number) => {
    if (role === "system") return "#888";
    return civId === 1 ? "#ff6b35" : "#35ff6b";
  };

  const roleIcon = (role: string) => {
    if (role === "system") return "⚡";
    if (role === "leader") return "👑";
    return "💰";
  };

  return (
    <div style={{
      flex: 1,
      border: "2px solid #333",
      background: "#0a0a1a",
      padding: 8,
      overflowY: "auto",
      maxHeight: "60vh",
    }}>
      <div style={{ fontSize: 10, color: "#666", marginBottom: 8, textAlign: "center" }}>
        📜 Chronicle
      </div>
      {events.map((e, i) => (
        <div key={i} style={{ fontSize: 7, marginBottom: 6, lineHeight: 1.6, borderBottom: "1px solid #1a1a2e", paddingBottom: 4 }}>
          <span style={{ color: "#444" }}>[{e.tick}] </span>
          <span style={{ color: roleColor(e.agentRole, e.civId) }}>
            {roleIcon(e.agentRole)} {e.civName} {e.agentRole !== "system" ? `(${e.agentRole})` : ""}
          </span>
          <div style={{ color: "#ccc", marginTop: 2, paddingLeft: 8 }}>{e.message}</div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<WorldState | null>(null);
  const [running, setRunning] = useState(false);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API}/state`);
      const data = await res.json();
      setState(data);
    } catch {}
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, []);

  const start = async () => {
    await fetch(`${API}/start`, { method: "POST" });
    setRunning(true);
  };

  const stop = async () => {
    await fetch(`${API}/stop`, { method: "POST" });
    setRunning(false);
  };

  const reset = async () => {
    await fetch(`${API}/reset`, { method: "POST" });
    setRunning(false);
    fetchState();
  };

  if (!state) return <div style={{ padding: 40, fontSize: 10, textAlign: "center" }}>Connecting to Genesis Engine...</div>;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 16, color: "#ffd700", marginBottom: 4 }}>⛩️ GENESIS JAM</h1>
        <div style={{ fontSize: 8, color: "#666" }}>AI Civilization Simulator — Autonomous Worlds</div>
        <div style={{ fontSize: 8, color: "#444", marginTop: 4 }}>Tick: {state.tick}</div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
        {[
          { label: running ? "⏸ Stop" : "▶ Start", onClick: running ? stop : start, color: running ? "#ff4444" : "#44ff44" },
          { label: "🔄 Reset", onClick: reset, color: "#ffaa00" },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            padding: "8px 16px",
            background: "transparent",
            color: btn.color,
            border: `1px solid ${btn.color}`,
            cursor: "pointer",
          }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Left Civ */}
        <CivCard civ={state.civilizations[0]} />

        {/* Center: Event Log */}
        <EventLog events={state.events} />

        {/* Right Civ */}
        <CivCard civ={state.civilizations[1]} />
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 7, color: "#333" }}>
        by r0ze × neo — Dojo Game Jam VIII
      </div>
    </div>
  );
}
