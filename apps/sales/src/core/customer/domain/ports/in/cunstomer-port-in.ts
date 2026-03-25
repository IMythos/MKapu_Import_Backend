import {
  ChangeCustomerStatusDto,
  ListCustomerFilterDto,
  ListCustomerTrackingFilterDto,
  RegisterCustomerDto,
  UpdateCustomerDto,
} from '../../../application/dto/in';
import {
  CustomerDeletedResponseDto,
  CustomerListResponse,
  CustomerQuotesResponseDto,
  CustomerResponseDto,
  CustomerSalesResponseDto,
  DocumentTypeResponseDto,
} from '../../../application/dto/out';

export interface ICustomerCommandPort {
  registerCustomer(dto: RegisterCustomerDto): Promise<CustomerResponseDto>;
  updateCustomer(dto: UpdateCustomerDto): Promise<CustomerResponseDto>;
  changeCustomerStatus(dto: ChangeCustomerStatusDto): Promise<CustomerResponseDto>;
  deleteCustomer(id: string): Promise<CustomerDeletedResponseDto>;
}

export interface ICustomerQueryPort {
  listCustomers(filters?: ListCustomerFilterDto): Promise<CustomerListResponse>;
  getCustomerById(id: string): Promise<CustomerResponseDto | null>;
  getCustomerByDocument(documentValue: string): Promise<CustomerResponseDto | null>;
  getDocumentTypes(): Promise<DocumentTypeResponseDto[]>;
  getCustomerSales(
    id: string,
    filters: ListCustomerTrackingFilterDto,
  ): Promise<CustomerSalesResponseDto>;
  getCustomerQuotes(
    id: string,
    filters: ListCustomerTrackingFilterDto,
  ): Promise<CustomerQuotesResponseDto>;
}
