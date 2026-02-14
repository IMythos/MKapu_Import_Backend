// wastage-typeorm.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWastageRepositoryPort } from '../../../../domain/ports/out/wastage.port.out';
import { Wastage } from '../../../../domain/entity/wastage-domain-intity';
import { WastageOrmEntity } from '../../../entity/wastage-orm.entity';

@Injectable()
export class WastageTypeOrmRepository implements IWastageRepositoryPort {
  constructor(
    @InjectRepository(WastageOrmEntity)
    private readonly typeOrmRepository: Repository<WastageOrmEntity>,
  ) {}

  async save(domain: Wastage): Promise<Wastage> {
    const ormEntity = this.toOrmEntity(domain);
    const savedOrm = await this.typeOrmRepository.save(ormEntity);
    return this.toDomainEntity(savedOrm);
  }

  async findById(id: number): Promise<Wastage | null> {
    const orm = await this.typeOrmRepository.findOne({
      where: { id_merma: id },
      relations: ['detalles'],
    });
    return orm ? this.toDomainEntity(orm) : null;
  }

  async findAll(): Promise<Wastage[]> {
    const orms = await this.typeOrmRepository.find({ 
      relations: ['detalles'],
      order: { fec_merma: 'DESC' } 
    });
    return orms.map((orm) => this.toDomainEntity(orm));
  }

  async findAndCount(skip: number, take: number): Promise<[Wastage[], number]> {
    const [orms, total] = await this.typeOrmRepository.findAndCount({
      relations: ['detalles'],
      order: { fec_merma: 'DESC' },
      skip,
      take,
    });
    
    const domains = orms.map((orm) => this.toDomainEntity(orm));
    return [domains, total];
  }

  private toOrmEntity(domain: Wastage): WastageOrmEntity {
    const orm = new WastageOrmEntity();
    Object.assign(orm, domain);
    return orm;
  }

  private toDomainEntity(orm: WastageOrmEntity): Wastage {
    return new Wastage(
      orm.id_merma,
      orm.id_usuario_ref,
      orm.id_sede_ref,
      orm.id_almacen_ref,
      orm.motivo,
      orm.fec_merma,
      orm.estado,
      orm.detalles || []
    );
  }
}