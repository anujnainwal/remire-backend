// controllers/exchangeRateController.ts

import { Request, Response } from "express";
import axios from "axios";
import ExchangeRateModel from "../models/ExchangeRate.model";
import exhcangeRateConfig from "../../../config/exchangeRateConfig";
import { responseHelper } from "../../../utils/responseHelper";

export const createExchangeRateInternal = async (_req: Request, res: Response) => {
  try {
    const base_code_env = process.env.BASE_CURRENCY_LIST;
    if (!base_code_env) {
      console.error(`[❌] Missing BASE_CURRENCY_LIST in environment`);
      return responseHelper.badRequest(res, `"BASE_CURRENCY_LIST" environment variable is required.`);
    }

    // BASE_CURRENCY_LIST may contain multiple codes: e.g., "USD,EUR,CAD,AUD,GBP"
    const baseCodes = base_code_env.split(",").map((c) => c.trim().toUpperCase());

    console.log(`[🌍] Starting exchange rate fetch for base currencies: ${baseCodes.join(", ")}`);

    const records = [];
    const startGlobal = Date.now();

    for (const base_code of baseCodes) {
      const start = Date.now();
      const url = `${exhcangeRateConfig.URL}/v6/${exhcangeRateConfig.Api}/latest/${base_code}`;

      console.log(`[📡] Fetching exchange rates for ${base_code} from: ${url}`);

      try {
        const response = await axios.get(url);
        const fetchDurationMs = Date.now() - start;
        const data = response.data;

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
          `[✅] ${base_code} saved successfully | ${Object.keys(data.conversion_rates).length} currencies | ${fetchDurationMs}ms`
        );

        records.push(record);
      } catch (fetchErr: any) {
        console.error(`[❌] Error fetching ${base_code}: ${fetchErr.message}`);
      }
    }

    const totalTime = Date.now() - startGlobal;
    console.log(`[🏁] All exchange rate updates completed in ${totalTime}ms`);

    return responseHelper.success(res, {
      totalCurrencies: baseCodes.length,
      totalTimeMs: totalTime,
      savedRecords: records.length,
      data: records,
    });
  } catch (error: any) {
    console.error("createExchangeRateInternal global error:", error);
    return responseHelper.serverError(res, "Error fetching & saving exchange rates.");
  }
};

export const getExchangeRates = async (req: Request, res: Response) => {
  try {
    const { base_code, limit = 10, page = 1 } = req.query;

    const filter: any = {};
    if (base_code) {
      filter.base_code = String(base_code).toUpperCase();
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total] = await Promise.all([
      ExchangeRateModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ExchangeRateModel.countDocuments(filter),
    ]);

    return responseHelper.success(res, {
      total,
      page: Number(page),
      limit: Number(limit),
      data: records,
    });
  } catch (error: any) {
    console.error("getExchangeRates error:", error);
    return responseHelper.serverError(res, "Error fetching exchange rate list.");
  }
};

/**
 * @desc Get latest exchange rates in lightweight marquee format
 * @route GET /api/exchange-rates/marquee
 * @query base_code=USD (optional)
 */
export const getExchangeRatesMarquee = async (req: Request, res: Response) => {
  try {
    const { base_code } = req.query;
    const filter: any = {};

    if (base_code) {
      filter.base_code = String(base_code).toUpperCase();
    }

    // Find the latest record per base currency
    const records = await ExchangeRateModel.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$base_code",
          latestRecord: { $first: "$$ROOT" },
        },
      },
    ]);

    if (!records.length) {
      return responseHelper.notFound(res, "No exchange rate data found.");
    }

    // Transform data for a front-end ticker/marquee
    const marqueeData = records.flatMap((r) => {
      const base = r._id;
      const rates = r.latestRecord.conversion_rates;
      const formattedRates = [];

      // Pick top 10 currencies for visual clarity
      const topCurrencies = Object.keys(rates).slice(0, 10);

      for (const target of topCurrencies) {
        formattedRates.push({
          pair: `${base}/${target}`,
          rate: rates[target],
        });
      }

      return formattedRates;
    });

    return responseHelper.success(res, {
      count: marqueeData.length,
      data: marqueeData,
    });
  } catch (error: any) {
    console.error("getExchangeRatesMarquee error:", error);
    return responseHelper.serverError(res, "Error generating marquee exchange rate data.");
  }
};