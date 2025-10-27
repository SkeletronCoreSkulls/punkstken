import { ethers } from "ethers";

const ABI = [
  "function mintWithX402(address recipient) external",
  "function x402Enabled() view returns (bool)"
];

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const REQUIRED_USDC_AMOUNT = ethers.parseUnits("10", 6); // 10 USDC (6 decimals)
const TREASURY = "0xDC97B0E48f1c4B2f1F8802883F9430B214310d41"; // ✅ tu treasury

export default async function handler(req, res) {
  // ------------------------------------------------
  // 🟢 GET → descriptor X402 para x402scan
  // ------------------------------------------------
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
          payTo: TREASURY,
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
            version: "1.0.6",
            autoMint: true
          }
        }
      ]
    };
    return res.status(402).json(response);
  }

  // ------------------------------------------------
  // 🔵 POST → ejecuta mint automático luego del pago
  // ------------------------------------------------
  if (req.method === "POST") {
    try {
      // 🔹 Forzar parsing manual del body (por si viene vacío)
      let body = {};
      try {
        body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      } catch (err) {
        body = {};
      }

      const resource = body?.resource || "mint:punks:1";
      const txHash = body?.txHash || null;

      // Si x402scan no envía nada, igual procedemos con el flujo base
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);

      // ⚠️ Si viene un txHash, se verifica el pago USDC
      if (txHash) {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt)
          return res.status(400).json({ error: "Transaction not found or not mined yet" });

        const iface = new ethers.Interface(USDC_ABI);
        const log = receipt.logs.find(
          (l) => l.address.toLowerCase() === USDC_ADDRESS.toLowerCase()
        );
        if (!log) return res.status(400).json({ error: "No USDC transfer detected" });

        const parsed = iface.parseLog(log);
        const { from, to, value } = parsed.args;
        if (to.toLowerCase() !== TREASURY.toLowerCase())
          return res.status(400).json({ error: "Funds not sent to treasury" });
        if (value.toString() !== REQUIRED_USDC_AMOUNT.toString())
          return res.status(400).json({ error: "Invalid USDC amount" });

        // ✅ Mint tokens al payer
        const tx = await contract.mintWithX402(from);
        const mintReceipt = await tx.wait();

        return res.status(200).json({
          status: "ok",
          message: "Mint successful via tx verification",
          txMint: mintReceipt.transactionHash
        });
      }

      // 🚀 Si no hay txHash, asumimos ejecución directa (x402scan auto-flow)
      const signerAddr = await wallet.getAddress();
      const tx = await contract.mintWithX402(signerAddr);
      const mintReceipt = await tx.wait();

      return res.status(200).json({
        status: "ok",
        message: "Auto mint executed (no txHash provided)",
        txMint: mintReceipt.transactionHash
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  }

  // ------------------------------------------------
  // ❌ otros métodos
  // ------------------------------------------------
  return res.status(405).json({ error: "Method not allowed" });
}
