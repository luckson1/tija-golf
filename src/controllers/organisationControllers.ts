import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { getUser } from "../utils";
import { z } from "zod";

const prisma = new PrismaClient();

const organizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().url("Image must be a valid URL"),
  location: z.string().min(1, "Location is required"),
  kitPrice: z.number().int().min(0, "Kit price must be a non-negative integer"),
  teePrice: z.number().min(0, "Tee price must be a non-negative number"),
  holesPrices: z.array(
    z.object({
      amount: z.number().min(0, "Amount must be a non-negative number"),
      numberOfHoles: z.enum(["Nine", "Eighteen"]),
    })
  ),
  kitsPrices: z.array(
    z.object({
      amount: z.number().min(0, "Amount must be a non-negative number"),
    })
  ),
});

/**
 * @swagger
 * /api/organization/all:
 *   get:
 *     summary: Retrieve a list of all organisations
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all organisations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   image:
 *                     type: string
 *                   location:
 *                     type: string
 *                   kitPrice:
 *                     type: integer
 *                   teePrice:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const getAllOrganisations = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);

    if (!usersId) return res.status(401).send("Unauthorized");
    const organizations = await prisma.organization.findMany();

    res.json(organizations);
  } catch (error) {
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/organization:
 *   post:
 *     summary: Create a new organization
 *     tags: [Organization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the organization
 *                 example: "Golf Club"
 *               image:
 *                 type: string
 *                 description: The URL of the organization's image
 *                 example: "http://example.com/image.png"
 *               location:
 *                 type: string
 *                 description: The location of the organization
 *                 example: "New York"
 *               kitPrice:
 *                 type: integer
 *                 description: The price of the kit
 *                 example: 100
 *               teePrice:
 *                 type: number
 *                 description: The price of the tee
 *                 example: 50.5
 *               holesPrices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                       description: The amount for the holes price
 *                       example: 20
 *                     numberOfHoles:
 *                       type: string
 *                       enum: [Nine, Eighteen]
 *                       description: The number of holes
 *                       example: "Nine"
 *               kitsPrices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                       description: The amount for the kit price
 *                       example: 30
 *     responses:
 *       201:
 *         description: The created organization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 image:
 *                   type: string
 *                 location:
 *                   type: string
 *                 kitPrice:
 *                   type: integer
 *                 teePrice:
 *                   type: number
 *                 holesPrices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                       numberOfHoles:
 *                         type: string
 *                         enum: [Nine, Eighteen]
 *                 kitsPrices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    // Validate the input using Zod
    const data = organizationSchema.parse(req.body);

    // Create the organization in the database
    const newOrganization = await prisma.organization.create({
      data: {
        name: data.name,
        image: data.image,
        location: data.location,
        kitPrice: data.kitPrice,
        teePrice: data.teePrice,
        HolesPrices: {
          create: data.holesPrices.map((holePrice) => ({
            amount: holePrice.amount,
            numberOfHoles: holePrice.numberOfHoles,
          })),
        },
        KitPrices: {
          create: data.kitsPrices.map((kitPrice) => ({
            amount: kitPrice.amount,
          })),
        },
      },
    });

    // Send the created organization as a response
    res.status(201).json(newOrganization);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    res.status(500).send(error);
  }
};
