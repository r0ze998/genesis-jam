export interface Civilization {
  id: number;
  name: string;
  iron: number;
  food: number;
  wood: number;
  population: number;
  isAlive: boolean;
}

export interface TradeProposal {
  id: number;
  fromCiv: number;
  toCiv: number;
  offerResource: string;
  offerAmount: number;
  requestResource: string;
  requestAmount: number;
  status: "pending" | "accepted" | "rejected";
}

export interface AgentAction {
  type: "trade_propose" | "trade_accept" | "trade_reject" | "build" | "speak";
  details: Record<string, any>;
  reasoning: string;
}

export interface GameEvent {
  tick: number;
  timestamp: number;
  civId: number;
  civName: string;
  agentRole: string;
  message: string;
  action?: AgentAction;
}

export interface WorldState {
  tick: number;
  civilizations: Civilization[];
  pendingTrades: TradeProposal[];
  events: GameEvent[];
}
