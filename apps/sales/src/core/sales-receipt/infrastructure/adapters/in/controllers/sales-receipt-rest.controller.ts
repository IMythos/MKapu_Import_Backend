/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ISalesReceiptCommandPort,
  ISalesReceiptQueryPort,
} from '../../../../domain/ports/in/sales_receipt-ports-in';
import {
  RegisterSalesReceiptDto,
  AnnulSalesReceiptDto,
  ListSalesReceiptFilterDto,
} from '../../../../application/dto/in';
import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptDeletedResponseDto,
} from '../../../../application/dto/out';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesReceiptOrmEntity } from '../../../entity/sales-receipt-orm.entity';

@Controller('receipts')
export class SalesReceiptRestController {
  constructor(
    @Inject('ISalesReceiptQueryPort')
    private readonly receiptQueryService: ISalesReceiptQueryPort,
    @Inject('ISalesReceiptCommandPort')
    private readonly receiptCommandService: ISalesReceiptCommandPort,
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly salesReceiptRepo: Repository<SalesReceiptOrmEntity>,
  ) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerReceipt(
    @Body() registerDto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    return this.receiptCommandService.registerReceipt(registerDto);
  }

  @Put(':id/annul')
  @HttpCode(HttpStatus.OK)
  async annulReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
  ): Promise<SalesReceiptResponseDto> {
    const annulDto: AnnulSalesReceiptDto = {
      receiptId: id,
      reason: body.reason,
    };
    return this.receiptCommandService.annulReceipt(annulDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteReceipt(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesReceiptDeletedResponseDto> {
    return this.receiptCommandService.deleteReceipt(id);
  }
  @Get()
  async listReceipts(
    @Query() filters: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptListResponse> {
    return this.receiptQueryService.listReceipts(filters);
  }

  @Get(':id')
  async getReceipt(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesReceiptResponseDto | null> {
    return this.receiptQueryService.getReceiptById(id);
  }

  @Get('serie/:serie')
  async getReceiptsBySerie(
    @Param('serie') serie: string,
  ): Promise<SalesReceiptListResponse> {
    return this.receiptQueryService.getReceiptsBySerie(serie);
  }
  @MessagePattern({ cmd: 'verify_sale' })
  async verifySaleForRemission(@Payload() id_comprobante: number) {
    try {
      const sale = await this.salesReceiptRepo.findOne({
        where: { id_comprobante: id_comprobante },
        relations: ['details'],
      });

      if (!sale) return { success: false };

      return {
        success: true,
        data: sale,
      };
    } catch (error) {
      return { success: false };
    }
  }
  @MessagePattern({ cmd: 'update_dispatch_status' })
  async updateDispatchStatus(
    @Payload() data: { id_venta: number; status: string },
  ) {
    try {
      console.log(
        `[TCP SALES] Actualizando despacho de venta ${data.id_venta} a ${data.status}`,
      );

      const sale = await this.salesReceiptRepo.findOne({
        where: { id_comprobante: data.id_venta },
      });

      if (!sale) {
        return { success: false, message: 'Venta no encontrada' };
      }

      (sale as any).estado = data.status;

      await this.salesReceiptRepo.save(sale);

      return { success: true };
    } catch (error) {
      console.error('[TCP SALES] Error al actualizar estado:', error);
      return { success: false, error: error.message };
    }
  }
}
