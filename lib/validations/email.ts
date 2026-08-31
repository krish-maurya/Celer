import { z } from "zod";

export const sendEmailSchema = z.object({
  to: z.union([
    z.email(),
    z.array(z.email()),
  ]),
  subject: z.string()
    .min(1)
    .max(200),
  text: z.string()
    .min(1)
    .max(1000),
});