import { ethers } from "hardhat";
import { parseJsonArg, printOutput } from "./lib/runtime";

type ContractsInput = {
  institution_registry?: string;
  merchant_registry?: string;
  quest_manager?: string;
  rewards_token?: string;
  redemption?: string;
};

type ReceiptSummary = {
  tx_hash: string | null;
  status: "confirmed" | "failed";
  block_number: number | null;
  gas_used: string | null;
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

function normalizeReceipt(receipt: { hash?: string; status?: number | bigint; blockNumber?: number; gasUsed?: { toString(): string } } | null): ReceiptSummary {
  const confirmed = receipt?.status === 1 || receipt?.status === 1n;

  return {
    tx_hash: receipt?.hash ?? null,
    status: confirmed ? "confirmed" : "failed",
    block_number: receipt?.blockNumber ?? null,
    gas_used: receipt?.gasUsed ? receipt.gasUsed.toString() : null
  };
}

async function main() {
  const input = parseJsonArg();
  const contracts = contractsFromInput(input);
  const rawPrivateKey =
    process.env.STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY || process.env.STABLETOWN_AVALANCHE_PRIVATE_KEY;

  if (!rawPrivateKey || rawPrivateKey.trim() === "") {
    throw new Error("missing_private_key");
  }

  const normalizedPrivateKey = rawPrivateKey.trim().startsWith("0x")
    ? rawPrivateKey.trim()
    : `0x${rawPrivateKey.trim()}`;
  const signer = new ethers.Wallet(normalizedPrivateKey, ethers.provider);
  const admin = await signer.getAddress();
  const deriveAddress = (label: string): string => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(`${admin}:${label}`)).replace(/^0x/, "");
    return ethers.getAddress(`0x${hash.slice(24)}`);
  };

  const institutionA = deriveAddress("institution_city");
  const institutionB = deriveAddress("institution_university");
  const merchantA = deriveAddress("merchant_demo");
  const residentA = deriveAddress("resident_demo");

  if (
    !contracts.institution_registry ||
      !contracts.merchant_registry ||
      !contracts.quest_manager ||
      !contracts.rewards_token ||
      !contracts.redemption
  ) {
    throw new Error("missing_contract_addresses");
  }

  const institutionRegistry = await ethers.getContractAt("InstitutionRegistry", contracts.institution_registry, signer);
  const merchantRegistry = await ethers.getContractAt("MerchantRegistry", contracts.merchant_registry, signer);
  const questManager = await ethers.getContractAt("QuestManager", contracts.quest_manager, signer);
  const rewardsToken = await ethers.getContractAt("RewardsToken", contracts.rewards_token, signer);
  const redemption = await ethers.getContractAt("Redemption", contracts.redemption, signer);

  const seedTxReceipts = {
    add_institution_city: normalizeReceipt(await (await institutionRegistry.addInstitution(institutionA)).wait()),
    add_institution_university: normalizeReceipt(await (await institutionRegistry.addInstitution(institutionB)).wait()),
    add_merchant_demo: normalizeReceipt(await (await merchantRegistry.addMerchant(merchantA)).wait()),
    create_quest_merchant_spend: normalizeReceipt(await (await questManager.createQuest("merchant_spend", 500, 1)).wait()),
    create_quest_event_attendance: normalizeReceipt(await (await questManager.createQuest("event_attendance", 300, 1)).wait()),
    create_quest_volunteer: normalizeReceipt(await (await questManager.createQuest("volunteer_mission", 700, 1)).wait())
  };

  const claimAmount = ethers.parseUnits("1000", 18);
  const settlementAmount = ethers.parseUnits("250", 18);

  const claimReceipt = normalizeReceipt(await (await rewardsToken.mint(residentA, claimAmount)).wait());
  const rewardsAdminTransferReceipt = normalizeReceipt(
    await (await rewardsToken.transferAdmin(await redemption.getAddress())).wait()
  );

  const settlementReference = `citychain-settlement-${Date.now()}`;
  const settlementReceipt = normalizeReceipt(
    await (await redemption.redeem(residentA, merchantA, settlementAmount, settlementReference)).wait()
  );

  printOutput({
    ok: true,
    tx_hash: settlementReceipt.tx_hash,
    token_id: null,
    contract_address: null,
    factory_address: null,
    metadata: {
      admin,
      seeded_roles: {
        admin,
        institutions: { city: institutionA, university: institutionB },
        merchants: { demo_merchant: merchantA },
        residents: { demo_resident: residentA }
      },
      flow_tx_hashes: {
        quest_claim: claimReceipt.tx_hash,
        redemption_chain_settlement: settlementReceipt.tx_hash
      },
      flow_receipts: {
        quest_claim: claimReceipt,
        redemption_chain_settlement: settlementReceipt
      },
      rewards_admin_transfer_receipt: rewardsAdminTransferReceipt,
      seed_tx_receipts: seedTxReceipts,
      claim_amount: claimAmount.toString(),
      settlement_amount: settlementAmount.toString(),
      settlement_reference: settlementReference
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
