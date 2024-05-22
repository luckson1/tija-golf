import express from "express";
import { 
  getAllPackageGroups, 
  getPackageGroup, 
  createPackageGroup, 
  updatePackageGroup, 
  deletePackageGroup 
} from "../controllers/package-groups";

const router = express.Router();

router.get("/packageGroups", getAllPackageGroups);
router.get("/packageGroups/:id", getPackageGroup);
router.post("/packageGroups", createPackageGroup);
router.put("/packageGroups/:id", updatePackageGroup);
router.delete("/packageGroups/:id", deletePackageGroup);

export default router;
