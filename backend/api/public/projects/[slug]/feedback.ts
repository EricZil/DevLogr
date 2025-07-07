import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getPublicFeedback,
  createPublicFeedback,
} from "../../../../src/services/feedback.service";
import { AppError } from "../../../../src/lib/error-handler";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { slug } = req.query;

  if (typeof slug !== "string") {
    return res.status(400).json({ error: "Invalid project slug" });
  }

  try {
    switch (req.method) {
      case "GET":
        const feedback = await getPublicFeedback(slug);
        return res.status(200).json(feedback);

      case "POST":
        const newFeedback = await createPublicFeedback(slug, req.body);
        return res.status(201).json(newFeedback);

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    if (error instanceof AppError) {
      return res
        .status(error.statusCode)
        .json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: "gj server gg (internal err)" });
  }
} 