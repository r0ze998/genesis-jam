# Genesis Jam — Dojo Game Jam VIII MVP

## Concept
AI agents autonomously run 2 civilizations that negotiate and trade resources.
Humans watch from a god's perspective. All transactions recorded on-chain via Dojo.

## Architecture

### 1. Dojo Contracts (Cairo/Starknet)
- **World State**: Map with 2 regions, each with resource deposits
- **Civilization Model**: Name, population, resources (iron, food, wood, gold)
- **Trade System**: Propose trade → Accept/Reject → Execute (atomic swap of resources)
- **Event Log**: All negotiations and trades recorded as events

### 2. AI Agent Engine (TypeScript/Bun)
- Each civilization has 2 agents: Leader + Trader
- Leader: Sets strategy (what to prioritize, war/peace stance)
- Trader: Negotiates specific trades with other civilization's trader
- Uses Ollama (local LLM, qwen2.5:3b) for agent reasoning
- Agents communicate via natural language, decisions mapped to Dojo actions

### 3. Frontend (React + PixiJS)
- Pixel art world map showing 2 civilizations
- Real-time agent conversation log (RPG battle-log style)
- Resource bars for each civilization
- Trade history timeline
- Agents visually move between civilizations when trading

## Tech Stack
- **Onchain**: Dojo (Cairo) on Katana (local devnet)
- **AI**: Ollama (qwen2.5:3b) via localhost:11434
- **Backend**: Bun + Hono (orchestrates agents ↔ Dojo)
- **Frontend**: React + Vite + PixiJS
- **Tools**: sozo (Dojo CLI), torii (indexer), katana (local chain)

## Game Loop (every tick = ~30 seconds)
1. Each Leader agent evaluates civilization state → sets priorities
2. Trader agents propose/negotiate trades via LLM conversation
3. If trade agreed → submit to Dojo contract
4. World state updates → UI reflects changes
5. Random events (drought, discovery) can shift resource balance

## Resource Model
- Civilization A: Iron-rich region (starts with 100 iron, 20 food)
- Civilization B: Fertile region (starts with 20 iron, 100 food)
- Both need minimum food (30) to avoid population decline
- Both need minimum iron (30) to build/defend

## MVP Scope (3 days)
- [x] Dojo contracts: World, Civilization, Trade
- [x] Katana local devnet running
- [x] 2 AI agents per civilization (Ollama)
- [x] Natural language negotiation between traders
- [x] Trades execute on-chain
- [x] Simple pixel UI showing state + logs
- [ ] Random events (stretch goal)
- [ ] War mechanic (stretch goal)

## File Structure
```
genesis-jam/
├── contracts/          # Dojo/Cairo contracts
│   ├── src/
│   │   ├── models/     # World, Civilization, Trade models
│   │   ├── systems/    # Trade system, World system
│   │   └── lib.cairo
│   └── Scarb.toml
├── agents/             # AI agent engine
│   ├── src/
│   │   ├── leader.ts
│   │   ├── trader.ts
│   │   ├── engine.ts   # Game loop orchestrator
│   │   └── dojo.ts     # Dojo client interactions
│   ├── package.json
│   └── tsconfig.json
├── frontend/           # React + PixiJS UI
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```
