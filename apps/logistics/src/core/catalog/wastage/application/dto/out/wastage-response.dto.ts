export class WastageResponseDto {
  id_merma: number;
  fec_merma: Date;
  motivo: string;
  total_items: number;
  estado: boolean;
}

// wastage-paginated-response.dto.ts
export class WastagePaginatedResponseDto {
  data: WastageResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}