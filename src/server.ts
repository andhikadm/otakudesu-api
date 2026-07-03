import express from "express";
import { PORT } from "./config.js";
import { router } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(router);

app.listen(PORT, () => {
  console.log(`Otakudesu API listening on http://localhost:${PORT}`);
});
