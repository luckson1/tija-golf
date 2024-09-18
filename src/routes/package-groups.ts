import express from "express";
import {
  getAllPackageGroups,
  getPackageGroup,
  createPackageGroup,
  updatePackageGroup,
  deletePackageGroup,
} from "../controllers/package-groups";

const router = express.Router();

router.get("/", getAllPackageGroups);
router.get("//:id", getPackageGroup);
router.post("/", createPackageGroup);
router.put("//:id", updatePackageGroup);
router.delete("//:id", deletePackageGroup);

export default router;
