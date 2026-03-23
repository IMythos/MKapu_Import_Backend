import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ICustomerCommandPort,
  ICustomerQueryPort,
} from '../../../../domain/ports/in/cunstomer-port-in';
import {
  ListCustomerFilterDto,
  RegisterCustomerDto,
  UpdateCustomerDto,
} from '../../../../application/dto/in';
import { ListCustomerTrackingFilterDto } from '../../../../application/dto/in/list-customer-tracking-filter-dto';
import {
  CustomerDeletedResponseDto,
  CustomerListResponse,
  CustomerResponseDto,
  DocumentTypeResponseDto,
} from '../../../../application/dto/out';
import { CustomerQuotesResponseDto } from '../../../../application/dto/out/customer-quotes-response.dto';
import { CustomerSalesResponseDto } from '../../../../application/dto/out/customer-sales-response.dto';

@Controller('customers')
export class CustomerRestController {
  constructor(
    @Inject('ICustomerQueryPort')
    private readonly customerQueryService: ICustomerQueryPort,
    @Inject('ICustomerCommandPort')
    private readonly customerCommandService: ICustomerCommandPort,
  ) {}

  @Get('document-types')
  @HttpCode(HttpStatus.OK)
  getDocumentTypes(): Promise<DocumentTypeResponseDto[]> {
    return this.customerQueryService.getDocumentTypes();
  }

  @Get('document/:documentValue')
  @HttpCode(HttpStatus.OK)
  getCustomerByDocument(
    @Param('documentValue') documentValue: string,
  ): Promise<CustomerResponseDto | null> {
    return this.customerQueryService.getCustomerByDocument(documentValue);
  }

  @Get('suggest')
  @HttpCode(HttpStatus.OK)
  async suggest(
    @Query('q') q?: string,
    @Query('limit') limit = 5,
  ): Promise<CustomerResponseDto[]> {
    const filters: ListCustomerFilterDto = {
      page: 1,
      limit: Number(limit),
      search: q ?? undefined,
    };

    const list = await this.customerQueryService.listCustomers(filters);
    const items =
      (list as { customers?: CustomerResponseDto[] }).customers ?? [];

    return Array.isArray(items) ? items.slice(0, Number(limit)) : [];
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  registerCustomer(
    @Body() registerDto: RegisterCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customerCommandService.registerCustomer(registerDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  updateCustomer(
    @Param('id') id: string,
    @Body() updateDto: Omit<UpdateCustomerDto, 'customerId'>,
  ): Promise<CustomerResponseDto> {
    return this.customerCommandService.updateCustomer({
      ...updateDto,
      customerId: id,
    });
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  changeCustomerStatus(
    @Param('id') id: string,
    @Body() statusDto: { status: boolean },
  ): Promise<CustomerResponseDto> {
    return this.customerCommandService.changeCustomerStatus({
      customerId: id,
      status: statusDto.status,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteCustomer(@Param('id') id: string): Promise<CustomerDeletedResponseDto> {
    return this.customerCommandService.deleteCustomer(id);
  }

  @Get(':id/sales')
  async getCustomerSales(
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: ListCustomerTrackingFilterDto,
  ): Promise<CustomerSalesResponseDto> {
    const response: CustomerSalesResponseDto =
      await this.customerQueryService.getCustomerSales(id, filters);
    return response;
  }

  @Get(':id/quotes')
  async getCustomerQuotes(
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: ListCustomerTrackingFilterDto,
  ): Promise<CustomerQuotesResponseDto> {
    const response: CustomerQuotesResponseDto =
      await this.customerQueryService.getCustomerQuotes(id, filters);
    return response;
  }

  @Get()
  listCustomers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('tipo') tipo?: string,
  ): Promise<CustomerListResponse> {
    let estadoBoolean: boolean | undefined;
    if (status === 'true') estadoBoolean = true;
    if (status === 'false') estadoBoolean = false;

    let documentTypeId: number | undefined;
    if (tipo === 'juridica') documentTypeId = 4;
    if (tipo === 'natural') documentTypeId = 2;

    const filters: ListCustomerFilterDto = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search || undefined,
      status: estadoBoolean,
      documentTypeId,
    };

    return this.customerQueryService.listCustomers(filters);
  }

  @Get(':id')
  getCustomer(@Param('id') id: string): Promise<CustomerResponseDto | null> {
    return this.customerQueryService.getCustomerById(id);
  }
}
