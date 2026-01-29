import express from "express";
import path from "path";

const app = express();
const PORT = 5173;

app.use(express.static(path.resolve(".")));

app.listen(PORT, () => {
  console.log(`Frontend running on http://localhost:${PORT}`);
});
