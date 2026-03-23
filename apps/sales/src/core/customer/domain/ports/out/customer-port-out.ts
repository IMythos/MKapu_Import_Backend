import { Customer } from '../../entity/customer-domain-entity';
import { DocumentType } from '../../entity/document-type-domain-entity';

export interface ICustomerRepositoryPort {
  save(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Customer | null>;
  findByDocument(valor_doc: string): Promise<Customer | null>;
  findAll(filters?: {
    estado?: boolean;
    search?: string;
    id_tipo_documento?: number;
    page?: number;
    limit?: number;
  }): Promise<{ customers: Customer[]; total: number }>;
  existsByDocument(valor_doc: string): Promise<boolean>;
}

export interface IDocumentTypeRepositoryPort {
  findAll(): Promise<DocumentType[]>;
  findById(id: number): Promise<DocumentType | null>;
  findBySunatCode(cod_sunat: string): Promise<DocumentType | null>;
}

export type CustomerSalesQuery = {
  customerId: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type CustomerQuotesQuery = {
  customerId: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type CustomerSaleRow = {
  id_comprobante: number;
  serie: string;
  numero: number;
  fec_emision: Date;
  total: number;
  estado: string;
};

export type CustomerQuoteRow = {
  id_cotizacion: number;
  fec_emision: Date;
  total: number;
  estado: string;
};

export interface ICustomerTrackingRepositoryPort {
  findCustomerSalesPaginated(
    filters: CustomerSalesQuery,
    page: number,
    limit: number,
  ): Promise<[CustomerSaleRow[], number]>;

  findCustomerQuotesPaginated(
    filters: CustomerQuotesQuery,
    page: number,
    limit: number,
  ): Promise<[CustomerQuoteRow[], number]>;
}
