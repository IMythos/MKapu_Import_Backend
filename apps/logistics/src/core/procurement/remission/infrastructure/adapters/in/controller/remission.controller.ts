import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { RemissionCommandService } from '../../../../application/service/remission-command.service';
import { CreateRemissionDto } from '../../../../application/dto/in/create-remission.dto';
import { JwtAuthGuard } from '@app/common/infrastructure/guard/jwt-auth.guard';
import { RoleGuard } from '@app/common/infrastructure/guard/roles.guard';
import { Roles } from '@app/common';

@Controller('remission')
export class RemissionController {
  constructor(private readonly service: RemissionCommandService) {}

  @Post()
  async create(@Body() dto: CreateRemissionDto) {
    return await this.service.createRemission(dto);
  }
}
