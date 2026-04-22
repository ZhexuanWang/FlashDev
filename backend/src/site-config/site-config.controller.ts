import {
    Controller, Get, Put, Patch,
    Param, Body, UseGuards,
} from '@nestjs/common';
import { SiteConfigService } from './site-config.service';
import { UpdateSiteConfigDto } from './dto/update-site-config.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';  // ← 改这里

@Controller('site-config')
export class SiteConfigController {
    constructor(private siteConfigService: SiteConfigService) {}

    @Get()
    getAll() {
        return this.siteConfigService.getAll();
    }

    @Get(':key')
    getOne(@Param('key') key: string) {
        return this.siteConfigService.getOne(key);
    }

    @Put(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)  // ← 改这里
    @Roles('COMPANY', 'ADMIN')
    update(@Param('key') key: string, @Body() dto: UpdateSiteConfigDto) {
        return this.siteConfigService.update(key, dto.value);
    }

    @Patch()
    @UseGuards(JwtAuthGuard, RolesGuard)  // ← 改这里
    @Roles('COMPANY', 'ADMIN')
    bulkUpdate(@Body() updates: Record<string, string>) {
        return this.siteConfigService.bulkUpdate(updates);
    }
}