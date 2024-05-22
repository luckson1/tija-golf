import express from "express";
import {
  createOrganization,
  getAllOrganisations,
} from "../controllers/organisationControllers";

const orgRoute = express.Router();
orgRoute.post("/", createOrganization);
orgRoute.get("/", getAllOrganisations);

export default orgRoute;
