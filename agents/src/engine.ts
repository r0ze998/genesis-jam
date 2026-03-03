import { Hono } from "hono";
import { cors } from "hono/cors";
import { CivAgent } from "./agent.ts";
import { onchainSpawnWorld, onchainProposeTrade, onchainAcceptTrade, onchainRejectTrade, onchainTick } from "./dojo.ts";
import { createInitialState, consumeFood, executeTrade, buildStructure, nextTradeId, cleanResolvedTrades } from "./world.ts";
import { TICK_MS, PORT, AGENT_PROFILES } from "./config.ts";
import type { TradeProposal, WorldState } from "./types.ts";

const app = new Hono();
app.use("/*", cors());

// --- State ---
let worldState: WorldState = createInitialState();
let running = false;
let tickInterval: ReturnType<typeof setInterval> | null = null;

// --- Agents ---
const agents = AGENT_PROFILES.map(p => new CivAgent(p.civId, p.civName, p.role, p.personality));

// --- Game Loop ---
async function processAgentAction(agent: CivAgent): Promise<void> {
  const civ = worldState.civilizations.find(c => c.id === agent.civId)!;
  if (!civ.isAlive) return;

  const civTrades = worldState.pendingTrades.filter(
    t => (t.toCiv === agent.civId || t.fromCiv === agent.civId) && t.status === "pending"
  );

  const context = worldState.events.slice(-5).map(e => e.message).join("\n");

  try {
    const result = await agent.think(civ, civTrades, context);

    worldState.events.push({
      tick: worldState.tick,
      timestamp: Date.now(),
      civId: agent.civId,
      civName: agent.civName,
      agentRole: agent.role,
      message: result.speech,
      action: result.action,
    });

    console.log(`[${agent.civName} ${agent.role}] ${result.speech}`);

    const { action } = result;

    switch (action.type) {
      case "trade_propose":
        if (agent.role !== "trader") break;
        const trade: TradeProposal = {
          id: nextTradeId(),
          fromCiv: agent.civId,
          toCiv: agent.civId === 1 ? 2 : 1,
          offerResource: action.details.offerResource,
          offerAmount: action.details.offerAmount,
          requestResource: action.details.requestResource,
          requestAmount: action.details.requestAmount,
          status: "pending",
        };
        worldState.pendingTrades.push(trade);
        onchainProposeTrade(trade.fromCiv, trade.toCiv, trade.offerResource, trade.offerAmount, trade.requestResource, trade.requestAmount)
          .catch(e => console.error("onchain propose failed:", e));
        break;

      case "trade_accept":
        if (agent.role !== "leader") break;
        const acceptTarget = worldState.pendingTrades.find(t => t.id === action.details.tradeId && t.status === "pending");
        if (acceptTarget) {
          executeTrade(worldState, acceptTarget);
          onchainAcceptTrade(acceptTarget.id).catch(e => console.error("onchain accept failed:", e));
        }
        break;

      case "trade_reject":
        if (agent.role !== "leader") break;
        const rejectTarget = worldState.pendingTrades.find(t => t.id === action.details.tradeId && t.status === "pending");
        if (rejectTarget) {
          rejectTarget.status = "rejected";
          onchainRejectTrade(rejectTarget.id).catch(e => console.error("onchain reject failed:", e));
        }
        break;

      case "build":
        buildStructure(worldState, agent.civId, action.details.structure, action.details.cost || { wood: 10 });
        break;
    }
  } catch (e) {
    console.error(`Agent error [${agent.civName} ${agent.role}]:`, e);
  }
}

async function runAgentTick(): Promise<void> {
  worldState.tick++;
  console.log(`\n=== Tick ${worldState.tick} ===`);

  onchainTick().catch(e => console.error("onchain tick failed:", e));
  consumeFood(worldState);

  for (const agent of agents) {
    await processAgentAction(agent);
  }

  cleanResolvedTrades(worldState);
}

// --- API Routes ---
app.get("/state", (c) => c.json(worldState));

app.get("/events", (c) => {
  const limit = Number(c.req.query("limit") || 50);
  return c.json(worldState.events.slice(-limit));
});

app.post("/start", async (c) => {
  if (running) return c.json({ status: "already running" });
  running = true;

  tickInterval = setInterval(async () => {
    if (running) await runAgentTick();
  }, TICK_MS);

  await onchainSpawnWorld().catch(e => console.error("onchain spawn failed:", e));
  await runAgentTick();

  return c.json({ status: "started", tickMs: TICK_MS });
});

app.post("/stop", (c) => {
  running = false;
  if (tickInterval) clearInterval(tickInterval);
  return c.json({ status: "stopped" });
});

app.post("/reset", (c) => {
  running = false;
  if (tickInterval) clearInterval(tickInterval);
  worldState = createInitialState();
  return c.json({ status: "reset" });
});

app.post("/tick", async (c) => {
  await runAgentTick();
  return c.json({ tick: worldState.tick });
});

console.log(`🏛️ Genesis Jam Engine running on http://localhost:${PORT}`);
export default { port: PORT, hostname: "0.0.0.0", idleTimeout: 255, fetch: app.fetch };
