import { ethers, network } from "hardhat";
import { parseJsonArg, printOutput } from "./lib/runtime";

type ContractsInput = {
  institution_registry?: string;
  merchant_registry?: string;
  quest_manager?: string;
  rewards_token?: string;
  redemption?: string;
};

type TxReceiptStatus = {
  status: "confirmed" | "failed" | "pending" | "missing";
  tx_hash?: string;
  block_number?: number;
  gas_used?: string;
};

function contractsFromInput(input: Record<string, unknown>): ContractsInput {
  const metadata =
    input.metadata && typeof input.metadata === "object" ? (input.metadata as Record<string, unknown>) : {};
  const contracts =
    metadata.contracts && typeof metadata.contracts === "object"
      ? (metadata.contracts as Record<string, unknown>)
      : {};

  return {
    institution_registry:
      (contracts.institution_registry as string | undefined) || (input.institution_registry as string | undefined),
    merchant_registry:
      (contracts.merchant_registry as string | undefined) || (input.merchant_registry as string | undefined),
    quest_manager: (contracts.quest_manager as string | undefined) || (input.quest_manager as string | undefined),
    rewards_token: (contracts.rewards_token as string | undefined) || (input.rewards_token as string | undefined),
    redemption: (contracts.redemption as string | undefined) || (input.redemption as string | undefined)
  };
}

function metadataFromInput(input: Record<string, unknown>): Record<string, unknown> {
  return input.metadata && typeof input.metadata === "object" ? (input.metadata as Record<string, unknown>) : {};
}

function extractStringMap(source: unknown): Record<string, string> {
  if (!source || typeof source !== "object") {
    return {};
  }

  return Object.entries(source as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === "string" && value.trim() !== "") {
      acc[key] = value.trim();
    }
    return acc;
  }, {});
}

async function txReceiptSummary(txHash: string | undefined): Promise<TxReceiptStatus> {
  if (!txHash) {
    return { status: "missing" };
  }

  const receipt = await ethers.provider.getTransactionReceipt(txHash);

  if (!receipt) {
    return { status: "pending", tx_hash: txHash };
  }

  const confirmed = receipt.status === 1 || receipt.status === 1n;

  return {
    status: confirmed ? "confirmed" : "failed",
    tx_hash: txHash,
    block_number: receipt.blockNumber,
    gas_used: receipt.gasUsed.toString()
  };
}

async function main() {
  const input = parseJsonArg();
  const metadata = metadataFromInput(input);
  const contracts = contractsFromInput(input);

  if (
    !contracts.institution_registry ||
      !contracts.merchant_registry ||
      !contracts.quest_manager ||
      !contracts.rewards_token ||
      !contracts.redemption
  ) {
    throw new Error("missing_contract_addresses");
  }

  const institutionRegistry = await ethers.getContractAt("InstitutionRegistry", contracts.institution_registry);
  const merchantRegistry = await ethers.getContractAt("MerchantRegistry", contracts.merchant_registry);
  const questManager = await ethers.getContractAt("QuestManager", contracts.quest_manager);
  const rewardsToken = await ethers.getContractAt("RewardsToken", contracts.rewards_token);
  const redemption = await ethers.getContractAt("Redemption", contracts.redemption);

  const institutionCount = await institutionRegistry.institutionCount();
  const merchantCount = await merchantRegistry.merchantCount();
  const nextQuestId = await questManager.nextQuestId();
  const totalSupply = await rewardsToken.totalSupply();
  const redemptionTokenAddress = await redemption.rewardsToken();
  const redemptionRegistryAddress = await redemption.merchantRegistry();

  const seededRoles =
    metadata.seeded_roles && typeof metadata.seeded_roles === "object"
      ? (metadata.seeded_roles as Record<string, unknown>)
      : {};

  const residents =
    seededRoles.residents && typeof seededRoles.residents === "object"
      ? (seededRoles.residents as Record<string, unknown>)
      : {};

  const merchantMap =
    seededRoles.merchants && typeof seededRoles.merchants === "object"
      ? (seededRoles.merchants as Record<string, unknown>)
      : {};

  const residentAddress =
    typeof residents.demo_resident === "string" && residents.demo_resident.trim() !== ""
      ? residents.demo_resident
      : null;

  const merchantAddress =
    typeof merchantMap.demo_merchant === "string" && merchantMap.demo_merchant.trim() !== ""
      ? merchantMap.demo_merchant
      : null;

  const participantBalance = residentAddress ? await rewardsToken.balanceOf(residentAddress) : 0n;
  const merchantAllowed = merchantAddress ? await merchantRegistry.isMerchant(merchantAddress) : false;

  const flowTxHashes = extractStringMap(metadata.flow_tx_hashes);
  const flowReceiptStatus: {
    quest_claim: TxReceiptStatus;
    redemption_chain_settlement: TxReceiptStatus;
  } = {
    quest_claim: await txReceiptSummary(flowTxHashes.quest_claim),
    redemption_chain_settlement: await txReceiptSummary(flowTxHashes.redemption_chain_settlement)
  };

  printOutput({
    ok: true,
    tx_hash: null,
    token_id: null,
    contract_address: null,
    factory_address: null,
    metadata: {
      network: network.name,
      chain_id: network.config.chainId ?? null,
      institution_count: institutionCount.toString(),
      merchant_count: merchantCount.toString(),
      quest_count: (Number(nextQuestId) - 1).toString(),
      rewards_total_supply: totalSupply.toString(),
      participant_balance: participantBalance.toString(),
      merchant_allowed: merchantAllowed,
      redemption_token_address: redemptionTokenAddress,
      redemption_registry_address: redemptionRegistryAddress,
      flow_receipt_status: flowReceiptStatus,
      verification: {
        contracts_bound: redemptionTokenAddress === contracts.rewards_token && redemptionRegistryAddress === contracts.merchant_registry,
        claim_observed: flowReceiptStatus.quest_claim.status === "confirmed",
        redemption_observed: flowReceiptStatus.redemption_chain_settlement.status === "confirmed",
        merchant_allowlisted: merchantAllowed
      }
    }
  });
}

main().catch((error: unknown) => {
  printOutput({
    ok: false,
    tx_hash: null,
    token_id: null,
    contract_address: null,
    factory_address: null,
    metadata: {
      error: error instanceof Error ? error.message : "unexpected_error",
      failure_reason: "submission_rejected"
    }
  });
  process.exitCode = 1;
});
