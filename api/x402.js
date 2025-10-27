export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const response = {
    x402Version: 1,
    payer: "x402scan", // <— le indica que el ejecutor será x402scan mismo
    accepts: [
      {
        scheme: "exact",
        network: "base",
        maxAmountRequired: "10000000", // 10 USDC
        resource: "mint:punks:1",
        description: "Mint 50,000 PUNKS tokens for 10 USDC on Base network.",
        mimeType: "application/json",
        payTo: "0x4d0abbdc64d2f854ec7d4a6d9fa2a4e6b1c0aa42", // <— tu treasury
        maxTimeoutSeconds: 300,
        asset: "USDC",

        outputSchema: {
          input: {
            type: "http",
            method: "POST",
            bodyType: "json",
            // ⚠️ la ruta que realmente debe ejecutar luego del pago:
            headerFields: {
              "Content-Type": { type: "string", required: true, description: "application/json" }
            },
            bodyFields: {
              resource: { type: "string", required: true },
              txHash: { type: "string", required: true }
            }
          },
          output: {
            status: "string",
            message: "string",
            txMint: "string"
          }
        },

        extra: {
          project: "PUNKS",
          version: "1.0.3",
          executeEndpoint: "https://punks-mocha.vercel.app/api/nft/notify",
          autoMint: true
        }
      }
    ]
  };

  // 👇 x402scan espera código 402 Payment Required
  return res.status(402).json(response);
}
