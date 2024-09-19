import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { getUser } from "../utils";
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/leaderboardpoint/{id}:
 *   put:
 *     summary: Edit a LeaderboardPoint
 *     tags: [LeaderboardPoint]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the LeaderboardPoint to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the participant
 *               points:
 *                 type: number
 *                 description: The points of the participant
 *               profileId:
 *                 type: string
 *                 description: The ID of the profile associated with the LeaderboardPoint
 *     responses:
 *       200:
 *         description: LeaderboardPoint updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 points:
 *                   type: number
 *                 profileId:
 *                   type: string
 *                 leaderBoardId:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: LeaderboardPoint not found
 *       500:
 *         description: Internal server error
 */

const EditLeaderboardPointSchema = z.object({
  name: z.string().min(1, "Name is required"),
  points: z.number().int().nonnegative("Points must be a non-negative integer"),
  profileId: z.string().min(1, "Profile ID is required"),
});

export const editLeaderboardPoint = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    const { name, points, profileId } = EditLeaderboardPointSchema.parse(
      req.body
    );

    const updatedLeaderboardPoint = await prisma.leaderBoardPoint.update({
      where: { id },
      data: {
        name,
        points,
        profileId,
      },
    });

    res.status(200).json(updatedLeaderboardPoint);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json(error.errors);
    } else if (error.code === "P2025") {
      // Record not found
      res.status(404).send("LeaderboardPoint not found");
    } else {
      console.error("Error updating LeaderboardPoint:", error);
      res
        .status(500)
        .send("An error occurred while updating the LeaderboardPoint");
    }
  } finally {
    await prisma.$disconnect();
  }
};
