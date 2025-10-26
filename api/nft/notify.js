import { ethers } from "ethers";

const ABI = [
  "function mintWithX402(address recipient) external",
  "function x402Enabled() view returns (bool)"
];

// USDC on Base mainnet
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];

const REQUIRED_USDC_AMOUNT = ethers.parseUnits("10", 6); // 10 USDC (6 decimals)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { resource, txHash } = req.body;
    if (!resource || !txHash)
      return res.status(400).json({ error: "Missing resource or txHash" });

    if (resource !== "mint:punks:1")
      return res.status(400).json({ error: "Invalid resource" });

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);

    const payerTx = await provider.getTransactionReceipt(txHash);
    if (!payerTx)
      return res.status(400).json({ error: "Transaction not found or not yet mined" });

    // Decode logs to verify USDC transfer
    const iface = new ethers.Interface(USDC_ABI);
    const usdcTransfer = payerTx.logs
      .map((log) => {
        try {
          if (log.address.toLowerCase() !== USDC_ADDRESS.toLowerCase()) return null;
          return iface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .find((decoded) => decoded && decoded.name === "Transfer");

    if (!usdcTransfer)
      return res.status(400).json({ error: "No USDC transfer found in transaction" });

    const { from, to, value } = usdcTransfer.args;
    const treasury = wallet.address.toLowerCase();

    if (to.toLowerCase() !== treasury)
      return res.status(400).json({ error: "USDC was not sent to the treasury address" });

    if (value.toString() !== REQUIRED_USDC_AMOUNT.toString())
      return res.status(400).json({ error: "Invalid USDC amount (must be exactly 10)" });

    const recipient = from;

    const tx = await contract.mintWithX402(recipient);
    const receipt = await tx.wait();

    return res.status(200).json({
      status: "ok",
      message: "Mint verified and successful",
      txMint: receipt.transactionHash,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
