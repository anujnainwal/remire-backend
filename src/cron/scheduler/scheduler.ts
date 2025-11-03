import cron from "node-cron";
import { fetchAndSaveExchangeRates } from "../job/exchangeRate.job";

export const startCronJobs = () => {
  console.log("[🕒] Scheduler initialized...");

  // Run 5 times per day (midnight, 5 AM, 10 AM, 3 PM, 8 PM)
  const cronTimes = ["0 0 * * *", "0 5 * * *", "0 10 * * *", "0 15 * * *", "0 20 * * *"];

  cronTimes.forEach((pattern) => {
    cron.schedule(pattern, async () => {
      console.log(`[🚀] Running scheduled Exchange Rate update (${pattern})...`);
      try {
        await fetchAndSaveExchangeRates();
        console.log("[✅] Exchange Rate cron completed successfully.");
      } catch (error) {
        console.error("[❌] Exchange Rate cron failed:", error);
      }
    });
  });

  console.log(`[📅] Exchange Rate cron scheduled 5 times per day: ${cronTimes.join(", ")}`);
};
