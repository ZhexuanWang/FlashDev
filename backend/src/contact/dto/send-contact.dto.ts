import { IsString, IsEmail, MaxLength, MinLength } from 'class-validator'

export class SendContactDto {
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string

    @IsEmail()
    email: string

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    subject: string

    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    message: string
}