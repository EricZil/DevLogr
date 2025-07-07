import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkSlugAvailability } from "../../../src/services/project.service";
import { AppError } from "../../../src/lib/error-handler";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { slug } = req.query;

  if (typeof slug !== "string") {
    return res.status(400).json({ error: "Invalid project slug" });
  }

  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const result = await checkSlugAvailability(slug);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 