import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator'
import { Transform } from 'class-transformer'
import { Prisma } from '@prisma/client'

export class CreateBlockDto {
    @IsString()
    type: string

    @IsOptional()
    content?: Prisma.InputJsonValue

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    order?: number
}

export class UpdateBlockDto {
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

export class ReorderBlocksDto {
    @IsArray()
    @IsString({ each: true })
    order: string[]
}
