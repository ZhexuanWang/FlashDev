import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator'

export class CreateBlogPostDto {
    @IsString()
    titleZh: string

    @IsString()
    titleEn: string

    @IsString()
    excerptZh: string

    @IsString()
    excerptEn: string

    @IsOptional()
    @IsString()
    coverImage?: string

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[]

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean
}
