import { ethers, network } from "hardhat";
import { parseJsonArg, printOutput, writeManifest } from "./lib/runtime";

type DeployContracts = {
  institution_registry: string;
  merchant_registry: string;
  quest_manager: string;
  attestation_verifier: string;
  rewards_token: string;
  redemption: string;
};

type ReceiptSummary = {
  status: "confirmed" | "failed";
  block_number: number | null;
  gas_used: string | null;
};

type TxReceiptLike = {
  status?: bigint | number | null;
  blockNumber?: number;
  gasUsed?: { toString(): string };
} | null;

function txHashFromContract(contract: { deploymentTransaction(): { hash?: string | null } | null }): string | null {
  const tx = contract.deploymentTransaction();
  return tx?.hash ?? null;
}

function receiptSummary(receipt: TxReceiptLike): ReceiptSummary {
  const confirmed = receipt?.status === 1n || receipt?.status === 1;

  return {
    status: confirmed ? "confirmed" : "failed",
    block_number: receipt?.blockNumber ?? null,
    gas_used: receipt?.gasUsed ? receipt.gasUsed.toString() : null
  };
}

async function main() {
  const input = parseJsonArg();
  const rawPrivateKey =
    process.env.STABLETOWN_AVALANCHE_FUJI_PRIVATE_KEY || process.env.STABLETOWN_AVALANCHE_PRIVATE_KEY;

  if (!rawPrivateKey || rawPrivateKey.trim() === "") {
    throw new Error("missing_private_key");
  }

  const normalizedPrivateKey = rawPrivateKey.trim().startsWith("0x")
    ? rawPrivateKey.trim()
    : `0x${rawPrivateKey.trim()}`;
  const deployer = new ethers.Wallet(normalizedPrivateKey, ethers.provider);
  const admin = await deployer.getAddress();

  const tokenName =
    typeof input.token_name === "string" && input.token_name.trim() !== ""
      ? input.token_name.trim()
      : "CityChain Rewards";
  const tokenSymbol =
    typeof input.token_symbol === "string" && input.token_symbol.trim() !== ""
      ? input.token_symbol.trim()
      : "CITY";

  const institutionRegistryFactory = await ethers.getContractFactory("InstitutionRegistry", deployer);
  const merchantRegistryFactory = await ethers.getContractFactory("MerchantRegistry", deployer);
  const questManagerFactory = await ethers.getContractFactory("QuestManager", deployer);
  const attestationVerifierFactory = await ethers.getContractFactory("AttestationVerifier", deployer);
  const rewardsTokenFactory = await ethers.getContractFactory("RewardsToken", deployer);
  const redemptionFactory = await ethers.getContractFactory("Redemption", deployer);

  const institutionRegistry = await institutionRegistryFactory.deploy(admin);
  await institutionRegistry.waitForDeployment();

  const merchantRegistry = await merchantRegistryFactory.deploy(admin);
  await merchantRegistry.waitForDeployment();

  const questManager = await questManagerFactory.deploy(admin);
  await questManager.waitForDeployment();

  const attestationVerifier = await attestationVerifierFactory.deploy(admin);
  await attestationVerifier.waitForDeployment();

  const rewardsToken = await rewardsTokenFactory.deploy(tokenName, tokenSymbol, admin);
  await rewardsToken.waitForDeployment();

  const redemption = await redemptionFactory.deploy(
    admin,
    await rewardsToken.getAddress(),
    await merchantRegistry.getAddress()
  );
  await redemption.waitForDeployment();

  const deploymentTxHashes = {
    institution_registry: txHashFromContract(institutionRegistry),
    merchant_registry: txHashFromContract(merchantRegistry),
    quest_manager: txHashFromContract(questManager),
    attestation_verifier: txHashFromContract(attestationVerifier),
    rewards_token: txHashFromContract(rewardsToken),
    redemption: txHashFromContract(redemption)
  };

  const deploymentReceipts = {
    institution_registry: receiptSummary(
      deploymentTxHashes.institution_registry
        ? await ethers.provider.getTransactionReceipt(deploymentTxHashes.institution_registry)
        : null
    ),
    merchant_registry: receiptSummary(
      deploymentTxHashes.merchant_registry
        ? await ethers.provider.getTransactionReceipt(deploymentTxHashes.merchant_registry)
        : null
    ),
    quest_manager: receiptSummary(
      deploymentTxHashes.quest_manager
        ? await ethers.provider.getTransactionReceipt(deploymentTxHashes.quest_manager)
        : null
    ),
    attestation_verifier: receiptSummary(
      deploymentTxHashes.attestation_verifier
        ? await ethers.provider.getTransactionReceipt(deploymentTxHashes.attestation_verifier)
        : null
    ),
    rewards_token: receiptSummary(
      deploymentTxHashes.rewards_token
        ? await ethers.provider.getTransactionReceipt(deploymentTxHashes.rewards_token)
        : null
    ),
    redemption: receiptSummary(
      deploymentTxHashes.redemption
        ? await ethers.provider.getTransactionReceipt(deploymentTxHashes.redemption)
        : null
    )
  };

  const contracts: DeployContracts = {
    institution_registry: await institutionRegistry.getAddress(),
    merchant_registry: await merchantRegistry.getAddress(),
    quest_manager: await questManager.getAddress(),
    attestation_verifier: await attestationVerifier.getAddress(),
    rewards_token: await rewardsToken.getAddress(),
    redemption: await redemption.getAddress()
  };

  const manifestPath = writeManifest(network.name, "citychain-deploy", {
    network: network.name,
    chain_id: network.config.chainId ?? null,
    admin,
    contracts,
    deploy_tx_hashes: deploymentTxHashes,
    deploy_receipts: deploymentReceipts
  });

  printOutput({
    ok: true,
    tx_hash: deploymentTxHashes.redemption,
    token_id: null,
    contract_address: contracts.redemption,
    factory_address: null,
    metadata: {
      network: network.name,
      chain_id: network.config.chainId ?? null,
      admin,
      contracts,
      deploy_tx_hashes: deploymentTxHashes,
      deploy_receipts: deploymentReceipts,
      manifest_path: manifestPath
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
