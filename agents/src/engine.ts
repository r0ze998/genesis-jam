import { Hono } from "hono";
import { cors } from "hono/cors";
import { CivAgent } from "./agent.ts";
import { onchainSpawnWorld, onchainProposeTrade, onchainAcceptTrade, onchainRejectTrade, onchainTick } from "./dojo.ts";
import type { Civilization, TradeProposal, GameEvent, WorldState } from "./types.ts";

const app = new Hono();
app.use("/*", cors());

// --- World State ---
let worldState: WorldState = {
  tick: 0,
  civilizations: [
    { id: 1, name: "Iron Kingdom", iron: 100, food: 20, wood: 50, population: 100, isAlive: true },
    { id: 2, name: "Green Valley", iron: 20, food: 100, wood: 50, population: 100, isAlive: true },
  ],
  pendingTrades: [],
  events: [],
};

let tradeCounter = 0;
let running = false;
let tickInterval: ReturnType<typeof setInterval> | null = null;

// --- Agents ---
const agents = [
  new CivAgent(1, "Iron Kingdom", "leader", "Pragmatic and cautious. Values military strength but knows food is survival."),
  new CivAgent(1, "Iron Kingdom", "trader", "Shrewd negotiator. Drives hard bargains but keeps deals fair enough to maintain relationships."),
  new CivAgent(2, "Green Valley", "leader", "Peaceful and wise. Prefers trade over conflict. Knows iron is needed for tools."),
  new CivAgent(2, "Green Valley", "trader", "Friendly but not naive. Seeks mutual benefit and long-term partnerships."),
];

// --- Game Logic ---
function consumeFood() {
  for (const civ of worldState.civilizations) {
    if (!civ.isAlive) continue;
    const cost = Math.floor(civ.population / 10);
    if (civ.food >= cost) {
      civ.food -= cost;
    } else {
      const deficit = cost - civ.food;
      civ.food = 0;
      civ.population = Math.max(0, civ.population - deficit);
      if (civ.population === 0) civ.isAlive = false;
      
      worldState.events.push({
        tick: worldState.tick,
        timestamp: Date.now(),
        civId: civ.id,
        civName: civ.name,
        agentRole: "system",
        message: civ.isAlive 
          ? `⚠️ ${civ.name} is starving! Lost ${deficit} population.`
          : `💀 ${civ.name} has perished from famine.`,
      });
    }
  }
}

function executeTrade(trade: TradeProposal) {
  const from = worldState.civilizations.find(c => c.id === trade.fromCiv)!;
  const to = worldState.civilizations.find(c => c.id === trade.toCiv)!;

  // Deduct and add resources
  (from as any)[trade.offerResource] -= trade.offerAmount;
  (to as any)[trade.offerResource] += trade.offerAmount;
  (to as any)[trade.requestResource] -= trade.requestAmount;
  (from as any)[trade.requestResource] += trade.requestAmount;

  trade.status = "accepted";
  
  worldState.events.push({
    tick: worldState.tick,
    timestamp: Date.now(),
    civId: 0,
    civName: "World",
    agentRole: "system",
    message: `🤝 Trade completed: ${from.name} gave ${trade.offerAmount} ${trade.offerResource} → ${to.name} gave ${trade.requestAmount} ${trade.requestResource}`,
  });
}

function buildStructure(civId: number, structure: string, cost: Record<string, number>) {
  const civ = worldState.civilizations.find(c => c.id === civId)!;
  
  for (const [resource, amount] of Object.entries(cost)) {
    if ((civ as any)[resource] < amount) return false;
  }
  
  for (const [resource, amount] of Object.entries(cost)) {
    (civ as any)[resource] -= amount;
  }

  // Building effects
  if (structure === "farm") civ.food += 15;
  if (structure === "mine") civ.iron += 15;
  if (structure === "wall") civ.population += 5; // walls protect people
  
  worldState.events.push({
    tick: worldState.tick,
    timestamp: Date.now(),
    civId: civ.id,
    civName: civ.name,
    agentRole: "system",
    message: `🏗️ ${civ.name} built a ${structure}!`,
  });
  
  return true;
}

