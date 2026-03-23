export class EmployeeSaleItemDto {
  nroComprobante: string;
  cliente: string;
  fecha: Date;
  total: number;
  estado: string;
}

export class EmployeeSalesListResponseDto {
  ventas: EmployeeSaleItemDto[];
  totalVentas: number;
  page: number;
  limit: number;
  totalPages: number;
}
