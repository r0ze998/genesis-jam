import React, { useEffect, useState, useRef } from "react";
import WorldMap from "./WorldMap";

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

const ResourceBar = ({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon: string }) => {
  const pct = Math.min(100, (value / max) * 100);
  const isLow = pct < 20;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 8, marginBottom: 2, display: "flex", justifyContent: "space-between", color: isLow ? "#ff4444" : "#aaa" }}>
        <span>{icon} {label}</span>
        <span style={{ color: isLow ? "#ff4444" : color, fontWeight: isLow ? "bold" : "normal" }}>
          {value} {isLow && "⚠️"}
        </span>
      </div>
      <div style={{ width: "100%", height: 10, background: "#0a0a1a", border: `1px solid ${isLow ? "#ff4444" : "#222"}`, borderRadius: 2 }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: isLow ? `repeating-linear-gradient(90deg, #ff4444, #ff4444 4px, #aa0000 4px, #aa0000 8px)` : `linear-gradient(90deg, ${color}88, ${color})`,
          transition: "width 0.8s ease",
          borderRadius: 1,
        }} />
      </div>
    </div>
  );
};

const CivCard = ({ civ, side }: { civ: Civilization; side: "left" | "right" }) => {
  const theme = civ.id === 1
    ? { color: "#ff6b35", icon: "⚔️", bgGrad: "linear-gradient(135deg, #1a1008, #111122)" }
    : { color: "#35ff6b", icon: "🌿", bgGrad: "linear-gradient(135deg, #081a08, #111122)" };

  return (
    <div style={{
      border: `2px solid ${civ.isAlive ? theme.color : "#333"}`,
      padding: 14,
      width: 270,
      background: civ.isAlive ? theme.bgGrad : "#0a0a0a",
      opacity: civ.isAlive ? 1 : 0.4,
      borderRadius: 4,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative corner */}
      <div style={{
        position: "absolute",
        top: 0,
        [side]: 0,
        width: 30,
        height: 30,
        background: `${theme.color}11`,
        clipPath: side === "left" ? "polygon(0 0, 100% 0, 0 100%)" : "polygon(100% 0, 0 0, 100% 100%)",
      }} />

      <div style={{ fontSize: 11, color: theme.color, marginBottom: 4, textAlign: "center", letterSpacing: 1 }}>
        {theme.icon} {civ.name} {!civ.isAlive && "💀"}
      </div>

      <div style={{
        fontSize: 9,
        marginBottom: 10,
        textAlign: "center",
        color: civ.population < 50 ? "#ff4444" : "#888",
        borderBottom: `1px solid ${theme.color}22`,
        paddingBottom: 8,
      }}>
        👥 {civ.population} citizens
      </div>

      <ResourceBar label="Iron" value={civ.iron} max={150} color="#ff6b35" icon="🪨" />
      <ResourceBar label="Food" value={civ.food} max={150} color="#35ff6b" icon="🌾" />
      <ResourceBar label="Wood" value={civ.wood} max={150} color="#d4a574" icon="🪵" />
    </div>
  );
};

const EventLog = ({ events }: { events: GameEvent[] }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const roleStyle = (role: string, civId: number) => {
    if (role === "system") return { color: "#ffd700", icon: "⚡", bg: "#ffd70008" };
    const isA = civId === 1;
    if (role === "leader") return { color: isA ? "#ff6b35" : "#35ff6b", icon: "👑", bg: isA ? "#ff6b3508" : "#35ff6b08" };
    return { color: isA ? "#ff9b65" : "#65ffab", icon: "💰", bg: isA ? "#ff6b3505" : "#35ff6b05" };
  };

  return (
    <div style={{
      flex: 1,
      border: "1px solid #1a1a2e",
      background: "#060610",
      padding: 10,
      overflowY: "auto",
      maxHeight: "55vh",
      borderRadius: 4,
    }}>
      <div style={{ fontSize: 10, color: "#444", marginBottom: 10, textAlign: "center", letterSpacing: 2 }}>
        📜 CHRONICLE
      </div>
      {events.length === 0 && (
        <div style={{ fontSize: 8, color: "#333", textAlign: "center", padding: 20 }}>
          Awaiting the dawn of civilization...
        </div>
      )}
      {events.map((e, i) => {
        const style = roleStyle(e.agentRole, e.civId);
        return (
          <div key={i} style={{
            fontSize: 7,
            marginBottom: 4,
            lineHeight: 1.7,
            padding: "4px 6px",
            background: style.bg,
            borderLeft: `2px solid ${style.color}33`,
            borderRadius: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#333", fontSize: 6 }}>T{e.tick}</span>
              <span style={{ color: style.color, fontSize: 7 }}>
                {style.icon} {e.civName}
              </span>
              {e.agentRole !== "system" && (
                <span style={{ color: "#333", fontSize: 6 }}>({e.agentRole})</span>
              )}
            </div>
            <div style={{ color: "#bbb", marginTop: 1, paddingLeft: 12, fontSize: 7 }}>{e.message}</div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

const StatusBadge = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    border: `1px solid ${color}33`,
    borderRadius: 3,
    fontSize: 7,
  }}>
    <span style={{ color: "#666" }}>{label}</span>
    <span style={{ color }}>{value}</span>
  </div>
);

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

  if (!state) return (
    <div style={{ padding: 40, fontSize: 10, textAlign: "center", color: "#444" }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>⛩️</div>
      Connecting to Genesis Engine...
    </div>
  );

  const totalPop = state.civilizations.reduce((s, c) => s + c.population, 0);
  const aliveCivs = state.civilizations.filter(c => c.isAlive).length;
  const tradeCount = state.events.filter(e => e.message.includes("Trade completed")).length;

  return (
    <div style={{ padding: 16, maxWidth: 920, margin: "0 auto", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 8, color: "#333", letterSpacing: 4, marginBottom: 4 }}>DOJO GAME JAM VIII</div>
        <h1 style={{ fontSize: 18, color: "#ffd700", marginBottom: 6, letterSpacing: 2 }}>⛩️ GENESIS JAM</h1>
        <div style={{ fontSize: 8, color: "#555", marginBottom: 10 }}>AI Civilization Simulator — Autonomous Worlds</div>

        {/* Status badges */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <StatusBadge label="TICK" value={String(state.tick)} color="#ffd700" />
          <StatusBadge label="POP" value={String(totalPop)} color="#35ff6b" />
          <StatusBadge label="CIVS" value={`${aliveCivs}/2`} color="#ff6b35" />
          <StatusBadge label="TRADES" value={String(tradeCount)} color="#6b9fff" />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[
            { label: running ? "⏸ PAUSE" : "▶ START", onClick: running ? stop : start, color: running ? "#ff4444" : "#44ff44" },
            { label: "↻ RESET", onClick: reset, color: "#666" },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick} style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7,
              padding: "6px 14px",
              background: "transparent",
              color: btn.color,
              border: `1px solid ${btn.color}44`,
              cursor: "pointer",
              borderRadius: 3,
              transition: "all 0.2s",
              letterSpacing: 1,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = btn.color; e.currentTarget.style.background = `${btn.color}11`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${btn.color}44`; e.currentTarget.style.background = "transparent"; }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* World Map */}
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <WorldMap civs={state.civilizations} tick={state.tick} />
      </div>

      {/* Main Layout: Civ Cards + Event Log */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <CivCard civ={state.civilizations[0]} side="left" />
        <EventLog events={state.events} />
        <CivCard civ={state.civilizations[1]} side="right" />
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 7, color: "#222", letterSpacing: 1 }}>
        BUILT BY R0ZE × NEO — STARKNET / DOJO / OLLAMA
      </div>
    </div>
  );
}
