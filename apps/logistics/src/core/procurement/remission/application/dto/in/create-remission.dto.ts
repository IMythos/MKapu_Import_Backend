import {
  IsNotEmpty,
  IsString,
  IsNumber,
  ValidateNested,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransportMode } from '../../../domain/entity/remission-domain-entity';

class TransportDataDto {
  @IsEnum(TransportMode)
  modalidad: TransportMode;

  @IsNotEmpty()
  fecha_inicio_traslado: Date;

  @IsOptional() ruc_transportista?: string;
  @IsOptional() razon_social_transportista?: string;
  @IsOptional() dni_conductor?: string;
  @IsOptional() nombre_conductor?: string;
  @IsOptional() placa_vehiculo?: string;
}

class RemissionDetailItemDto {
  @IsNotEmpty() codigo_producto: string;
  @IsNotEmpty() descripcion: string;
  @IsNumber() cantidad: number;
  @IsString() unidad_medida: string;
  @IsNumber() peso_total: number;
}

export class CreateRemissionDto {
  @IsNumber()
  id_comprobante_ref: number;

  @IsNumber()
  id_sede_origen: number;

  @IsNumber()
  id_usuario_responsable: number;

  @IsString()
  ubigeo_llegada: string;

  @IsString()
  direccion_llegada: string;

  @IsString()
  motivo_traslado: string;

  @IsNumber()
  peso_bruto_total: number;

  // Datos Anidados (Transporte y Detalles)
  @ValidateNested()
  @Type(() => TransportDataDto)
  datos_transporte: TransportDataDto;

  @ValidateNested({ each: true })
  @Type(() => RemissionDetailItemDto)
  detalles: RemissionDetailItemDto[];
}
