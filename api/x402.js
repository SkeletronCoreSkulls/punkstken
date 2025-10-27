export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
        payTo: "0x4d0abbdc64d2f854ec7d4a6d9fa2a4e6b1c0aa42",
        maxTimeoutSeconds: 300,
        asset: "USDC",

        // 🔧 Aquí definimos el esquema de ejecución externa (auto-mint)
        outputSchema: {
          input: {
            type: "http",
            method: "POST",
            bodyType: "json",
            // ⚠️ Esto es lo que x402scan reconocerá como el endpoint de ejecución
            outputSchema: {
              input: {
                type: "http",
                method: "POST",
                bodyType: "json",
                url: "https://punks-mocha.vercel.app/api/nft/notify"
              },
              output: {
                status: "string",
                message: "string",
                txMint: "string"
              }
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
          version: "1.0.4",
          autoMint: true
        }
      }
    ]
  };

  return res.status(402).json(response);
}
