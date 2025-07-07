import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPopularTags } from "../../src/services/tags.service";
import { AppError } from "../../src/lib/error-handler";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const tags = await getPopularTags();
    return res.status(200).json(tags);
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 