export class CustomerQuoteItemDto {
  codigo: string;
  fecha: Date;
  total: number;
  estado: string;
}

export class CustomerQuotesResponseDto {
  cotizaciones: CustomerQuoteItemDto[];
  totalCotizaciones: number;
  page: number;
  limit: number;
  totalPages: number;
}
