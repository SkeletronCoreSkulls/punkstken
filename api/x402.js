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
        payTo: "0x25958e4A948F13B98B804BfB9341D475172E42BC", // <-- tu treasury address
        maxTimeoutSeconds: 300,
        asset: "USDC",

        // Minimal schema: auto-execute after payment, no manual fields
        outputSchema: {
          input: {
            type: "http",
            method: "POST"
          },
          output: {
            status: "string",
            message: "string",
            txMint: "string"
          }
        },

        extra: {
          project: "PUNKS",
          version: "1.0.1",
          autoMint: true,
          notes: "Automatic mint after 10 USDC payment via x402scan"
        }
      }
    ]
  };

  // Respond with 402 Payment Required for x402scan schema detection
  return res.status(402).json(response);
}
