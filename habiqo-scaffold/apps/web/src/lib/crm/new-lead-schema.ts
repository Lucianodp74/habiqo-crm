import { z } from "zod";
import { isPipelineColumnId } from "./pipeline";

export const NEW_LEAD_SOURCE_VALUES = [
  "valuation",
  "portal",
  "idealista",
  "facebook",
  "manual",
  "referral",
  "website",
  "whatsapp",
] as const;

export type NewLeadSource = (typeof NEW_LEAD_SOURCE_VALUES)[number];

const optionalBudgetField = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "number") return Number.isFinite(v) && v > 0 ? Math.floor(v) : undefined;
    const s = String(v).trim();
    if (s === "") return undefined;
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  });

export const newLeadFormSchema = z
  .object({
    full_name: z.string().min(2, "Il nome è obbligatorio").max(200),
    email: z.string().max(254).optional().default(""),
    phone: z.string().max(40).optional().default(""),
    budget_min: optionalBudgetField,
    budget_max: optionalBudgetField,
    preferred_city: z.string().max(120).optional().default(""),
    source: z.enum(NEW_LEAD_SOURCE_VALUES, {
      required_error: "Seleziona una fonte",
      invalid_type_error: "Fonte non valida",
    }),
    status: z.string().min(1, "Seleziona uno stato"),
    notes: z.string().max(8000).optional().default(""),
  })
  .superRefine((data, ctx) => {
    const email = data.email?.trim() ?? "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email non valida", path: ["email"] });
    }
    if (!isPipelineColumnId(data.status)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stato non valido", path: ["status"] });
    }
    const min = data.budget_min;
    const max = data.budget_max;
    if (min != null && max != null && max < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Il budget massimo deve essere ≥ al minimo",
        path: ["budget_max"],
      });
    }
  });

export type NewLeadFormValues = z.infer<typeof newLeadFormSchema>;

export const newLeadDefaultValues: NewLeadFormValues = {
  full_name: "",
  email: "",
  phone: "",
  budget_min: undefined,
  budget_max: undefined,
  preferred_city: "",
  source: "manual",
  status: "new",
  notes: "",
};
