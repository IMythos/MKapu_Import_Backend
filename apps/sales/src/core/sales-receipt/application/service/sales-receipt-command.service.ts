/* sales/src/core/sales-receipt/application/service/sales-receipt-command.service.ts */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISalesReceiptCommandPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { LogisticsStockProxy } from '../../infrastructure/adapters/out/TCP/logistics-stock.proxy';
import { IPaymentRepositoryPort } from '../../domain/ports/out/payment-repository-ports-out';

import { RegisterSalesReceiptDto, AnnulSalesReceiptDto } from '../dto/in';
import { SalesReceiptDeletedResponseDto } from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';

@Injectable()
export class SalesReceiptCommandService implements ISalesReceiptCommandPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,

    @Inject('IPaymentRepositoryPort')
    private readonly paymentRepository: IPaymentRepositoryPort,

    // Proxy TCP para comunicación con el microservicio de Logística
    private readonly stockProxy: LogisticsStockProxy,
  ) {}

  /**
   * Registra un nuevo comprobante de venta, gestiona pagos y actualiza stock.
   */
  async registerReceipt(dto: RegisterSalesReceiptDto): Promise<any> {
    // 1. Validar existencia del cliente
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) {
      throw new NotFoundException(`El cliente con ID ${dto.customerId} no existe.`);
    }

    // 2. Determinar Serie según el tipo de comprobante
    // 1: Factura, 2: Boleta, 3: Nota de Crédito
    const assignedSerie = this.getAssignedSerie(dto.receiptTypeId);

    // 3. Generar correlativo y crear entidad de dominio
    const nextNumber = await this.receiptRepository.getNextNumber(assignedSerie);
    const receipt = SalesReceiptMapper.fromRegisterDto(
      { ...dto, serie: assignedSerie },
      nextNumber,
    );
    
    // Ejecutar validaciones de negocio de la entidad (totales, items, etc.)
    receipt.validate();

    // 4. Persistir comprobante en base de datos
    const savedReceipt = await this.receiptRepository.save(receipt);

    // 5. Gestión de Pagos y Caja
    const tipoMovimiento = dto.receiptTypeId === 3 ? 'EGRESO' : 'INGRESO';

    // Registrar el detalle del pago
    await this.paymentRepository.savePayment({
      idComprobante: savedReceipt.id_comprobante,
      idTipoPago: dto.paymentMethodId,
      monto: savedReceipt.total,
    });

    // Registrar movimiento en el flujo de caja
    await this.paymentRepository.registerCashMovement({
      idCaja: String(dto.branchId),
      idTipoPago: dto.paymentMethodId,
      tipoMov: tipoMovimiento,
      concepto: `${tipoMovimiento === 'INGRESO' ? 'VENTA' : 'DEVOLUCION'}: ${savedReceipt.getFullNumber()}`,
      monto: savedReceipt.total,
    });

    // 6. Actualización de Stock en Logística (Solo si NO es Nota de Crédito)
    if (dto.receiptTypeId !== 3) {
      for (const item of savedReceipt.items) {
        await this.stockProxy.registerMovement({
          productId: Number(item.productId),
          warehouseId: Number(dto.branchId),
          headquartersId: Number(dto.branchId),
          quantityDelta: -item.quantity, // Valor negativo para indicar salida de stock
          reason: 'VENTA',
        });
      }
    }

    return SalesReceiptMapper.toResponseDto(savedReceipt);
  }

  /**
   * Anula un comprobante existente y devuelve los productos al stock.
   */
  async annulReceipt(dto: AnnulSalesReceiptDto): Promise<any> {
    const existingReceipt = await this.receiptRepository.findById(dto.receiptId);
    if (!existingReceipt) {
      throw new NotFoundException(`Comprobante con ID ${dto.receiptId} no encontrado.`);
    }

    // Cambiar estado a ANULADO en el dominio
    const annulledReceipt = existingReceipt.anular();
    const savedReceipt = await this.receiptRepository.update(annulledReceipt);

    // Devolver productos al inventario
    for (const item of savedReceipt.items) {
      await this.stockProxy.registerMovement({
        productId: Number(item.productId),
        warehouseId: savedReceipt.id_sede_ref,
        headquartersId: savedReceipt.id_sede_ref,
        quantityDelta: item.quantity, // Valor positivo para reingreso de stock
        reason: `ANULACION: ${savedReceipt.getFullNumber()}`,
      });
    }

    return SalesReceiptMapper.toResponseDto(savedReceipt);
  }

  /**
   * Elimina físicamente un comprobante (Uso restringido).
   */
  async deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto> {
    const existingReceipt = await this.receiptRepository.findById(id);
    if (!existingReceipt) {
      throw new NotFoundException(`Comprobante con ID ${id} no encontrado.`);
    }
    
    await this.receiptRepository.delete(id);
    
    return {
      receiptId: id,
      message: 'Comprobante eliminado correctamente de la base de datos.',
      deletedAt: new Date(),
    };
  }

  /**
   * Lógica privada para asignar series automáticas.
   */
  private getAssignedSerie(receiptTypeId: number): string {
    const seriesMap: Record<number, string> = {
      1: 'F001', // Factura
      2: 'B001', // Boleta
      3: 'NC01', // Nota de Crédito
    };
    return seriesMap[receiptTypeId] || 'T001'; // Default: Ticket
  }
}