import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import socialAccountsRoutes from "./routes/socialAccountsRoutes.js";
import dotenv from "dotenv";
import dns from "dns";
dotenv.config();
dns.setServers([
  "1.1.1.1",
  "8.8.8.8"
]);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/user", userRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/social-accounts", socialAccountsRoutes);


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
app.get("/", (req, res) => {
  res.send("API is running...");
}
);
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();