import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import subscriptionRoutes from "./routes/subscriptionRoutes";
import swaggerUi from "swagger-ui-express";
import fs from "fs";

dotenv.config();

const app = express();
const swaggerDocument = JSON.parse(fs.readFileSync("./swagger.json", "utf8"));

app.use(express.json());

app.use("/api/subscriptions", subscriptionRoutes);

app.get("/", (_req, res) => {
  res.send("Subscription API is running");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is missing. Please check your .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
