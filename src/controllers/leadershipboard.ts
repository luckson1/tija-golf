import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import { z } from "zod";
import { getUser } from "../utils";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Retrieve the latest leaderboard
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export const getLatestBoard = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

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
 *     security:
 *       - bearerAuth: []
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
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export const uploadLeaderboard = async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).send("Forbidden");
  const userId = await getUser(token);
  if (!userId) return res.status(401).send("Unauthorized");

  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  const results: { name: string; points: number; email: string }[] = [];

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
          const profile = await prisma.profile.findFirst({
            where: { email: item.email },
          });
          await prisma.leaderBoardPoint.create({
            data: {
              name: item.name,
              points: item.points,
              profileId: profile?.id,
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
