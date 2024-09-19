import { PrismaClient } from "@prisma/client";
import { supabaseClient } from "../utils";
import csv from "csv-parser";
import { Readable } from "stream";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export async function inviteMultipleUsers(emails: string[]) {
  const results = [];

  for (const email of emails) {
    try {
      // Invite user using Supabase
      const response = await supabaseClient?.auth.admin.inviteUserByEmail(
        email
      );

      if (response?.error) {
        throw response?.error;
      }

      // Record invitation in the database
      const invitation = await prisma.invitation.create({
        data: {
          email,
          status: "Pending",
        },
      });

      results.push({ email, success: true, invitation });
    } catch (error) {
      results.push({ email, success: false, error: error });
    }
  }

  return results;
}

export async function parseCSVAndInvite(fileBuffer: Buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const emails: string[] = [];

    Readable.from(fileBuffer)
      .pipe(csv())
      .on("data", (row) => {
        if (row.email) {
          emails.push(row.email);
        }
      })
      .on("end", async () => {
        try {
          const invitationResults = await inviteMultipleUsers(emails);
          resolve(invitationResults);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * @swagger
 * /api/invitations:
 *   post:
 *     summary: Invite multiple users by email
 *     description: Sends invitation emails to multiple users and records the invitations in the database
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   success:
 *                     type: boolean
 *                   invitation:
 *                     type: object
 *                   error:
 *                     type: object
 */

export const textInvite = async (req: Request, res: Response) => {
  const { emails } = req.body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Invalid email list" });
  }

  try {
    const results = await inviteMultipleUsers(emails);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to process invitations" });
  }
};

/**
 * @swagger
 * /api/invitations/csv:
 *   post:
 *     summary: Invite users from CSV file
 *     description: Parses a CSV file containing email addresses and sends invitations to the users
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   success:
 *                     type: boolean
 *                   invitation:
 *                     type: object
 *                   error:
 *                     type: object
 */

export const csvInvite = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const results = await parseCSVAndInvite(req.file.buffer);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to process CSV file" });
  }
};
