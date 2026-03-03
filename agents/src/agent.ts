import { chat, type Message } from "./ollama.ts";
import type { Civilization, AgentAction, TradeProposal } from "./types.ts";

export class CivAgent {
  civId: number;
  civName: string;
  role: "leader" | "trader";
  personality: string;
  memory: string[] = [];

  constructor(
    civId: number,
    civName: string,
    role: "leader" | "trader",
    personality: string
  ) {
    this.civId = civId;
    this.civName = civName;
    this.role = role;
    this.personality = personality;
  }

  private buildSystemPrompt(civ: Civilization): string {
    return `You are the ${this.role} of "${this.civName}", a civilization in a world simulation.

Personality: ${this.personality}

Your civilization's current state:
- Iron: ${civ.iron}
- Food: ${civ.food}  
- Wood: ${civ.wood}
- Population: ${civ.population}

CRITICAL: Your people consume ${Math.floor(civ.population / 10)} food per tick. If food runs out, people die.

${this.role === "leader" 
  ? "As leader, you set strategy and decide whether to accept or reject trades. Think about long-term survival."
  : "As trader, you negotiate deals with the other civilization. Propose fair trades that benefit your people."}

Recent events:
${this.memory.slice(-5).join("\n") || "None yet."}

Respond with a JSON object:
{
  "thought": "your internal reasoning (1-2 sentences)",
  "speech": "what you say out loud to your people or the other civilization (keep it short, in-character)",
  "action": {
    "type": "trade_propose" | "trade_accept" | "trade_reject" | "build" | "speak",
    "details": { ... }
  }
}

For trade_propose: details = { "offerResource": "iron"|"food"|"wood", "offerAmount": number, "requestResource": "iron"|"food"|"wood", "requestAmount": number }
For trade_accept/trade_reject: details = { "tradeId": number }
For build: details = { "structure": "farm"|"mine"|"wall", "cost": { "wood": number } }
For speak: details = { "message": "..." }

ONLY respond with valid JSON. No other text.`;
  }

  async think(
    civ: Civilization,
    pendingTrades: TradeProposal[],
    context: string
  ): Promise<{ thought: string; speech: string; action: AgentAction }> {
    const systemPrompt = this.buildSystemPrompt(civ);
    
    let userPrompt = `Tick update. ${context}`;
    
    if (pendingTrades.length > 0 && this.role === "leader") {
      const tradeInfo = pendingTrades
        .map(t => `Trade #${t.id}: They offer ${t.offerAmount} ${t.offerResource} for ${t.requestAmount} ${t.requestResource}`)
        .join("\n");
      userPrompt += `\n\nPending trade proposals for you to decide:\n${tradeInfo}`;
    }

    if (this.role === "trader" && pendingTrades.length === 0) {
      userPrompt += "\n\nNo pending trades. Consider proposing one if your civilization needs resources.";
    }

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    try {
      const response = await chat(messages);
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      
      this.memory.push(`[Tick] ${parsed.speech}`);
      if (this.memory.length > 20) this.memory.shift();

      return {
        thought: parsed.thought || "",
        speech: parsed.speech || "",
        action: parsed.action || { type: "speak", details: { message: parsed.speech }, reasoning: parsed.thought },
      };
    } catch (e) {
      // Fallback if LLM response isn't valid JSON
      return {
        thought: "I need to think more carefully...",
        speech: "Hmm, let me consider our options.",
        action: { type: "speak", details: { message: "Considering options..." }, reasoning: "Parse error fallback" },
      };
    }
  }
}
