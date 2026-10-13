import express from "express";
import cors from "cors";
import candidateRoutes from "./routes/candidateRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Hunar API is running",
  });
});

app.use("/api/candidates", candidateRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
