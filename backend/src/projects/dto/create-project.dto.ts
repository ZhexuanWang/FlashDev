import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray } from 'class-validator'
import { ProjectType } from '@prisma/client'

export { ProjectType }

export class CreateProjectDto {
    @IsString()
    titleZh: string

    @IsString()
    titleEn: string

    @IsString()
    descriptionZh: string

    @IsString()
    descriptionEn: string

    @IsEnum(ProjectType)
    type: ProjectType        // 值为 'SHOWCASE' | 'FOR_SALE' | 'CUSTOM'

    @IsOptional()
    @IsString()
    categoryId?: string

    @IsOptional()
    @IsArray()
    media?: string[]

    @IsOptional()
    @IsNumber()
    price?: number

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean
}