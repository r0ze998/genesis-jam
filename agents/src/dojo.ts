// Dojo client — calls sozo execute to interact with on-chain contracts

const RPC_URL = process.env.RPC_URL || "http://localhost:5050";
const WORLD_ADDRESS = process.env.WORLD_ADDRESS || "0x026d5777eccca1861a23303ee0ba48c0e8349e849d0377a21c3801ef1d0f8cef";
const CONTRACT_TAG = "dojo_starter-actions";
// Default katana account
const ACCOUNT = process.env.ACCOUNT || "0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912";

async function sozoExecute(entrypoint: string, calldata: string[] = []): Promise<boolean> {
  // sozo execute <TAG> <ENTRYPOINT> [CALLDATA...]
  // calldata is space-separated after entrypoint
  const callString = [CONTRACT_TAG, entrypoint, ...calldata].join(" ");
  
  const sozoPath = "/Users/hiroprotagonist/.asdf/installs/sozo/1.8.6/bin/sozo";
  const cmd = [
    sozoPath, "execute",
    ...callString.split(" "),
    "--world", WORLD_ADDRESS,
    "--rpc-url", RPC_URL,
    "--account-address", ACCOUNT,
    "--private-key", PRIVATE_KEY,
    "--wait",
  ];
  const args = ["bash", "-c", cmd.join(" ")];

  try {
    const contractsDir = "/Users/hiroprotagonist/.openclaw/workspace/genesis-jam/contracts";
    const proc = Bun.spawn(args, {
      cwd: contractsDir,
      env: { 
        ...process.env, 
        HOME: process.env.HOME || "/Users/hiroprotagonist",
        PATH: `/Users/hiroprotagonist/.asdf/installs/sozo/1.8.6/bin:/Users/hiroprotagonist/.asdf/installs/scarb/2.13.1/bin:/opt/homebrew/bin:${process.env.PATH}`,
      },
      stdout: "pipe",
      stderr: "pipe",
    });
    
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      console.error(`sozo execute ${entrypoint} failed:`, stderr.slice(0, 200));
      return false;
    }
    console.log(`✅ On-chain: ${entrypoint}(${calldata.join(",")})`);
    return true;
  } catch (e) {
    console.error(`sozo execute error:`, e);
    return false;
  }
}

export async function onchainSpawnWorld(): Promise<boolean> {
  return sozoExecute("spawn_world");
}

export async function onchainProposeTrade(
  fromCiv: number,
  toCiv: number,
  offerResource: string,
  offerAmount: number,
  requestResource: string,
  requestAmount: number,
): Promise<boolean> {
  const offerFelt = stringToFelt(offerResource);
  const requestFelt = stringToFelt(requestResource);
  return sozoExecute("propose_trade", [
    String(fromCiv), String(toCiv),
    offerFelt, String(offerAmount),
    requestFelt, String(requestAmount),
  ]);
}

export async function onchainAcceptTrade(tradeId: number): Promise<boolean> {
  return sozoExecute("accept_trade", [String(tradeId)]);
}

export async function onchainRejectTrade(tradeId: number): Promise<boolean> {
  return sozoExecute("reject_trade", [String(tradeId)]);
}

export async function onchainTick(): Promise<boolean> {
  return sozoExecute("tick");
}

function stringToFelt(s: string): string {
  let hex = "0x";
  for (let i = 0; i < s.length; i++) {
    hex += s.charCodeAt(i).toString(16);
  }
  return hex;
}
