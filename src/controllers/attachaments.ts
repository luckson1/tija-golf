import  fs  from 'fs'
import  path  from 'path'
import {BlobServiceClient} from "@azure/storage-blob"
import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getUser } from '../utils';
const prisma = new PrismaClient();
const ProfileImageSchema = z.object({
  id:z.string()
  });
export const uploadFileToAzure = async (filePath:string, fileName:string) => {
try {
  const AZURE_STORAGE_CONNECTION_STRING = process.env.APPSETTING_AZURE_STORAGE_CONNECTION_STRING;
  const containerName = 'your-container-name';
  if (!AZURE_STORAGE_CONNECTION_STRING ) throw new Error("AZURE_STORAGE_CONNECTION_STRING needed")
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(containerName);

    const blobClient = containerClient.getBlockBlobClient(fileName);
    const uploadResponse = await blobClient.uploadFile(filePath);
    return blobClient.url;
} catch (error) {
  console.log(error)
}
};

export const upload =async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");
    if (!req.file) return res.status(400).send('No file uploaded.');
    const {id} = ProfileImageSchema.parse(req.body);

    const url = await uploadFileToAzure(req?.file?.path, req?.file?.filename);
    fs.unlinkSync(req?.file?.path); // Remove the file from the server after upload
    const profileImage= await prisma.profile.update({
      where: {
id
      },
      data: {
        image:url
      }
    })
    res.json({ url });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file to Azure Storage.');
  }
  
}