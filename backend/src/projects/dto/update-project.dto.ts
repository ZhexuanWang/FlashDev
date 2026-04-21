import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray } from 'class-validator'
import { Type } from 'class-transformer'
import { ProjectType } from '@prisma/client'

export class UpdateProjectDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    titleZh?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    titleEn?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    descriptionZh?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    descriptionEn?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    categoryId?: string

    @ApiPropertyOptional()
    @IsOptional()
    @IsEnum(ProjectType)
    type?: ProjectType

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    media?: string[]

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    price?: number

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPublished?: boolean
}
