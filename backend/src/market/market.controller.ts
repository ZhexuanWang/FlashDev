import {
    Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common'
import { MarketService } from './market.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { MarketStatus } from '@prisma/client'

@Controller('market')
export class MarketController {
    constructor(private readonly marketService: MarketService) {}

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('tag') tag?: string,
        @Query('search') search?: string,
    ) {
        return this.marketService.findAll({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status: status as MarketStatus | undefined,
            tag,
            search,
        })
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.marketService.findOne(id)
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(
        @Body() body: {
            title: string; description: string
            budget?: number; timeline?: string; tags?: string[]
        },
        @Body('posterId') _posterId?: string,
    ) {
        // posterId is extracted from JWT in real implementation
        return this.marketService.create(body)
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard)
    updateStatus(
        @Param('id') id: string,
        @Body() body: { status: MarketStatus },
    ) {
        return this.marketService.updateStatus(id, body.status)
    }
}
