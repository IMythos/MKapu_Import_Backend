import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ListEmployeeSalesFilterDto } from '../../../../application/dto/in';
import { EmployeeSalesListResponseDto } from '../../../../application/dto/out';
import { ISalesReceiptQueryPort } from '../../../../domain/ports/in/sales_receipt-ports-in';

@Controller()
export class SalesReceiptTcpController {
  constructor(
    @Inject('ISalesReceiptQueryPort')
    private readonly receiptQueryService: ISalesReceiptQueryPort,
  ) {}

  @MessagePattern({ cmd: 'find_sales_by_employee' })
  findSalesByEmployee(
    @Payload() filters: ListEmployeeSalesFilterDto,
  ): Promise<EmployeeSalesListResponseDto> {
    return this.receiptQueryService.listEmployeeSales(filters);
  }
}
