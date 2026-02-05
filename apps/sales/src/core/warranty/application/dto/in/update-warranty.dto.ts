/* sales/src/core/warranty/application/dto/in/update-warranty.dto.ts */
import { IsOptional, IsDateString, IsString } from 'class-validator';

export class UpdateWarrantyDto {
  @IsOptional()
  @IsDateString()
  fec_recepcion?: string; // Cambiado a string para validación de entrada

  @IsOptional()
  @IsString()
  observaciones?: string; // <--- ESTO corrige los errores Ln 96 y 97 de image_c1ed4a
}