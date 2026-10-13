import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = Number(process.env.PORT) || 4000;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Hunar API is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Hunar API:", error);
    process.exit(1);
  }
}

void startServer();
