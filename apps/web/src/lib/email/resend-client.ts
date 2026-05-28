// lib/email/resend-client.ts
// Client Resend singleton

import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_FROM = 'Habiquo CRM <onboarding@resend.dev>'
