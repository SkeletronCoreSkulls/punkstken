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
        maxAmountRequired: "10000000",
        resource: "mint:punks:1",
        description: "Mint 50,000 PUNKS tokens for 10 USDC on Base network.",
        mimeType: "application/json",
        payTo: "0x25958e4A948F13B98B804BfB9341D475172E42BC",
        maxTimeoutSeconds: 2000,
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

  return res.status(200).json(response);
}
