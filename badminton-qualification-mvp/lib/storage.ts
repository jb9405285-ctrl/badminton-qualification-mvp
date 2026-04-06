import { mkdir, writeFile } from "fs/promises";
import path from "path";

const uploadDirectory = path.join(process.cwd(), "storage", "uploads");

export async function ensureUploadDirectory() {
  await mkdir(uploadDirectory, { recursive: true });
  return uploadDirectory;
}

export async function persistUploadFile(fileName: string, buffer: Buffer) {
  const directory = await ensureUploadDirectory();
  const stamp = `${Date.now()}-${fileName.replace(/\s+/g, "-")}`;
  const filePath = path.join(directory, stamp);
  await writeFile(filePath, buffer);
  return filePath;
}