async function runAgentTick() {
  worldState.tick++;
  console.log(`\n=== Tick ${worldState.tick} ===`);

  // Record tick on-chain
  onchainTick().catch(e => console.error("onchain tick failed:", e));

  // Food consumption
  consumeFood();

  // Each agent thinks and acts (sequentially to avoid race conditions)
  for (const agent of agents) {
    const civ = worldState.civilizations.find(c => c.id === agent.civId)!;
    if (!civ.isAlive) continue;

    const civTrades = worldState.pendingTrades.filter(
      t => (t.toCiv === agent.civId || t.fromCiv === agent.civId) && t.status === "pending"
    );

    const context = worldState.events.slice(-5)
      .map(e => e.message)
      .join("\n");

    try {
      const result = await agent.think(civ, civTrades, context);
      
      // Log the speech
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

      // Execute action
      const action = result.action;
      if (action.type === "trade_propose" && agent.role === "trader") {
        tradeCounter++;
        const trade: TradeProposal = {
          id: tradeCounter,
          fromCiv: agent.civId,
          toCiv: agent.civId === 1 ? 2 : 1,
          offerResource: action.details.offerResource,
          offerAmount: action.details.offerAmount,
          requestResource: action.details.requestResource,
          requestAmount: action.details.requestAmount,
          status: "pending",
        };
        worldState.pendingTrades.push(trade);
        // Record on-chain
        onchainProposeTrade(trade.fromCiv, trade.toCiv, trade.offerResource, trade.offerAmount, trade.requestResource, trade.requestAmount)
          .catch(e => console.error("onchain propose failed:", e));
      } else if (action.type === "trade_accept" && agent.role === "leader") {
        const trade = worldState.pendingTrades.find(
          t => t.id === action.details.tradeId && t.status === "pending"
        );
        if (trade) {
          executeTrade(trade);
          onchainAcceptTrade(trade.id).catch(e => console.error("onchain accept failed:", e));
        }
      } else if (action.type === "trade_reject" && agent.role === "leader") {
        const trade = worldState.pendingTrades.find(
          t => t.id === action.details.tradeId && t.status === "pending"
        );
        if (trade) {
          trade.status = "rejected";
          onchainRejectTrade(trade.id).catch(e => console.error("onchain reject failed:", e));
        }
      } else if (action.type === "build") {
        buildStructure(agent.civId, action.details.structure, action.details.cost || { wood: 10 });
      }
    } catch (e) {
      console.error(`Agent error [${agent.civName} ${agent.role}]:`, e);
    }
  }

  // Clean old resolved trades
  worldState.pendingTrades = worldState.pendingTrades.filter(t => t.status === "pending");
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
  
  // Run tick every 20 seconds
  const tickMs = Number(process.env.TICK_MS || 20000);
  tickInterval = setInterval(async () => {
    if (running) await runAgentTick();
  }, tickMs);
  
  // Initialize on-chain world
  await onchainSpawnWorld().catch(e => console.error("onchain spawn failed:", e));
  
  // Run first tick immediately
  await runAgentTick();
  
  return c.json({ status: "started", tickMs });
});

app.post("/stop", (c) => {
  running = false;
  if (tickInterval) clearInterval(tickInterval);
  return c.json({ status: "stopped" });
});

app.post("/reset", (c) => {
  running = false;
  if (tickInterval) clearInterval(tickInterval);
  worldState = {
    tick: 0,
    civilizations: [
      { id: 1, name: "Iron Kingdom", iron: 100, food: 20, wood: 50, population: 100, isAlive: true },
      { id: 2, name: "Green Valley", iron: 20, food: 100, wood: 50, population: 100, isAlive: true },
    ],
    pendingTrades: [],
    events: [],
  };
  tradeCounter = 0;
  return c.json({ status: "reset" });
});

app.post("/tick", async (c) => {
  await runAgentTick();
  return c.json({ tick: worldState.tick });
});

const port = Number(process.env.PORT || 3002);
console.log(`🏛️ Genesis Jam Engine running on http://localhost:${port}`);
export default { port, hostname: "0.0.0.0", idleTimeout: 255, fetch: app.fetch };
