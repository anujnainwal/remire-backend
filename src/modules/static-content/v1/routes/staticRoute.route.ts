import express from "express";
import {
  createStaticContent,
  deleteStaticContent,
  fetchAllStaticContentByType,
  updateStaticContent,
} from "../controllers";
import faqRouter from "./faq.routes";

const staticRouter = express.Router();

staticRouter.use("/faq", faqRouter);

// staticRouter.post("/", createStaticContent);
staticRouter.get("/all", fetchAllStaticContentByType);
staticRouter.put("/update", updateStaticContent);
staticRouter.delete("/:id", deleteStaticContent);

export default staticRouter;
