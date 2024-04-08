import { z } from "zod";

export const CartCreateSchema = z.object({
  userId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number().int().nonnegative(),
    })
  ),
});

export const CartUpdateSchema = CartCreateSchema.partial();

export const CartIdSchema = z.object({
  id: z.string(),
});

import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { getUser } from "../utils";

const prisma = new PrismaClient();

export const createCart = async (req: Request, res: Response) => {
  const token = req.headers.authorization;

  if (!token) return res.status(403).send("Forbidden");
  const usersId = await getUser(token);
  if (!usersId) return res.status(401).send("Unauthorised");
  try {
    const { items } = CartCreateSchema.parse(req.body);
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const result = await prisma.$transaction(async (prisma) => {
      const cart = await prisma.cart.create({
        data: {
          usersId,
          total,
          items: {
            create: items,
          },
        },
      });

      const updatedCart = await prisma.cart.update({
        where: { id: cart.id },
        data: {
          slug: `C-${cart.cartRef}`,
        },
      });

      return updatedCart;
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message as string });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const { id } = CartIdSchema.parse(req.params);
    const cart = await prisma.cart.findUnique({ where: { id } });
    res.status(200).json(cart);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  const token = req.headers.authorization;

  if (!token) return res.status(403).send("Forbidden");
  const usersId = await getUser(token);
  if (!usersId) return res.status(401).send("Unauthorised");
  try {
    const { items } = CartCreateSchema.parse(req.body);
    const { id } = CartIdSchema.parse(req.params);
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    // First, delete any existing items related to the cart
    await prisma.shoppingItem.deleteMany({
      where: {
        cartId: id,
      },
    });

    // Then, update the cart with the new total and create new items
    const cart = await prisma.cart.update({
      where: { id },
      data: {
        total,
        // Use the 'create' operation within 'items' to add new items
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
            cartId: id, // Ensure you set the correct relation field for cartId
          })),
        },
      },
    });

    res.status(200).json(cart);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCart = async (req: Request, res: Response) => {
  try {
    const { id } = CartIdSchema.parse(req.params);
    await prisma.cart.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
