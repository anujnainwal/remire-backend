import { Router } from "express";
import {
  createGicAccountRequest,
  getGicAccountRequests,
  getGicAccountRequest,
  updateGicAccountRequestStatus,
  checkGicAccountStatus,
} from "../controllers/createGicAccount.controller";
import authGuard from "../../../middlewares/auth.middleware";
import { upload } from "../../../middlewares/multer.middleware";
import { responseHelper } from "../../../utils/responseHelper";

const router = Router();

router.use(authGuard); // All routes require authentication

// Multer error handling middleware
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return responseHelper.badRequest(res, 'File too large. Maximum size is 10MB per file.');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return responseHelper.badRequest(res, 'Too many files. Maximum 10 files allowed.');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return responseHelper.badRequest(res, 'Unexpected field name in file upload.');
    }
    return responseHelper.badRequest(res, err.message || 'File upload error.');
  }
  next();
};

// Check if user has existing GIC account request
router.get("/create-gic-account/status", checkGicAccountStatus);

router.post("/create-gic-account", 
  upload.fields([{
    name:"offerLetter",
    maxCount:1
  },{
    name:"passportCopy",
    maxCount:1
  }]),
  handleMulterError,
  createGicAccountRequest
);

router.get("/create-gic-account", getGicAccountRequests);
router.get("/create-gic-account/:id", getGicAccountRequest);

router.patch("/create-gic-account/:id", 
  upload.fields([{
    name:"offerLetter",
    maxCount:1
  },{
    name:"passportCopy",
    maxCount:1
  }]),
  handleMulterError,
  updateGicAccountRequestStatus
);

export default router;

