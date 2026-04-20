import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MailService } from '../mail/mail.service'
import { SendContactDto } from './dto/send-contact.dto'   // ← 同样，值导入

@Injectable()
export class ContactService {
    constructor(
        private prisma: PrismaService,
        private mail: MailService,
    ) {}

    async send(dto: SendContactDto) {
        console.log('Contact DTO received:', dto)
        console.log('name:', dto.name, 'email:', dto.email)   // 确认字段

        const config = await this.prisma.siteConfig.findUnique({
            where: { key: 'contact_email' },
        })
        const recipient = config?.value ?? process.env.MAIL_USER ?? ''

        if (!recipient) {
            throw new ServiceUnavailableException('Contact email not configured')
        }

        try {
            await this.mail.sendContactEmail({
                senderName:  dto.name,
                senderEmail: dto.email,
                subject:     dto.subject,
                message:     dto.message,
                recipient,
            })
            return { success: true, message: 'Message sent successfully' }
        } catch {
            throw new ServiceUnavailableException('Failed to send email')
        }
    }
}