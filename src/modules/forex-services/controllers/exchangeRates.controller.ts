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

// export const getExchangeRates = async (req: Request, res: Response) => {
//   try {
//     const { base_code, limit = 10, page = 1 } = req.query;

//     const filter: any = {};
//     if (base_code) {
//       filter.base_code = String(base_code).toUpperCase();
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     const [records, total] = await Promise.all([
//       ExchangeRateModel.find(filter)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit))
//         .lean(),
//       ExchangeRateModel.countDocuments(filter),
//     ]);

//     return responseHelper.success(res, {
      
//        records,
//        total,
//       page: Number(page),
//       limit: Number(limit),
//     },"Ftech latest exhcange result/");
//   } catch (error: any) {
//     console.error("getExchangeRates error:", error);
//     return responseHelper.serverError(res, "Error fetching exchange rate list.");
//   }
// };

export const getExchangeRates = async (req: Request, res: Response) => {
  try {
    const {
      limit = 10,
      page = 1,
      base_code,
      target_code,
      date_from,
      date_to,
      min_rate,
      max_rate,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build a match filter from query params (date range, optional base_code)
    // We won't hardcode USD or any base here — we'll read distinct bases from DB.
    const matchFilter: any = {};
    if (base_code) matchFilter.base_code = String(base_code).toUpperCase();
    if (date_from || date_to) {
      matchFilter.createdAt = {};
      if (date_from) matchFilter.createdAt.$gte = new Date(String(date_from));
      if (date_to) matchFilter.createdAt.$lte = new Date(String(date_to));
    }

    // Aggregate latest document per base_code to ensure uniqueness per base
    const aggregatePipeline: any[] = [
      { $match: matchFilter },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$base_code",
          latestRecord: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$latestRecord" } },
      { $skip: skip },
      { $limit: Number(limit) },
    ];

    const countPipeline: any[] = [
      { $match: matchFilter },
      { $group: { _id: "$base_code" } },
      { $count: "total" },
    ];

    const [records, countResult] = await Promise.all([
      ExchangeRateModel.aggregate(aggregatePipeline),
      ExchangeRateModel.aggregate(countPipeline),
    ]);

    const total = Array.isArray(countResult) && countResult.length > 0 ? countResult[0].total : 0;

    // Target currency (default to INR)
    const target = target_code ? String(target_code).toUpperCase() : "INR";

    // If user requested a target other than INR but the endpoint is intended
    // for INR-centric results, return empty result set.
    // (Alternatively we could support any target; adjust if needed.)
    // For now, we'll honor any target but the transformation below will ensure
    // each record's conversion_rates contains only a single key: the target.

    // Ensure uniqueness (aggregation already grouped by base_code). Now filter
    // records to only those that include the target in their conversion_rates
    const filtered = records
      .map((rec) => {
        const base = String(rec.base_code).toUpperCase();
        if (base === target) return null; // omit the target as a base
        const rateVal = rec.conversion_rates ? rec.conversion_rates[target] : undefined;
        const rate = typeof rateVal === "number" ? rateVal : Number(rateVal);
        if (!isFinite(rate)) return null;
        if ((min_rate && rate < Number(min_rate)) || (max_rate && rate > Number(max_rate))) return null;

        return {
          base_code: base,
          conversion_rates: { [target]: rate },
          createdAt: rec.createdAt,
          lastUpdatedAt: rec.lastUpdatedAt,
          provider: rec.provider,
        };
      })
      .filter(Boolean) as any[];

    if (!filtered.length) {
      return responseHelper.notFound(res, `No exchange rate data found for target ${target}.`);
    }

    return responseHelper.success(res, {
      total: filtered.length,
      page: Number(page),
      limit: Number(limit),
      filters: { base_code, target_code: target, date_from, date_to, min_rate, max_rate },
      records: filtered,
    }, `Fetched exchange rate results for target ${target}.`);
  } catch (error: any) {
    console.error("getExchangeRates error:", error);
    return responseHelper.serverError(res, "Error fetching INR exchange rate list.");
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

    // Determine which base codes to fetch. If base_code query is provided, use it;
    // otherwise use the configured BASE_CURRENCY_LIST from env. We'll always
    // include INR in the fetched set so we can compute reciprocals when needed.
    let baseCodes: string[] = [];
    if (base_code) {
      baseCodes = [String(base_code).toUpperCase()];
    } else {
      const envList = process.env.BASE_CURRENCY_LIST || "";
      baseCodes = envList.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
    }

    // ensure INR is present so we can derive reciprocal rates if a base doesn't include INR
    if (!baseCodes.includes("INR")) baseCodes.push("INR");

    // Aggregate latest record per requested base code
    const records = await ExchangeRateModel.aggregate([
      { $match: { base_code: { $in: baseCodes } } },
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


    // Build a map of base_code -> conversion_rates for quick lookup
    const recordMap: Record<string, any> = {};
    for (const r of records) {
      recordMap[String(r._id).toUpperCase()] = r.latestRecord.conversion_rates || {};
    }

    // We want only pairs that involve INR. For each configured base (except INR)
    // we will produce two entries: BASE/INR (direct) and INR/BASE (reciprocal).
    const requestedBases = baseCodes.filter((c) => c !== "INR");
    const marqueeData: Array<{ pair: string; rate: number }> = [];

    for (const base of requestedBases) {
      const ratesForBase = recordMap[base];
      const inrRateFromBase = ratesForBase ? ratesForBase["INR"] : undefined;

      if (typeof inrRateFromBase === "number" && isFinite(inrRateFromBase) && inrRateFromBase !== 0) {
        // base -> INR
        marqueeData.push({ pair: `${base}/INR`, rate: inrRateFromBase });
        // INR -> base (reciprocal)
        marqueeData.push({ pair: `INR/${base}`, rate: 1 / inrRateFromBase });
        continue;
      }

      // If the base record doesn't contain INR, try to use the INR record (if present)
      const ratesForINR = recordMap["INR"];
      const rateFromINRToBase = ratesForINR ? ratesForINR[base] : undefined;
      if (typeof rateFromINRToBase === "number" && isFinite(rateFromINRToBase) && rateFromINRToBase !== 0) {
        // INR -> base is available; use it directly and derive reciprocal
        marqueeData.push({ pair: `INR/${base}`, rate: rateFromINRToBase });
        marqueeData.push({ pair: `${base}/INR`, rate: 1 / rateFromINRToBase });
        continue;
      }

      // If neither direct nor inverse rates are available, skip this base
    }

    return responseHelper.success(res, {
      count: marqueeData.length,
      data: marqueeData,
    });
  } catch (error: any) {
    console.error("getExchangeRatesMarquee error:", error);
    return responseHelper.serverError(res, "Error generating marquee exchange rate data.");
  }
};