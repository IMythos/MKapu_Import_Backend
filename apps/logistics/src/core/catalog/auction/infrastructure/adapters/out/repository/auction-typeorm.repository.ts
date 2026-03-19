// infrastructure/adapters/out/repository/auction-typeorm.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IAuctionRepositoryPort } from '../../../../domain/port/out/auction.port.out';
import { Auction, AuctionStatus } from '../../../../domain/entity/auction-domain-entity';
import { ListAuctionFilterDto } from '../../../../application/dto/in/list-auction-filter.dto';
import { AuctionOrmEntity } from '../../../entity/auction-orm.entity';
import { AuctionDetailOrmEntity } from '../../../entity/auction-detail.orm.entity';

@Injectable()
export class AuctionTypeormRepository implements IAuctionRepositoryPort {
  private readonly logger = new Logger(AuctionTypeormRepository.name);

  constructor(
    @InjectRepository(AuctionOrmEntity)
    private readonly auctionRepo: Repository<AuctionOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ── orm → domain ──────────────────────────────────────────────────────────
  private toDomain(orm: AuctionOrmEntity): Auction {
    const details = (orm.detalles || []).map((d: AuctionDetailOrmEntity) => ({
      id_detalle_remate: d.id_detalle_remate,
      productId:         d.id_producto,
      originalPrice:     Number(d.pre_original),
      auctionPrice:      Number(d.pre_remate),
      auctionStock:      Number(d.stock_remate),
      observacion:       (d as any).observacion ?? undefined,
    }));

    // Constructor: (code, description, status?, id?, details?)
    return new Auction(
      orm.cod_remate,
      orm.descripcion,
      orm.estado as AuctionStatus,
      orm.id_remate,
      details,
    );
  }

  // ── domain → orm ──────────────────────────────────────────────────────────
  private mapDomainToOrm(domain: Auction, existing?: AuctionOrmEntity): AuctionOrmEntity {
    const orm = existing ?? new AuctionOrmEntity();

    orm.cod_remate  = domain.code;
    orm.descripcion = domain.description;
    orm.estado      = domain.status as any;

    orm.detalles = (domain.details || []).map((d) => {
      const detOrm = new AuctionDetailOrmEntity();
      if ((d as any).id_detalle_remate) {
        detOrm.id_detalle_remate = (d as any).id_detalle_remate;
      }
      detOrm.pre_original = d.originalPrice;
      detOrm.pre_remate   = d.auctionPrice;
      detOrm.stock_remate = d.auctionStock;
      detOrm.id_producto  = d.productId;
      return detOrm;
    });

    return orm;
  }

  // ── save ──────────────────────────────────────────────────────────────────
  async save(domain: Auction): Promise<Auction> {
    let existing: AuctionOrmEntity | null = null;
    if (domain.id) {
      existing = await this.auctionRepo.findOne({
        where: { id_remate: domain.id },
        relations: ['detalles'],
      });
    }

    const orm = this.mapDomainToOrm(domain, existing ?? undefined);

    if (domain.id) {
      orm.id_remate = domain.id;
      orm.detalles.forEach((d) => {
        (d as any).id_remate = domain.id;
      });
    }

    const savedOrm = await this.auctionRepo.save(orm);

    const reloaded = await this.auctionRepo.findOne({
      where: { id_remate: savedOrm.id_remate },
      relations: ['detalles'],
    });

    if (!reloaded) {
      this.logger.warn('Saved auction but could not reload entity.');
      return this.toDomain(savedOrm);
    }

    return this.toDomain(reloaded);
  }

  // ── findById ──────────────────────────────────────────────────────────────
  async findById(id: number): Promise<Auction | null> {
    const orm = await this.auctionRepo.findOne({
      where: { id_remate: id },
      relations: ['detalles'],
    });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  // ── findPaged ─────────────────────────────────────────────────────────────
  async findPaged(filters: ListAuctionFilterDto): Promise<{ items: Auction[]; total: number }> {
    const page  = filters.page  && filters.page  > 0 ? filters.page  : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const skip  = (page - 1) * limit;

    const qb = this.auctionRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.detalles', 'd');

    if (filters.search) {
      qb.andWhere('(r.cod_remate LIKE :search OR r.descripcion LIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.estado) {
      qb.andWhere('r.estado = :estado', { estado: filters.estado });
    }

    qb.orderBy('r.id_remate', 'DESC').skip(skip).take(limit);

    const [ormItems, total] = await qb.getManyAndCount();
    return { items: ormItems.map((o) => this.toDomain(o)), total };
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async delete(id: number): Promise<void> {
    await this.auctionRepo.delete({ id_remate: id });
  }
}