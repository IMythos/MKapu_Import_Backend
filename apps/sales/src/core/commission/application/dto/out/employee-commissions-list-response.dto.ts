export class EmployeeCommissionItemDto {
  idComision: number;
  comprobante: string;
  sede: string;
  monto: number;
  porcentaje: number;
  fecha: Date;
  estado: string;
}

export class EmployeeCommissionsListResponseDto {
  comisiones: EmployeeCommissionItemDto[];
  totalComisiones: number;
  page: number;
  limit: number;
  totalPages: number;
}
