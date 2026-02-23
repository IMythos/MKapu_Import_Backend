import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class IniciarConteoDto {
  @IsString()
  @IsNotEmpty()
  idSede: string;

  @IsString()
  @IsNotEmpty()
  nomSede: string;

  @IsInt()
  @IsNotEmpty()
  idUsuario: number;
}

export class ActualizarDetalleConteoDto {
  @IsNumber()
  @Min(0)
  stockConteo: number;

  @IsString()
  @IsOptional()
  observacion?: string;
}
export class FinalizarConteoDto {
  @IsInt()
  @IsNotEmpty()
  idConteo: number;

  @IsEnum(['FINALIZADO', 'ANULADO'])
  estado: string;

  @IsNumber()
  @IsOptional()
  totalItems?: number;

  @IsNumber()
  @IsOptional()
  totalDiferencias?: number;
}
