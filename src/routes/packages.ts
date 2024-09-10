import express from "express";
import { getAllPackages, getPackage, createPackage, updatePackage, deletePackage } from "../controllers/packages";

const router = express.Router();

router.get("/packages", getAllPackages);
router.get("/packages/:id", getPackage);
router.post("/packages", createPackage);
router.put("/packages/:id", updatePackage);
router.delete("/packages/:id", deletePackage);

export default router;

