import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Retrieve the latest leaderboard
 *     tags: [Leaderboard]
 *     responses:
 *       200:
 *         description: The latest leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   points:
 *                     type: number
 *                   user:
 *                     type: string
 *                   image:
 *                     type: string
 *                   profileId:
 *                     type: string
 *                     nullable: true
 *       500:
 *         description: Internal server error
 */

export const getLatestBoard = async (req: Request, res: Response) => {
  try {
    const board = await prisma.leaderBoard.findMany({
      select: {
        LeaderBoardPoint: {
          select: {
            id: true,
            name: true,
            points: true,
            profile: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            points: "asc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    console.log(board);
    if (!board || board?.at(0)?.LeaderBoardPoint?.length === 0) {
      return [];
    }

    const formattedBoard = board?.at(0)?.LeaderBoardPoint.map((b) => ({
      id: b.id,
      points: b.points,
      user: b.profile?.name ?? b.name,
      image: b.profile?.image,
      profileId: b.profile?.id,
    }));

    res.json(formattedBoard);
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error retrieving the leaderboard:", error);
    res.status(500).send("An error occurred while retrieving the leaderboard");
    await prisma.$disconnect();
  }
};

const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * /api/leaderboard/upload:
 *   post:
 *     summary: Upload a CSV file to create a new leaderboard
 *     tags: [Leaderboard]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The CSV file to upload
 *     responses:
 *       200:
 *         description: Leaderboard created successfully
 *       500:
 *         description: Internal server error
 */

export const uploadLeaderboard = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  const results: { name: string; points: number }[] = [];

  fs.createReadStream(file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        const leaderBoard = await prisma.leaderBoard.create({
          data: {
            date: new Date(),
          },
        });

        for (const item of results) {
          await prisma.leaderBoardPoint.create({
            data: {
              name: item.name,
              points: item.points,
              leaderBoardId: leaderBoard.id,
            },
          });
        }

        res.status(200).send("Leaderboard created successfully");
      } catch (error) {
        console.error("Error creating leaderboard:", error);
        res
          .status(500)
          .send("An error occurred while creating the leaderboard");
      } finally {
        await prisma.$disconnect();
        fs.unlinkSync(file.path); // Clean up the uploaded file
      }
    });
};

/**
 * @swagger
 * /api/leaderboardpoint/{id}:
 *   put:
 *     summary: Edit a LeaderboardPoint
 *     tags: [LeaderboardPoint]
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
 *       404:
 *         description: LeaderboardPoint not found
 *       500:
 *         description: Internal server error
 */

import { z } from 'zod';

const EditLeaderboardPointSchema = z.object({
  name: z.string().min(1, "Name is required"),
  points: z.number().int().nonnegative("Points must be a non-negative integer"),
  profileId: z.string().min(1, "Profile ID is required"),
});

export const editLeaderboardPoint = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { name, points, profileId } = EditLeaderboardPointSchema.parse(req.body);

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
    } else if (error.code === 'P2025') {
      // Record not found
      res.status(404).send("LeaderboardPoint not found");
    } else {
      console.error("Error updating LeaderboardPoint:", error);
      res.status(500).send("An error occurred while updating the LeaderboardPoint");
    }
  } finally {
    await prisma.$disconnect();
  }
};



