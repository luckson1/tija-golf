import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { getUser } from "../utils";

export type ProfileInput = z.infer<typeof profileSchema>;

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the user
 *           example: "John Doe"
 *         email:
 *           type: string
 *           description: The email of the user
 *           example: "john.doe@example.com"
 *         phoneNumber:
 *           type: string
 *           description: The phone number of the user
 *           example: "+1234567890"
 *         gender:
 *           type: string
 *           enum: [male, female]
 *           description: The gender of the user
 *           example: "male"
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           description: The date of birth of the user
 *           example: "1990-01-01T00:00:00.000Z"
 *         cohort:
 *           type: integer
 *           description: The cohort number of the user
 *           example: 1
 *         countryCode:
 *           type: string
 *           description: The country code of the user
 *           example: "254"
 */

/**
 * @swagger
 * /api/profile/create:
 *   post:
 *     summary: Create a new profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Profile'
 *     responses:
 *       200:
 *         description: The created profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 * /api/profile/edit:
 *   put:
 *     summary: Edit an existing profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Profile'
 *     responses:
 *       200:
 *         description: The updated profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Fetch the profile of the authenticated user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The profile of the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string().datetime(),
  cohort: z.number().min(1, "Cohort is required"),
  countryCode: z.string(),
});
const prisma = new PrismaClient();

export const createProfile = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const validBody = profileSchema.parse(req.body);
    const data = { ...validBody, usersId };
    const profile = await prisma.profile.create({ data });

    res.status(200).json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation errors", errors: error.errors });
    }
    res.status(500).json({ message: "Error creating profile", error });
  }
};

export const fetchProfile = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const profile = await prisma.profile.findUnique({
      where: {
        usersId,
      },
    });

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
};

export const editProfile = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const validBody = profileSchema.parse(req.body);
    const data = { ...validBody, usersId };

    const profile = await prisma.profile.update({
      where: { usersId },
      data,
    });

    res.status(200).json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).json({ message: "Error updating profile", error });
  }
};
