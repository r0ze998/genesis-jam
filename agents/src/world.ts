// World state management and game logic

import type { Civilization, TradeProposal, GameEvent, WorldState } from "./types.ts";
import { INITIAL_CIVS, FOOD_CONSUMPTION_DIVISOR, BUILDING_EFFECTS } from "./config.ts";

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

export function addEvent(state: WorldState, event: Omit<GameEvent, "tick" | "timestamp">): void {
  state.events.push({
    ...event,
    tick: state.tick,
    timestamp: Date.now(),
  });
}

export function consumeFood(state: WorldState): void {
  for (const civ of state.civilizations) {
    if (!civ.isAlive) continue;

    const cost = Math.floor(civ.population / FOOD_CONSUMPTION_DIVISOR);
    if (civ.food >= cost) {
      civ.food -= cost;
    } else {
      const deficit = cost - civ.food;
      civ.food = 0;
      civ.population = Math.max(0, civ.population - deficit);
      if (civ.population === 0) civ.isAlive = false;

      addEvent(state, {
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

export function getCiv(state: WorldState, civId: number): Civilization {
  return state.civilizations.find(c => c.id === civId)!;
}

function getResource(civ: Civilization, resource: string): number {
  return (civ as any)[resource] ?? 0;
}

function setResource(civ: Civilization, resource: string, value: number): void {
  (civ as any)[resource] = value;
}

export function executeTrade(state: WorldState, trade: TradeProposal): void {
  const from = getCiv(state, trade.fromCiv);
  const to = getCiv(state, trade.toCiv);

  // Atomic swap
  setResource(from, trade.offerResource, getResource(from, trade.offerResource) - trade.offerAmount);
  setResource(to, trade.offerResource, getResource(to, trade.offerResource) + trade.offerAmount);
  setResource(to, trade.requestResource, getResource(to, trade.requestResource) - trade.requestAmount);
  setResource(from, trade.requestResource, getResource(from, trade.requestResource) + trade.requestAmount);

  trade.status = "accepted";

  addEvent(state, {
    civId: 0,
    civName: "World",
    agentRole: "system",
    message: `🤝 Trade completed: ${from.name} gave ${trade.offerAmount} ${trade.offerResource} → ${to.name} gave ${trade.requestAmount} ${trade.requestResource}`,
  });
}

export function buildStructure(state: WorldState, civId: number, structure: string, cost: Record<string, number>): boolean {
  const civ = getCiv(state, civId);

  // Check resources
  for (const [resource, amount] of Object.entries(cost)) {
    if (getResource(civ, resource) < amount) return false;
  }

  // Deduct cost
  for (const [resource, amount] of Object.entries(cost)) {
    setResource(civ, resource, getResource(civ, resource) - amount);
  }

  // Apply effect
  BUILDING_EFFECTS[structure]?.(civ);

  addEvent(state, {
    civId: civ.id,
    civName: civ.name,
    agentRole: "system",
    message: `🏗️ ${civ.name} built a ${structure}!`,
  });

  return true;
}

export function createTradeProposal(
  state: WorldState,
  fromCivId: number,
  toCivId: number,
  offerResource: string,
  offerAmount: number,
  requestResource: string,
  requestAmount: number,
): TradeProposal {
  tradeCounter++;
  const trade: TradeProposal = {
    id: tradeCounter,
    fromCiv: fromCivId,
    toCiv: toCivId,
    offerResource,
    offerAmount,
    requestResource,
    requestAmount,
    status: "pending",
  };
  state.pendingTrades.push(trade);
  return trade;
}

export function cleanResolvedTrades(state: WorldState): void {
  state.pendingTrades = state.pendingTrades.filter(t => t.status === "pending");
}
