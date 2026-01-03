import axios from "axios";
import exhcangeRateConfig from "../../config/exchangeRateConfig";
import ExchangeRateModel from "../../modules/forex-services/models/ExchangeRate.model";

export const fetchAndSaveExchangeRates = async () => {
  const base_code_env = process.env.BASE_CURRENCY_LIST;
  if (!base_code_env) {
    throw new Error(`"BASE_CURRENCY_LIST" environment variable is required.`);
  }

  // Split, trim, uppercase, and remove empty values
  const baseCodes = base_code_env
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c.length > 0);

  if (baseCodes.length === 0) {
    throw new Error("No valid base currencies found in BASE_CURRENCY_LIST.");
  }

  console.log(`[🌍] Starting exchange rate fetch for: ${baseCodes.join(", ")}`);

  const records: any[] = [];
  const startGlobal = Date.now();

  for (const base_code of baseCodes) {
    const start = Date.now();
    const url = `${exhcangeRateConfig.URL}/${exhcangeRateConfig.Api}/latest/${base_code}`;
    console.log(`[📡] Fetching exchange rates for ${base_code} → ${url}`);

    try {
      const response = await axios.get(url);
      const data = response.data;
      const fetchDurationMs = Date.now() - start;

      if (data.result !== "success") {
        console.warn(`[⚠️] Failed for ${base_code}: ${data["error-type"]}`);
        continue;
      }

      const record = await ExchangeRateModel.create({
        base_code,
        provider: exhcangeRateConfig.Provider,
        conversion_rates: data.conversion_rates,
        lastUpdatedAt: new Date(data.time_last_update_utc || Date.now()),
        requestCount: 1,
        success: true,
        meta: {
          apiVersion: data.version || "v6",
          fetchDurationMs,
          environment: process.env.NODE_ENV || "production",
        },
      });

      console.log(
        `[✅] ${base_code} saved | ${Object.keys(data.conversion_rates).length} currencies | ${fetchDurationMs}ms`
      );

      records.push(record);
    } catch (err: any) {
      console.error(`[❌] Error fetching ${base_code}: ${err.message}`);
    }
  }

  const totalTime = Date.now() - startGlobal;
  console.log(`[🏁] Completed all exchange rate updates in ${totalTime}ms`);

  return {
    totalCurrencies: baseCodes.length,
    totalTimeMs: totalTime,
    savedRecords: records.length,
    data: records,
  };
};
