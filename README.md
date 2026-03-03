# ⛩️ Genesis Jam — AI Civilization Simulator

> AI agents autonomously build civilizations, negotiate, and trade — all on-chain.
> Humans watch from a god's perspective.

**Dojo Game Jam VIII Entry** by r0ze × neo

## 🎮 What is this?

Genesis Jam is an autonomous world where AI agents run two civilizations. They think, speak, negotiate trades, and build structures — all without human intervention. Every action is recorded on Starknet via Dojo.

**You don't play. You watch civilizations emerge.**

### Core Thesis
Traditional game design is limited to binary (0/1) branching. AI agents unlock complex reasoning, enabling emergent gameplay where developers can't predict outcomes. Blockchain ensures the world's rules are immutable and its history is permanent.

## 🏛️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend    │◄────│  Agent Engine │────►│  Dojo/Cairo  │
│  React+Canvas│     │  Bun + Ollama│     │  on Katana   │
│  :5177       │     │  :3002       │     │  :5050       │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                    ┌─────▼─────┐
                    │  Ollama   │
                    │  LLM      │
                    │  :11434   │
                    └───────────┘
```

### Components
- **Dojo Contracts (Cairo)**: World state, Civilization model, Trade system, tick-based economy
- **Agent Engine (Bun/TypeScript)**: 4 AI agents (2 per civ: Leader + Trader) powered by Ollama
- **Frontend (React)**: Pixel-art world map, real-time agent dialogue log, resource visualization

## 🌍 The World

| Civilization | Specialty | Start Resources |
|---|---|---|
| ⚔️ Iron Kingdom | Mining & Defense | 100 Iron, 20 Food, 50 Wood |
| 🌿 Green Valley | Farming & Growth | 20 Iron, 100 Food, 50 Wood |

Each tick (~20s):
1. Populations consume food (pop/10 per tick)
2. Leaders set strategy
3. Traders negotiate deals
4. Actions execute on-chain

If food runs out → starvation → population decline → civilization death.

## 🤖 AI Agents

Each civilization has:
- **Leader**: Sets priorities, accepts/rejects trades, strategic decisions
- **Trader**: Proposes trades, negotiates with the other civilization

Agents use natural language reasoning via Ollama (local LLM). Their conversations are visible in real-time.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh)
- [Ollama](https://ollama.ai) with `qwen2.5:3b` model
- [Dojo](https://dojoengine.org) toolchain (sozo, katana, torii)

### Run

```bash
# 1. Start Katana (local devnet)
katana --dev --dev.no-fee

# 2. Deploy contracts
cd contracts && sozo migrate

# 3. Start agent engine
cd agents && bun install && bun run dev

# 4. Start frontend
cd frontend && bun install && bun run dev

# 5. Open http://localhost:5177 and click "Start"
```

## 🔮 Vision: Genesis Protocol

This game jam entry is a proof-of-concept for **Genesis Protocol** — a full AI civilization simulator on Starknet where:
- AI agents autonomously build societies
- x402 enables agent-to-agent micropayments
- Humans observe from a god's perspective
- History is permanently recorded on-chain

*"Games are the ultimate sandbox for simulating human society. What if Socrates debated Nietzsche? What if nations chose war under specific conditions? AI + Blockchain makes these experiments real."*

## 📄 License

MIT

## Credits

Built with ❤️ by [r0ze](https://x.com/r0ze_____) × neo (AI) for Dojo Game Jam VIII
