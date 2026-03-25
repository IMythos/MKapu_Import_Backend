import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CommissionQueryService } from '../../../../application/service/commission-query.service';
import { ListEmployeeCommissionsFilterDto } from '../../../../application/dto/in/list-employee-commissions-filter.dto';
import { EmployeeCommissionsListResponseDto } from '../../../../application/dto/out/employee-commissions-list-response.dto';

@Controller()
export class CommissionTcpController {
  constructor(
    private readonly queryService: CommissionQueryService,
  ) {}

  @MessagePattern({ cmd: 'find_commissions_by_employee' })
  findCommissionsByEmployee(
    @Payload() filters: ListEmployeeCommissionsFilterDto,
  ): Promise<EmployeeCommissionsListResponseDto> {
    return this.queryService.listEmployeeCommissions(filters);
  }
}
