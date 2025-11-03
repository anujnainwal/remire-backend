import express from "express"
import { createExchangeRateInternal, getExchangeRatesMarquee } from "../controllers/exchangeRates.controller";
import { getExchangeRates } from "../controllers/sendMoney.controller";
const exchangeRouter = express.Router();

// Order CRUD operations
// exchangeRouter.get("/exchange-rates/fetch", createExchangeRateInternal);
exchangeRouter.get("/exchange-rates", getExchangeRates);

/**
 * @desc Get compact ticker-style data for marquee display
 * @route GET /api/exchange-rates/marquee
 * @query base_code=USD (optional)
 */
exchangeRouter.get("/exchange-rates/marquee", getExchangeRatesMarquee);


export default exchangeRouter;

