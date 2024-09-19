import express from "express";
import { editLeaderboardPoint } from "../controllers/leaderboardpoint";

const leaderboardPointRoute = express.Router();

leaderboardPointRoute.put("/:id", editLeaderboardPoint);

export default leaderboardPointRoute;
