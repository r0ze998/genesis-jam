// Dojo on-chain client — executes sozo commands against Katana

const SOZO_PATH = "/Users/hiroprotagonist/.asdf/installs/sozo/1.8.6/bin/sozo";
const CONTRACTS_DIR = "/Users/hiroprotagonist/.openclaw/workspace/genesis-jam/contracts";
const RPC_URL = process.env.RPC_URL || "http://localhost:5050";
const WORLD_ADDRESS = process.env.WORLD_ADDRESS || "0x026d5777eccca1861a23303ee0ba48c0e8349e849d0377a21c3801ef1d0f8cef";
const CONTRACT_TAG = "dojo_starter-actions";
const ACCOUNT = process.env.ACCOUNT || "0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912";

// --- Helpers ---

function stringToFelt(s: string): string {
  return "0x" + Array.from(s).map(c => c.charCodeAt(0).toString(16)).join("");
}

async function sozoExecute(entrypoint: string, calldata: string[] = []): Promise<boolean> {
  const cmd = [
    SOZO_PATH, "execute",
    CONTRACT_TAG, entrypoint, ...calldata,
    "--world", WORLD_ADDRESS,
    "--rpc-url", RPC_URL,
    "--account-address", ACCOUNT,
    "--private-key", PRIVATE_KEY,
    "--wait",
  ];

  try {
    const proc = Bun.spawn(["bash", "-c", cmd.join(" ")], {
      cwd: CONTRACTS_DIR,
      env: {
        ...process.env,
        HOME: process.env.HOME || "/Users/hiroprotagonist",
        PATH: `/Users/hiroprotagonist/.asdf/installs/sozo/1.8.6/bin:/Users/hiroprotagonist/.asdf/installs/scarb/2.13.1/bin:/opt/homebrew/bin:${process.env.PATH}`,
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    if (exitCode !== 0) {
      console.error(`sozo ${entrypoint} failed (${exitCode}): ${(stderr || stdout).slice(0, 200)}`);
      return false;
    }

    console.log(`✅ On-chain: ${entrypoint}(${calldata.join(",")}) tx: ${stdout.trim().slice(0, 80)}`);
    return true;
  } catch (e) {
    console.error(`sozo ${entrypoint} error:`, e);
    return false;
  }
}

// --- Public API ---

export const onchainSpawnWorld = () => sozoExecute("spawn_world");

export const onchainTick = () => sozoExecute("tick");

export const onchainAcceptTrade = (tradeId: number) =>
  sozoExecute("accept_trade", [String(tradeId)]);

export const onchainRejectTrade = (tradeId: number) =>
  sozoExecute("reject_trade", [String(tradeId)]);

export const onchainProposeTrade = (
  fromCiv: number,
  toCiv: number,
  offerResource: string,
  offerAmount: number,
  requestResource: string,
  requestAmount: number,
) => sozoExecute("propose_trade", [
  String(fromCiv), String(toCiv),
  stringToFelt(offerResource), String(offerAmount),
  stringToFelt(requestResource), String(requestAmount),
]);
