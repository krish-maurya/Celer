import { z } from "zod";

// Zod v4 uses z.email() and z.string().min etc - keep compatible
export const sendEmailSchema = z.object({
  mailboxId: z.string().optional(),
  to: z.union([z.email(), z.array(z.email()).min(1)]),
  cc: z.array(z.email()).optional(),
  bcc: z.array(z.email()).optional(),
  subject: z.string().min(1, "Subject required").max(200),
  text: z.string().min(1, "Body required").max(10000),
  html: z.string().optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number().optional(),
        contentType: z.string().optional(),
      })
    )
    .optional(),
});

export const draftSchema = z.object({
  mailboxId: z.string().optional(),
  to: z.array(z.email()).optional().default([]),
  cc: z.array(z.email()).optional().default([]),
  bcc: z.array(z.email()).optional().default([]),
  subject: z.string().max(200).optional().default(""),
  text: z.string().max(10000).optional().default(""),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number().optional(),
        contentType: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export const receivedEmail = z.object({
  id: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  subject: z.string(),
  text: z.string().nullable().optional(),
  html: z.string().nullable().optional(),
});

export type ReceivedEmail = z.infer<typeof receivedEmail>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type DraftInput = z.infer<typeof draftSchema>;
