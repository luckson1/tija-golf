import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import { getUser } from "../utils";

const prisma = new PrismaClient();

const packageGroupSchema = z.object({
  name: z.string(),
  listedEventId: z.string(),
});

/**
 * @swagger
 * /api/packageGroups:
 *   get:
 *     summary: Retrieve a list of all package groups
 *     tags: [PackageGroup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all package groups
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
 *                   listedEventId:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getAllPackageGroups = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const packageGroups = await prisma.packageGroup.findMany();
    res.status(200).json(packageGroups);
  } catch (error) {
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/packageGroups/{id}:
 *   get:
 *     summary: Retrieve a single package group by ID
 *     tags: [PackageGroup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the package group
 *     responses:
 *       200:
 *         description: A single package group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 listedEventId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Package group not found
 *       500:
 *         description: Internal server error
 */
export const getPackageGroup = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const { id } = req.params;
    const packageGroup = await prisma.packageGroup.findUnique({
      where: { id },
    });

    if (!packageGroup) {
      return res.status(404).send("Package group not found");
    }

    res.status(200).json(packageGroup);
  } catch (error) {
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/packageGroups:
 *   post:
 *     summary: Create a new package group
 *     tags: [PackageGroup]
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
 *               listedEventId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Package group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 listedEventId:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const createPackageGroup = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const data = packageGroupSchema.parse(req.body);

    const newPackageGroup = await prisma.packageGroup.create({
      data,
    });

    res.status(201).json(newPackageGroup);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/packageGroups/{id}:
 *   put:
 *     summary: Update a package group by ID
 *     tags: [PackageGroup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the package group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               listedEventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Package group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 listedEventId:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Package group not found
 *       500:
 *         description: Internal server error
 */
export const updatePackageGroup = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const { id } = req.params;
    const data = packageGroupSchema.parse(req.body);

    const updatedPackageGroup = await prisma.packageGroup.update({
      where: { id },
      data,
    });

    res.status(200).json(updatedPackageGroup);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }

    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/packageGroups/{id}:
 *   delete:
 *     summary: Delete a package group by ID
 *     tags: [PackageGroup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the package group
 *     responses:
 *       204:
 *         description: Package group deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Package group not found
 *       500:
 *         description: Internal server error
 */
export const deletePackageGroup = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const { id } = req.params;

    await prisma.packageGroup.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).send(error);
  }
};
