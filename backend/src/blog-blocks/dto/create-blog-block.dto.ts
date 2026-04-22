import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator'
import { Transform } from 'class-transformer'
import { Prisma } from '@prisma/client'

export class CreateBlogBlockDto {
    @IsString()
    type: string

    @IsOptional()
    content?: Prisma.InputJsonValue

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    order?: number
}

export class UpdateBlogBlockDto {
    @IsString()
    @IsOptional()
    type?: string

    @IsOptional()
    content?: Prisma.InputJsonValue

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    order?: number
}

export class ReorderBlogBlocksDto {
    @IsArray()
    @IsString({ each: true })
    order: string[]
}
