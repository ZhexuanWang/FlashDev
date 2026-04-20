import { IsString, IsOptional, IsBoolean, IsNumber, IsInt } from 'class-validator'

export class CreateTeamMemberDto {
    @IsString()
    nameZh: string

    @IsString()
    nameEn: string

    @IsString()
    roleZh: string

    @IsString()
    roleEn: string

    @IsString()
    bioZh: string

    @IsString()
    bioEn: string

    @IsOptional()
    @IsString()
    avatar?: string

    @IsOptional()
    @IsString()
    github?: string

    @IsOptional()
    @IsInt()
    order?: number

    @IsOptional()
    @IsBoolean()
    isVisible?: boolean
}