import { z } from "zod";

export const CartCreateSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number(),
      name: z.string(),
      price: z.union([z.number(), z.string()]),
      quantity: z.number().int().nonnegative(),
      src: z.string(),
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

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Create a new cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: number
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: number
 *                     src:
 *                       type: string
 *     responses:
 *       201:
 *         description: Cart created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 usersId:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       productId:
 *                         type: number
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       quantity:
 *                         type: number
 *                       src:
 *                         type: string
 *                 slug:
 *                   type: string
 *                 cartRef:
 *                   type: number
 *                 total:
 *                   type: number
 *                 status:
 *                   type: string
 *                   enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

export const createCart = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const { items } = CartCreateSchema.parse(req?.body);
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price.toString());
      return sum + (isNaN(price) ? 0 : price) * item.quantity;
    }, 0);

    const result = await prisma.$transaction(async (prisma) => {
      const cart = await prisma.cart.create({
        data: {
          usersId,
          total,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              name: item.name,
              price: isNaN(parseFloat(item.price)) ? 0 : parseFloat(item.price),
              quantity: item.quantity,
              src: item.src,
            })),
          },
        },
      });

      const updatedCart = await prisma.cart.update({
        where: { id: cart.id },
        data: {
          slug: `C-${cart.cartRef}`,
        },
        include: {
          items: true,
        },
      });

      return updatedCart;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.log("error", error);
    res.status(400).json({ error: error.message as string });
  }
};

/**
 * @swagger
 * /api/cart/{id}:
 *   get:
 *     summary: Retrieve a cart by its ID
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the cart
 *     responses:
 *       200:
 *         description: The cart details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 usersId:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       productId:
 *                         type: number
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       quantity:
 *                         type: number
 *                       src:
 *                         type: string
 *                 slug:
 *                   type: string
 *                 cartRef:
 *                   type: number
 *                 total:
 *                   type: number
 *                 status:
 *                   type: string
 *                   enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *       400:
 *         description: Bad request
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Internal server error
 */

export const getCart = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const { id } = CartIdSchema.parse(req.params);
    const cart = await prisma.cart.findUnique({
      where: { id },
      include: { items: true },
    });
    res.status(200).json(cart?.status);
  } catch (error: any) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/carts:
 *   get:
 *     summary: Retrieve a list of all carts
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all carts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   usersId:
 *                     type: string
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         productId:
 *                           type: number
 *                         name:
 *                           type: string
 *                         price:
 *                           type: number
 *                         quantity:
 *                           type: number
 *                         src:
 *                           type: string
 *                   slug:
 *                     type: string
 *                   cartRef:
 *                     type: number
 *                   total:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

export const getAllCarts = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const carts = await prisma.cart.findMany({
      include: { items: true },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json(carts);
  } catch (error: any) {
    console.log("error", error);
    res.status(400).json({ error: error.message });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const { items } = CartCreateSchema.parse(req.body);
    const { id } = CartIdSchema.parse(req.params);
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price.toString());
      return sum + (isNaN(price) ? 0 : price) * item.quantity;
    }, 0);
    const cart = await prisma.$transaction(async (prisma) => {
      // First, delete any existing items related to the cart
      await prisma.shoppingItem.deleteMany({
        where: {
          cartId: id,
        },
      });

      // Then, update the cart with the new total and create new items
      return prisma.cart.update({
        where: { id },
        data: {
          total,
          // Use the 'create' operation within 'items' to add new items
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              name: item.name,
              price: isNaN(parseFloat(item.price.toString()))
                ? 0
                : parseFloat(item.price.toString()), // Ensure you set the correct relation field for cartId
              src: item.src,
            })),
          },
        },
        include: { items: true },
      });
    });

    res.status(200).json(cart);
  } catch (error: any) {
    console.log("error", error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteCart = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const { id } = CartIdSchema.parse(req.params);
    await prisma.cart.delete({ where: { id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
