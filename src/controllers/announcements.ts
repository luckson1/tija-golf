import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Request, Response } from "express"; // Assuming you have a getUser function to validate tokens
import { getUser } from "../utils";

const prisma = new PrismaClient();

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   content:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   isActive:
 *                     type: boolean
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const announcements = await prisma.announcement.findMany();
    res.status(200).json(announcements);
  } catch (error: any) {
    console.log("error", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: Get an announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The announcement ID
 *     responses:
 *       200:
 *         description: The announcement description by ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 isActive:
 *                   type: boolean
 *       400:
 *         description: Bad request
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Internal server error
 */
export const getAnnouncementById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    res.status(200).json(announcement);
  } catch (error: any) {
    console.log("error", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: The announcement was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 isActive:
 *                   type: boolean
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

const AnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const { title, content } = AnnouncementSchema.parse(req.body);

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content,
      },
    });
    res.status(201).json(newAnnouncement);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json(error.errors);
    } else {
      console.log("error", error);
      res.status(400).json({ error: error.message });
    }
  }
};

/**
 * @swagger
 * /announcements/{id}:
 *   put:
 *     summary: Update an announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: The announcement was successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 isActive:
 *                   type: boolean
 *       400:
 *         description: Bad request
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Internal server error
 */
const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  isActive: z.boolean(),
});

export const updateAnnouncement = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const { title, content, isActive } = UpdateAnnouncementSchema.parse(
      req.body
    );

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        isActive,
      },
    });
    res.status(200).json(updatedAnnouncement);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json(error.errors);
    } else {
      console.log("error", error);
      res.status(400).json({ error: error.message });
    }
  }
};

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Delete an announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The announcement ID
 *     responses:
 *       204:
 *         description: The announcement was successfully deleted
 *       400:
 *         description: Bad request
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Internal server error
 */
export const deleteAnnouncement = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    await prisma.announcement.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    console.log("error", error);
    res.status(400).json({ error: error.message });
  }
};
