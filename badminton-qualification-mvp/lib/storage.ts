import { mkdir, writeFile } from "fs/promises";
import path from "path";

function resolveUploadDirectory() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
}

export async function ensureUploadDirectory() {
  const uploadDirectory = resolveUploadDirectory();

  await mkdir(uploadDirectory, { recursive: true });
  return uploadDirectory;
}

export async function persistUploadFile(fileName: string, buffer: Buffer) {
  if (process.env.PERSIST_UPLOAD_FILES === "false") {
    return null;
  }

  const directory = await ensureUploadDirectory();
  const safeFileName = path.basename(fileName).replace(/\s+/g, "-");
  const stamp = `${Date.now()}-${safeFileName}`;
  const filePath = path.join(directory, stamp);

  await writeFile(filePath, buffer);
  return filePath;
}
