import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerQuoteRow,
  CustomerQuotesQuery,
  CustomerSaleRow,
  CustomerSalesQuery,
  ICustomerTrackingRepositoryPort,
} from '../../../../domain/ports/out/customer-port-out';
import { SalesReceiptOrmEntity } from '../../../../../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { QuoteOrmEntity } from '../../../../../quote/infrastructure/entity/quote-orm.entity';

@Injectable()
export class CustomerTrackingRepository implements ICustomerTrackingRepositoryPort {
  constructor(
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly salesReceiptRepository: Repository<SalesReceiptOrmEntity>,
    @InjectRepository(QuoteOrmEntity)
    private readonly quoteRepository: Repository<QuoteOrmEntity>,
  ) {}

  async findCustomerSalesPaginated(
    filters: CustomerSalesQuery,
    page: number,
    limit: number,
  ): Promise<[CustomerSaleRow[], number]> {
    const query = this.salesReceiptRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.cliente', 'customer')
      .where('customer.id_cliente = :customerId', {
        customerId: filters.customerId,
      });

    if (filters.dateFrom) {
      query.andWhere('sale.fec_emision >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      query.andWhere('sale.fec_emision <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    const total = await query.getCount();
    const rows = await query
      .clone()
      .select([
        'sale.id_comprobante AS id_comprobante',
        'sale.serie AS serie',
        'sale.numero AS numero',
        'sale.fec_emision AS fec_emision',
        'sale.total AS total',
        'sale.estado AS estado',
      ])
      .orderBy('sale.fec_emision', 'DESC')
      .addOrderBy('sale.id_comprobante', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<CustomerSaleRow>();

    return [
      rows.map((row) => ({
        ...row,
        id_comprobante: Number(row.id_comprobante),
        numero: Number(row.numero),
        total: Number(row.total),
      })),
      total,
    ];
  }

  async findCustomerQuotesPaginated(
    filters: CustomerQuotesQuery,
    page: number,
    limit: number,
  ): Promise<[CustomerQuoteRow[], number]> {
    const query = this.quoteRepository
      .createQueryBuilder('quote')
      .where('quote.id_cliente = :customerId', {
        customerId: filters.customerId,
      });

    if (filters.dateFrom) {
      query.andWhere('quote.fec_emision >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      query.andWhere('quote.fec_emision <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    const total = await query.getCount();
    const rows = await query
      .clone()
      .select([
        'quote.id_cotizacion AS id_cotizacion',
        'quote.fec_emision AS fec_emision',
        'quote.total AS total',
        'quote.estado AS estado',
      ])
      .orderBy('quote.fec_emision', 'DESC')
      .addOrderBy('quote.id_cotizacion', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<CustomerQuoteRow>();

    return [
      rows.map((row) => ({
        ...row,
        id_cotizacion: Number(row.id_cotizacion),
        total: Number(row.total),
      })),
      total,
    ];
  }
}
