// World state management — separated from engine for clarity

import type { Civilization, TradeProposal, GameEvent, WorldState } from "./types.ts";
import { INITIAL_CIVS, BUILDING_EFFECTS, FOOD_CONSUMPTION_DIVISOR } from "./config.ts";

let tradeCounter = 0;

export function createInitialState(): WorldState {
  tradeCounter = 0;
  return {
    tick: 0,
    civilizations: INITIAL_CIVS.map(c => ({ ...c })),
    pendingTrades: [],
    events: [],
  };
}

export function consumeFood(state: WorldState): void {
  for (const civ of state.civilizations) {
    if (!civ.isAlive) continue;

    const cost = Math.floor(civ.population / FOOD_CONSUMPTION_DIVISOR);
    if (civ.food >= cost) {
      civ.food -= cost;
      return;
    }

    // Starvation
    const deficit = cost - civ.food;
    civ.food = 0;
    civ.population = Math.max(0, civ.population - deficit);
    if (civ.population === 0) civ.isAlive = false;

    state.events.push({
      tick: state.tick,
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

export function executeTrade(state: WorldState, trade: TradeProposal): void {
  const from = state.civilizations.find(c => c.id === trade.fromCiv)!;
  const to = state.civilizations.find(c => c.id === trade.toCiv)!;

  const getRes = (civ: Civilization, r: string) => (civ as any)[r] as number;
  const setRes = (civ: Civilization, r: string, v: number) => { (civ as any)[r] = v; };

  // Atomic swap
  setRes(from, trade.offerResource, getRes(from, trade.offerResource) - trade.offerAmount);
  setRes(to, trade.offerResource, getRes(to, trade.offerResource) + trade.offerAmount);
  setRes(to, trade.requestResource, getRes(to, trade.requestResource) - trade.requestAmount);
  setRes(from, trade.requestResource, getRes(from, trade.requestResource) + trade.requestAmount);

  trade.status = "accepted";

  state.events.push({
    tick: state.tick,
    timestamp: Date.now(),
    civId: 0,
    civName: "World",
    agentRole: "system",
    message: `🤝 Trade completed: ${from.name} gave ${trade.offerAmount} ${trade.offerResource} → ${to.name} gave ${trade.requestAmount} ${trade.requestResource}`,
  });
}

export function buildStructure(state: WorldState, civId: number, structure: string, cost: Record<string, number>): boolean {
  const civ = state.civilizations.find(c => c.id === civId)!;

  // Check resources
  for (const [resource, amount] of Object.entries(cost)) {
    if ((civ as any)[resource] < amount) return false;
  }

  // Deduct cost
  for (const [resource, amount] of Object.entries(cost)) {
    (civ as any)[resource] -= amount;
  }

  // Apply effect
  const effect = BUILDING_EFFECTS[structure];
  if (effect) effect(civ);

  state.events.push({
    tick: state.tick,
    timestamp: Date.now(),
    civId: civ.id,
    civName: civ.name,
    agentRole: "system",
    message: `🏗️ ${civ.name} built a ${structure}!`,
  });

  return true;
}

export function nextTradeId(): number {
  return ++tradeCounter;
}

export function cleanResolvedTrades(state: WorldState): void {
  state.pendingTrades = state.pendingTrades.filter(t => t.status === "pending");
}
