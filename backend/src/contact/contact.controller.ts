import { Controller, Post, Body } from '@nestjs/common'
import { ContactService } from './contact.service'
import { SendContactDto } from './dto/send-contact.dto'   // ← 必须是值导入，不能用 import type

@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) {}

    @Post()
    send(@Body() dto: SendContactDto) {
        return this.contactService.send(dto)
    }
}