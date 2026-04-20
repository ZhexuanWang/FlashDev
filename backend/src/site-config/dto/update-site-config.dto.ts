import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSiteConfigDto {
    @IsString()
    @IsNotEmpty()
    value: string;
}