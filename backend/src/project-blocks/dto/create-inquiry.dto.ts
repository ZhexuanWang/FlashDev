import { IsString, IsEmail, IsNotEmpty, MaxLength, IsOptional } from 'class-validator'

export class CreateInquiryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string

    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    message?: string
}
