import express from "express";
import {
  createStaticContent,
  deleteStaticContent,
  fetchAllStaticContentByType,
  updateStaticContent,
} from "../controllers";
const staticRouter = express.Router();

// staticRouter.post("/", createStaticContent);
staticRouter.get("/all", fetchAllStaticContentByType);
staticRouter.put("/update", updateStaticContent);
staticRouter.delete("/:id", deleteStaticContent);

export default staticRouter;
