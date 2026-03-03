// Game configuration constants

export const TICK_MS = Number(process.env.TICK_MS || 20000);
export const PORT = Number(process.env.PORT || 3002);

export const INITIAL_CIVS = [
  {
    id: 1,
    name: "Iron Kingdom",
    iron: 100,
    food: 20,
    wood: 50,
    population: 100,
    isAlive: true,
  },
  {
    id: 2,
    name: "Green Valley",
    iron: 20,
    food: 100,
    wood: 50,
    population: 100,
    isAlive: true,
  },
] as const;

export const AGENT_PROFILES = [
  { civId: 1, civName: "Iron Kingdom", role: "leader" as const, personality: "Pragmatic and cautious. Values military strength but knows food is survival." },
  { civId: 1, civName: "Iron Kingdom", role: "trader" as const, personality: "Shrewd negotiator. Drives hard bargains but keeps deals fair enough to maintain relationships." },
  { civId: 2, civName: "Green Valley", role: "leader" as const, personality: "Peaceful and wise. Prefers trade over conflict. Knows iron is needed for tools." },
  { civId: 2, civName: "Green Valley", role: "trader" as const, personality: "Friendly but not naive. Seeks mutual benefit and long-term partnerships." },
];

export const BUILDING_EFFECTS: Record<string, (civ: any) => void> = {
  farm: (civ) => { civ.food += 15; },
  mine: (civ) => { civ.iron += 15; },
  wall: (civ) => { civ.population += 5; },
};

export const FOOD_CONSUMPTION_DIVISOR = 10;
