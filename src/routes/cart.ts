// routes/cart.ts
import express from "express";
import {
  createCart,
  getCart,
  updateCart,
  deleteCart,
  getAllCarts,
} from "../controllers/cart";

const cartRoute = express.Router();

cartRoute.post("/", createCart);
cartRoute.get("/:id", getCart);
cartRoute.put("/:id", updateCart);
cartRoute.delete("/:id", deleteCart);
cartRoute.get("/", getAllCarts); //
export default cartRoute;
