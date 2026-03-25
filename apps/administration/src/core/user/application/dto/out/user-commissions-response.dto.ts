export class UserCommissionItemDto {
  idComision: number;
  comprobante: string;
  sede: string;
  monto: number;
  porcentaje: number;
  fecha: Date;
  estado: string;
}

export class UserCommissionsResponseDto {
  comisiones: UserCommissionItemDto[];
  totalComisiones: number;
  page: number;
  limit: number;
  totalPages: number;
}
