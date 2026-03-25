export class CustomerSaleItemDto {
  nroComprobante: string;
  fecha: Date;
  total: number;
  estado: string;
}

export class CustomerSalesResponseDto {
  ventas: CustomerSaleItemDto[];
  totalVentas: number;
  page: number;
  limit: number;
  totalPages: number;
}
