import express from "express";
import {
  createProfile,
  editProfile,
  fetchProfile,
} from "../controllers/profileControllers";

const profileRoute = express.Router();

profileRoute.post("/create", createProfile);
profileRoute.put("/", editProfile);
profileRoute.get("/", fetchProfile);

export default profileRoute;
