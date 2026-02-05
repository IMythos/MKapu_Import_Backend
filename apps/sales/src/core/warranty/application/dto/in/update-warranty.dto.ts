import { IsOptional, IsDateString, IsNumber } from 'class-validator';

export class UpdateWarrantyDto {
  @IsDateString()
  @IsOptional()
  fec_recepcion?: Date;

  @IsNumber()
  @IsOptional()
  id_sede_ref?: number;
}
