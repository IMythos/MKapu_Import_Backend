// infrastructure/entity/auction-orm.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AuctionDetailOrmEntity } from './auction-detail.orm.entity';

@Entity('remate')
export class AuctionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_remate' })
  id_remate!: number;

  @Column({ name: 'cod_remate', type: 'varchar', length: 20 })
  cod_remate!: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 150 })
  descripcion!: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ['ACTIVO', 'FINALIZADO'],
    default: 'ACTIVO',
  })
  estado!: 'ACTIVO' | 'FINALIZADO';

  @OneToMany(() => AuctionDetailOrmEntity, (d) => d.remate, {
    cascade: true,
    eager: false,
  })
  detalles!: AuctionDetailOrmEntity[];
}