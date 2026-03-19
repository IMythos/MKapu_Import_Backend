import { Injectable, Inject, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { IAuctionCommandPort } from '../../domain/port/in/auction.port.in';
import { IAuctionRepositoryPort } from '../../domain/port/out/auction.port.out';
import { CreateAuctionDto } from '../dto/in/create-auction.dto';
import { Auction } from '../../domain/entity/auction-domain-entity';
import { AuctionMapper } from '../mapper/auction.mapper';
import { AuctionResponseDto } from '../dto/out/auction-response.dto';
import { InventoryCommandService } from '../../../../warehouse/inventory/application/service/inventory/inventory-command.service';
import { MovementRequest } from '../../../../warehouse/inventory/domain/ports/in/inventory-movement-ports-in.';

@Injectable()
export class AuctionCommandService implements IAuctionCommandPort {
  private readonly logger = new Logger(AuctionCommandService.name);

  constructor(
    @Inject('IAuctionRepositoryPort')
    private readonly repository: IAuctionRepositoryPort,
    private readonly inventoryService: InventoryCommandService,
  ) {}

  async create(dto: CreateAuctionDto): Promise<AuctionResponseDto> {
    if (!dto.detalles || dto.detalles.length === 0) {
      throw new BadRequestException('Se requiere al menos un detalle para crear la subasta.');
    }
    if (!dto.id_almacen_ref || dto.id_almacen_ref <= 0) {
      throw new BadRequestException('Se requiere id_almacen_ref válido para descontar stock.');
    }

    for (const item of dto.detalles) {
      const stockDisponible = await this.inventoryService.getStockLevel(
        item.id_producto,
        dto.id_almacen_ref,
      );
      if (!stockDisponible || stockDisponible < item.stock_remate) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ID ${item.id_producto}. Disponible: ${stockDisponible || 0}, Requerido: ${item.stock_remate}`,
        );
      }
    }

    const shouldGenerateCode = !dto.cod_remate || dto.cod_remate.trim() === '';
    const temporaryCode = shouldGenerateCode ? 'TEMP-PENDING' : dto.cod_remate!;
    this.logger.log(`Creando remate con código: ${shouldGenerateCode ? 'AUTO-GENERADO' : temporaryCode}`);

    // Constructor: (code, description, status?, id?, details?)
    const domain = new Auction(
      temporaryCode,
      dto.descripcion,
      dto.estado as any,
      undefined,
      dto.detalles.map(d => ({
        productId:     d.id_producto,
        originalPrice: d.pre_original,
        auctionPrice:  d.pre_remate,
        auctionStock:  d.stock_remate,
        observacion:   d.observacion,
      })),
    );

    let saved = await this.repository.save(domain);
    this.logger.log(`Remate guardado con ID: ${saved.id}`);

    let finalCode = dto.cod_remate;
    if (shouldGenerateCode) {
      const year = new Date().getFullYear();
      finalCode = `RMT-${year}-${String(saved.id ?? 0).padStart(3, '0')}`;
      this.logger.log(`Generando código automático: ${finalCode}`);
      try {
        saved.code = finalCode;
        saved = await this.repository.save(saved);
        this.logger.log(`Código actualizado a: ${finalCode}`);
      } catch (err) {
        this.logger.error('Error actualizando código', err);
        try { await this.repository.delete(saved.id!); } catch (e) { this.logger.error('Error en rollback', e); }
        throw new InternalServerErrorException('No se pudo generar el código del remate.');
      }
    }

    const exitPayload: MovementRequest = {
      originType: 'AJUSTE' as MovementRequest['originType'],
      refId:      saved.id!,
      refTable:   'remate',
      observation: `Remate registrado: ${finalCode}`,
      items: dto.detalles.map((d) => ({
        productId:   d.id_producto,
        warehouseId: dto.id_almacen_ref,
        sedeId:      0,
        quantity:    d.stock_remate,
      })),
    };

    try {
      await this.inventoryService.registerExit(exitPayload);
      this.logger.log(`Salida de inventario registrada para remate ${finalCode}`);
    } catch (err) {
      this.logger.error(`Error registrando salida en inventario para remate id=${saved.id}`, err);
      try { await this.repository.delete(saved.id!); } catch (delErr) { this.logger.error('Error compensando', delErr); }
      throw new InternalServerErrorException('Error al registrar salida en inventario. Operación revertida.');
    }

    const final = await this.repository.findById(saved.id!);
    this.logger.log(`Remate ${finalCode} creado exitosamente`);
    return AuctionMapper.toResponseDto(final);
  }

  async update(id: number, dto: any): Promise<AuctionResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new BadRequestException('Subasta no encontrada.');

    const domain = existing;
    if (dto.cod_remate  !== undefined) domain.code        = dto.cod_remate;
    if (dto.descripcion !== undefined) domain.description = dto.descripcion;
    if (dto.estado      !== undefined) domain.status      = dto.estado;

    if (dto.detalles && Array.isArray(dto.detalles) && dto.detalles.length > 0) {
      for (const dtoDetalle of dto.detalles) {
        const idx = domain.details.findIndex(d =>
          ((dtoDetalle.id_detalle_remate) && (d as any).id_detalle_remate === dtoDetalle.id_detalle_remate) ||
          ((dtoDetalle.id_producto)       && d.productId === dtoDetalle.id_producto)
        );
        if (idx !== -1) {
          domain.details[idx] = {
            ...domain.details[idx],
            auctionPrice:  dtoDetalle.pre_remate   ?? domain.details[idx].auctionPrice,
            auctionStock:  dtoDetalle.stock_remate ?? domain.details[idx].auctionStock,
            originalPrice: dtoDetalle.pre_original ?? domain.details[idx].originalPrice,
          };
        }
      }
    }

    const saved = await this.repository.save(domain);
    return AuctionMapper.toResponseDto(saved);
  }

  async finalize(id: number): Promise<AuctionResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new BadRequestException('Subasta no encontrada.');
    existing.finalize();
    const saved = await this.repository.save(existing);
    return AuctionMapper.toResponseDto(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}