import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

function optionalChainId(envKey: string, fallback: number): number {
  const value = process.env[envKey];
  if (!value || value.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalPrivateKey(...envKeys: string[]): string[] {
  const value = envKeys
    .map((key) => process.env[key])
    .find((candidate) => typeof candidate === "string" && candidate.trim() !== "");

  if (!value || value.trim() === "") {
    return [];
  }

  const normalized = value.trim().startsWith("0x") ? value.trim() : `0x${value.trim()}`;
  return [normalized];
}

const hederaAccounts = optionalPrivateKey("STABLETOWN_HEDERA_PRIVATE_KEY");
const hederaTestnetRpc = process.env.STABLETOWN_HEDERA_RPC_URL || "";
const hederaMirrorRpc = process.env.STABLETOWN_HEDERA_MIRROR_URL || "";
const avalancheLocalAccounts = optionalPrivateKey(
  "STABLETOWN_AVALANCHE_LOCAL_PRIVATE_KEY",
  "STABLETOWN_AVALANCHE_PRIVATE_KEY"
);
const avalancheFujiAccounts = optionalPrivateKey(
  "STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY",
  "STABLETOWN_AVALANCHE_PRIVATE_KEY"
);
const avalancheMainnetAccounts = optionalPrivateKey(
  "STABLETOWN_AVALANCHE_MAINNET_PRIVATE_KEY",
  "STABLETOWN_AVALANCHE_PRIVATE_KEY"
);
const avalancheLocalRpc =
  process.env.STABLETOWN_AVALANCHE_LOCAL_RPC_URL || "http://127.0.0.1:9650/ext/bc/C/rpc";
const avalancheFujiRpc =
  process.env.STABLETOWN_AVALANCHE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const avalancheMainnetRpc =
  process.env.STABLETOWN_AVALANCHE_MAINNET_RPC_URL || "https://api.avax.network/ext/bc/C/rpc";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {},
    hedera_testnet: {
      url: hederaTestnetRpc || "http://127.0.0.1:8545",
      chainId: optionalChainId("STABLETOWN_HEDERA_CHAIN_ID", 296),
      accounts: hederaAccounts
    },
    hedera_previewnet: {
      url: process.env.STABLETOWN_HEDERA_PREVIEW_RPC_URL || hederaTestnetRpc || "http://127.0.0.1:8545",
      chainId: optionalChainId("STABLETOWN_HEDERA_PREVIEW_CHAIN_ID", 297),
      accounts: hederaAccounts
    },
    hedera_mainnet: {
      url: process.env.STABLETOWN_HEDERA_MAINNET_RPC_URL || hederaMirrorRpc || hederaTestnetRpc || "http://127.0.0.1:8545",
      chainId: optionalChainId("STABLETOWN_HEDERA_MAINNET_CHAIN_ID", 295),
      accounts: hederaAccounts
    },
    avalanche_local: {
      url: avalancheLocalRpc,
      chainId: optionalChainId("STABLETOWN_AVALANCHE_LOCAL_CHAIN_ID", 43112),
      accounts: avalancheLocalAccounts
    },
    avalanche_fuji: {
      url: avalancheFujiRpc,
      chainId: optionalChainId("STABLETOWN_AVALANCHE_FUJI_CHAIN_ID", 43113),
      accounts: avalancheFujiAccounts
    },
    avalanche_mainnet: {
      url: avalancheMainnetRpc,
      chainId: optionalChainId("STABLETOWN_AVALANCHE_MAINNET_CHAIN_ID", 43114),
      accounts: avalancheMainnetAccounts
    }
  },
  mocha: {
    timeout: 120_000
  }
};

export default config;
