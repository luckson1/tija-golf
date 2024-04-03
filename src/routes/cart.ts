// routes/cart.ts
import express from "express";
import {
  createCart,
  getCart,
  updateCart,
  deleteCart,
} from "../controllers/cart";

const cartRoute = express.Router();

cartRoute.post("/", createCart);
cartRoute.get("/:id", getCart);
cartRoute.put("/:id", updateCart);
cartRoute.delete("/:id", deleteCart);

export default cartRoute;
