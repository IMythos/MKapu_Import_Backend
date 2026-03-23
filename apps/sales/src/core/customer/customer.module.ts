import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerCommandService } from './application/service/customer-command.service';
import { CustomerQueryService } from './application/service/customer-query.service';
import { CustomerRestController } from './infrastructure/adapters/in/controllers/customer-rest.controller';
import { CustomerRepository } from './infrastructure/adapters/out/repository/customer.repository';
import { CustomerTrackingRepository } from './infrastructure/adapters/out/repository/customer-tracking.repository';
import { DocumentTypeRepository } from './infrastructure/adapters/out/repository/document.type.reporsitoy';
import { CustomerOrmEntity } from './infrastructure/entity/customer-orm.entity';
import { DocumentTypeOrmEntity } from './infrastructure/entity/document-type-orm.entity';
import { SalesReceiptOrmEntity } from '../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';
import { QuoteOrmEntity } from '../quote/infrastructure/entity/quote-orm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOrmEntity,
      DocumentTypeOrmEntity,
      SalesReceiptOrmEntity,
      QuoteOrmEntity,
    ]),
  ],
  controllers: [CustomerRestController],
  providers: [
    {
      provide: 'ICustomerCommandPort',
      useClass: CustomerCommandService,
    },
    CustomerCommandService,
    {
      provide: 'ICustomerQueryPort',
      useClass: CustomerQueryService,
    },
    CustomerQueryService,
    {
      provide: 'ICustomerRepositoryPort',
      useClass: CustomerRepository,
    },
    {
      provide: 'IDocumentTypeRepositoryPort',
      useClass: DocumentTypeRepository,
    },
    {
      provide: 'ICustomerTrackingRepositoryPort',
      useClass: CustomerTrackingRepository,
    },
  ],
  exports: [
    'ICustomerCommandPort',
    'ICustomerQueryPort',
    'ICustomerRepositoryPort',
    'IDocumentTypeRepositoryPort',
    'ICustomerTrackingRepositoryPort',
    CustomerCommandService,
    CustomerQueryService,
  ],
})
export class CustomerModule {}
