import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Request, Response } from "express";
import { getUser } from "../utils";
const prisma = new PrismaClient();

const partnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  image: z.string(),
  email: z.string().email(),
  phone: z.string(),
  location: z.string(),
  website: z.string().url(),
});

/**
 * @swagger
 * /api/partners:
 *   post:
 *     summary: Create a new partner
 *     tags: [Partners]
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
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: url
 *     responses:
 *       201:
 *         description: Partner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 image:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 phone:
 *                   type: string
 *                 location:
 *                   type: string
 *                 website:
 *                   type: string
 *                   format: url
 */
export const createPartner = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const partnerData = partnerSchema.parse(req.body);
    const newPartner = await prisma.partner.create({
      data: {
        ...partnerData,
      },
    });
    res.status(201).json(newPartner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.log(error);
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/partners:
 *   get:
 *     summary: Get all partners
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all partners
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
 *                   description:
 *                     type: string
 *                   image:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *                   location:
 *                     type: string
 *                   website:
 *                     type: string
 *                     format: url
 */
export const getAllPartners = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const partners = await prisma.partner.findMany();
    res.status(200).json(partners);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/partners/{id}:
 *   get:
 *     summary: Get a partner by ID
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the partner
 *     responses:
 *       200:
 *         description: Partner details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 image:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 phone:
 *                   type: string
 *                 location:
 *                   type: string
 *                 website:
 *                   type: string
 *                   format: url
 *       404:
 *         description: Partner not found
 */
export const getPartner = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const { id } = req.params;
    const partner = await prisma.partner.findUnique({
      where: { id },
    });
    if (!partner) return res.status(404).send("Partner not found");
    res.status(200).json(partner);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/partners/{id}:
 *   put:
 *     summary: Update a partner by ID
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the partner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: url
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 image:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 phone:
 *                   type: string
 *                 location:
 *                   type: string
 *                 website:
 *                   type: string
 *                   format: url
 *       404:
 *         description: Partner not found
 */
export const updatePartner = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const { id } = req.params;
    const partnerData = partnerSchema.parse(req.body);
    const updatedPartner = await prisma.partner.update({
      where: { id },
      data: {
        ...partnerData,
      },
    });
    res.status(200).json(updatedPartner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }

    console.log(error);
    res.status(500).send(error);
  }
};
