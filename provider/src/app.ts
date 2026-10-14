import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";
import providerRoutes from "./routes/providerRoutes.js";

const app = express();

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "hunar-provider",
    status: "healthy",
  });
});

app.use("/api/provider", providerRoutes);

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  console.error("Provider error:", error);

  res.status(500).json({
    success: false,
    message: "Internal provider error",
  });
};

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
