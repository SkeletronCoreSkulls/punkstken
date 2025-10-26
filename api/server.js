import express from "express";
import x402 from "./x402.js";
import notify from "./nft/notify.js";

const app = express();
app.use(express.json());

// mimic vercel routes
app.get("/api/x402", x402);
app.post("/api/nft/notify", notify);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
