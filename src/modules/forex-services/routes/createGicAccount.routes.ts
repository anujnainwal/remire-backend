import { Router } from "express";
import {
  createGicAccountRequest,
  getGicAccountRequests,
  getGicAccountRequest,
  updateGicAccountRequestStatus,
} from "../controllers/createGicAccount.controller";
import authGuard from "../../../middlewares/auth.middleware";
import { upload } from "../../../middlewares/multer.middleware";

const router = Router();

router.use(authGuard); // All routes require authentication
router.post("/create-gic-account",upload.fields([{
  name:"offerLetter",
  maxCount:1
},{
  name:"passportCopy",
  maxCount:1
}]) ,createGicAccountRequest);
router.get("/create-gic-account", getGicAccountRequests);
router.get("/create-gic-account/:id", getGicAccountRequest);
router.patch("/create-gic-account/:id", upload.fields([{
  name:"offerLetter",
  maxCount:1
},{
  name:"passportCopy",
  maxCount:1
}]) ,updateGicAccountRequestStatus);

export default router;

