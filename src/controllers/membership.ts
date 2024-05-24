import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const membershipSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usersId: z.string(),
  profileId: z.string(),
  feeAmount: z.number(),
  dueDate: z.string().datetime(),
  paymentStatus: z.enum([
    "Pending",
    "Completed",
    "Failed",
    "Refunded",
    "Partial",
    "Expired",
    "Received",
    "Rejected",
    "Accepted",
  ]),
});

/**
 * @swagger
 * /api/membership:
 *   post:
 *     summary: Create a new membership
 *     tags: [Membership]
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
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               usersId:
 *                 type: string
 *               profileId:
 *                 type: string
 *               feeAmount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               paymentStatus:
 *                 type: string
 *                 enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *     responses:
 *       201:
 *         description: Membership created successfully
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
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 usersId:
 *                   type: string
 *                 profileId:
 *                   type: string
 *                 feeAmount:
 *                   type: number
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *                 paymentStatus:
 *                   type: string
 *                   enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *                 slug:
 *                   type: string
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export const createMembership = async (req: Request, res: Response) => {
  try {
    const parsedData = membershipSchema.parse(req.body);

    await prisma.$transaction(async (prisma) => {
      const membership = await prisma.membership.create({
        data: parsedData,
      });
      const slug = `M-${membership.number}`;
      const updatedMembership = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          slug,
        },
        include: {
          profile: true,
        },
      });
      res.status(201).json(updatedMembership);
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/membership/{id}:
 *   get:
 *     summary: Get a membership by ID
 *     tags: [Membership]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the membership
 *     responses:
 *       200:
 *         description: Membership details
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
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 usersId:
 *                   type: string
 *                 profileId:
 *                   type: string
 *                 number:
 *                   type: integer
 *                 slug:
 *                   type: string
 *                 feeAmount:
 *                   type: number
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *                 paymentStatus:
 *                   type: string
 *                   enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *       404:
 *         description: Membership not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export const getMembership = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const membership = await prisma.membership.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }
    res.status(200).json(membership);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/membership/{id}:
 *   put:
 *     summary: Update a membership by ID
 *     tags: [Membership]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the membership
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
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               feeAmount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               paymentStatus:
 *                 type: string
 *                 enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *     responses:
 *       200:
 *         description: Membership updated successfully
 *       404:
 *         description: Membership not found
 */
export const updateMembership = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsedData = membershipSchema.parse(req.body);
    const membership = await prisma.membership.update({
      where: { id },
      data: parsedData,
    });
    res.status(200).json(membership);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @swagger
 * /api/membership/{id}:
 *   delete:
 *     summary: Delete a membership by ID
 *     tags: [Membership]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the membership
 *     responses:
 *       200:
 *         description: Membership deleted successfully
 *       404:
 *         description: Membership not found
 */
export const deleteMembership = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.membership.delete({
      where: { id },
    });
    res.status(200).json({ message: "Membership deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
