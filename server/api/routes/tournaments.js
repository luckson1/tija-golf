"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tournamentControllers_1 = require("../controllers/tournamentControllers");
const tournamentRoute = express_1.default.Router();
tournamentRoute.post('/', tournamentControllers_1.createTournament);
tournamentRoute.get('/', tournamentControllers_1.getAllTournaments);
tournamentRoute.get('/:id', tournamentControllers_1.getTournament);
tournamentRoute.put('/:id', tournamentControllers_1.updateTournament);
exports.default = tournamentRoute;
