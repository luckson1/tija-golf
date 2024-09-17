import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import { getUser } from "../utils";

const prisma = new PrismaClient();

// Zod schema for package validation
const packageSchema = z.object({
  price: z.number().int().nonnegative(),
  name: z.string(),
  listedEventId: z.string(),
  packageGroupId: z.string(),
});

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: Get all packages
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all packages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   amount:
 *                     type: string
 *                   price:
 *                     type: number
 *                   name:
 *                     type: string
 *                   listedEventId:
 *                     type: string
 *                   packageGroupId:
 *                     type: string
 */
export const getAllPackages = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const packages = await prisma.package.findMany();
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/packages/{id}:
 *   get:
 *     summary: Get a package by ID
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the package
 *     responses:
 *       200:
 *         description: Package details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 amount:
 *                   type: string
 *                 price:
 *                   type: number
 *                 name:
 *                   type: string
 *                 listedEventId:
 *                   type: string
 *                 packageGroupId:
 *                   type: string
 *       404:
 *         description: Package not found
 */
export const getPackage = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const { id } = req.params;
    const packageData = await prisma.package.findUnique({
      where: { id },
    });

    if (!packageData) {
      return res.status(404).send("Package not found");
    }

    res.status(200).json(packageData);
  } catch (error) {
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/packages:
 *   post:
 *     summary: Create a new package
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *               price:
 *                 type: number
 *               name:
 *                 type: string
 *               listedEventId:
 *                 type: string
 *               packageGroupId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Package created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 amount:
 *                   type: string
 *                 price:
 *                   type: number
 *                 name:
 *                   type: string
 *                 listedEventId:
 *                   type: string
 *                 packageGroupId:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export const createPackage = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const data = packageSchema.parse(req.body);

    const newPackage = await prisma.package.create({
      data: {
        ...data,
        amount: "0",
      },
    });

    res.status(201).json(newPackage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/packages/{id}:
 *   put:
 *     summary: Update a package by ID
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the package
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *               price:
 *                 type: number
 *               name:
 *                 type: string
 *               listedEventId:
 *                 type: string
 *               packageGroupId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Package updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 amount:
 *                   type: string
 *                 price:
 *                   type: number
 *                 name:
 *                   type: string
 *                 listedEventId:
 *                   type: string
 *                 packageGroupId:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Package not found
 *       500:
 *         description: Internal server error
 */
export const updatePackage = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const { id } = req.params;
    const data = packageSchema.parse(req.body);

    const updatedPackage = await prisma.package.update({
      where: { id },
      data,
    });

    res.status(200).json(updatedPackage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }

    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/packages/{id}:
 *   delete:
 *     summary: Delete a package by ID
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the package
 *     responses:
 *       204:
 *         description: Package deleted successfully
 *       404:
 *         description: Package not found
 *       500:
 *         description: Internal server error
 */
export const deletePackage = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const { id } = req.params;

    await prisma.package.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).send(error);
  }
};
