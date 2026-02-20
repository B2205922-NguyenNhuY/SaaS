const express = require("express");
const cors = require("cors");
require("dotenv").config();

const apiRoutes = require("./routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port", process.env.PORT || 3000);
});
