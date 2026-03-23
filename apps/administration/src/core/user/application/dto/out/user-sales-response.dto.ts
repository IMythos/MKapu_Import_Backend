export class UserSaleItemDto {
  nroComprobante: string;
  cliente: string;
  fecha: Date;
  total: number;
  estado: string;
}

export class UserSalesResponseDto {
  ventas: UserSaleItemDto[];
  totalVentas: number;
  page: number;
  limit: number;
  totalPages: number;
}
