import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator'

export class UpdateBlogPostDto {
    @IsOptional()
    @IsString()
    titleZh?: string

    @IsOptional()
    @IsString()
    titleEn?: string

    @IsOptional()
    @IsString()
    excerptZh?: string

    @IsOptional()
    @IsString()
    excerptEn?: string

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
