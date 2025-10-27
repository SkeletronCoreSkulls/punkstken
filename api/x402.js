export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const response = {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: "base",
        maxAmountRequired: "10000000", // 10 USDC (6 decimals)
        resource: "mint:punks:1",
        description: "Mint 50,000 PUNKS tokens for 10 USDC on Base network.",
        mimeType: "application/json",
        payTo: "0xYOUR_TREASURY_ADDRESS",
        maxTimeoutSeconds: 300,
        asset: "USDC",
        outputSchema: {
          input: {
            type: "http",
            method: "POST",
            bodyType: "json",
            bodyFields: {
              resource: { type: "string", required: true, description: "x402 resource identifier" },
              txHash: { type: "string", required: true, description: "USDC payment transaction hash" }
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
          version: "1.0.0"
        }
      }
    ]
  };

  // 👇 This is the critical line — must respond with 402 for x402scan
  return res.status(402).json(response);
}
