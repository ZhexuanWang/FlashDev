import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

@Injectable()
export class MailService {
    private transporter: Transporter
    private readonly logger = new Logger(MailService.name)

    constructor() {
        this.transporter = nodemailer.createTransport({
            host:   process.env.MAIL_HOST   ?? 'smtp.gmail.com',
            port:   Number(process.env.MAIL_PORT ?? 587),
            secure: false,
            auth: {
                user: process.env.MAIL_USER ?? '',
                pass: process.env.MAIL_PASS ?? '',
            },
        })
    }

    async sendMail(opts: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
        try {
            await this.transporter.sendMail({
                from:    process.env.MAIL_FROM ?? process.env.MAIL_USER,
                to:      opts.to,
                replyTo: opts.replyTo,
                subject: opts.subject,
                text:    opts.text,
                html:    opts.html,
            })
            this.logger.log(`Email sent to ${opts.to}: ${opts.subject}`)
            return { success: true }
        } catch (err) {
            this.logger.error('Failed to send email', err)
            throw err
        }
    }

    async sendContactEmail(opts: {
        senderName:  string
        senderEmail: string
        subject:     string
        message:     string
        recipient:   string
    }) {
        const { senderName, senderEmail, subject, message, recipient } = opts

        const html = `
      <div style="font-family:monospace;background:#000508;color:#cbd5e1;padding:32px;border-radius:8px;max-width:600px">
        <h2 style="color:#38bdf8;margin-top:0">New Contact from FlashDev</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="color:#64748b;padding:6px 0;width:100px">Name</td>
            <td style="color:#e2e8f0">${senderName}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding:6px 0">Email</td>
            <td style="color:#38bdf8"><a href="mailto:${senderEmail}" style="color:#38bdf8">${senderEmail}</a></td>
          </tr>
          <tr>
            <td style="color:#64748b;padding:6px 0">Subject</td>
            <td style="color:#e2e8f0">${subject}</td>
          </tr>
        </table>
        <hr style="border-color:#1e293b;margin:20px 0"/>
        <p style="color:#94a3b8;white-space:pre-wrap;line-height:1.7">${message}</p>
        <hr style="border-color:#1e293b;margin:20px 0"/>
        <p style="color:#334155;font-size:12px">Sent via FlashDev contact form</p>
      </div>
    `

        try {
            await this.transporter.sendMail({
                from:    process.env.MAIL_FROM ?? process.env.MAIL_USER,
                to:      recipient,
                replyTo: senderEmail,
                subject: `[FlashDev] ${subject}`,
                html,
            })
            this.logger.log(`Contact email sent to ${recipient}`)
            return { success: true }
        } catch (err) {
            this.logger.error('Failed to send email', err)
            throw err
        }
    }
}