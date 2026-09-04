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

export const receivedEmail = z.object({
  id: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  subject : z.string(),
  text:z.string().nullable().optional(),
  html:z.string().nullable().optional()
})

export type ReceivedEmail = z.infer<typeof receivedEmail>
