import { z } from "zod";

export const searchStringParams = z.object({
  slug: z.string().min(1, ""),
});