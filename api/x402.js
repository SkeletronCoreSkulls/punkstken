import { ethers } from "ethers";

const ABI = [
  "function mintWithX402(address recipient) external",
  "function x402Enabled() view returns (bool)"
];

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const REQUIRED_USDC_AMOUNT = ethers.parseUnits("10", 6); // 10 USDC (6 decimals)

export default async function handler(req, res) {
  // ---------------------------------------
  // 🟢 GET → x402scan schema descriptor
  // ---------------------------------------
  if (req.method === "GET") {
    const response = {
      x402Version: 1,
      payer: "x402scan",
      accepts: [
        {
          scheme: "exact",
          network: "base",
          maxAmountRequired: "10000000", // 10 USDC
          resource: "mint:punks:1",
          description: "Mint 50,000 PUNKS tokens for 10 USDC on Base network.",
          mimeType: "application/json",
          payTo: "0x25958e4A948F13B98B804BfB9341D475172E42BC",
          maxTimeoutSeconds: 300,
          asset: "USDC",
          outputSchema: {
            input: {
              type: "http",
              method: "POST",
              bodyType: "json"
            },
            output: {
              status: "string",
              message: "string",
              txMint: "string"
            }
          },
          extra: {
            project: "PUNKS",
            version: "1.0.5",
            autoMint: true
          }
        }
      ]
    };
    return res.status(402).json(response);
  }

  // ---------------------------------------
  // 🔵 POST → payment verification + mint
  // ---------------------------------------
  if (req.method === "POST") {
    try {
      const { resource, txHash } = req.body;
      if (!resource || !txHash)
        return res.status(400).json({ error: "Missing resource or txHash" });

      if (resource !== "mint:punks:1")
        return res.status(400).json({ error: "Invalid resource" });

      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);

      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt)
        return res.status(400).json({ error: "Transaction not found or not mined yet" });

      // Verify USDC payment to treasury
      const iface = new ethers.Interface(USDC_ABI);
      const log = receipt.logs.find(
        (l) => l.address.toLowerCase() === USDC_ADDRESS.toLowerCase()
      );
      if (!log) return res.status(400).json({ error: "No USDC transfer detected" });

      const parsed = iface.parseLog(log);
      const { from, to, value } = parsed.args;
      const treasury = "0x4d0abbdc64d2f854ec7d4a6d9fa2a4e6b1c0aa42";
      if (to.toLowerCase() !== treasury.toLowerCase())
        return res.status(400).json({ error: "Funds not sent to treasury" });

      if (value.toString() !== REQUIRED_USDC_AMOUNT.toString())
        return res.status(400).json({ error: "Invalid USDC amount" });

      // Mint to payer
      const tx = await contract.mintWithX402(from);
      const mintReceipt = await tx.wait();

      return res.status(200).json({
        status: "ok",
        message: "Mint successful",
        txMint: mintReceipt.transactionHash
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  }

  // ---------------------------------------
  // Anything else
  // ---------------------------------------
  return res.status(405).json({ error: "Method not allowed" });
}
