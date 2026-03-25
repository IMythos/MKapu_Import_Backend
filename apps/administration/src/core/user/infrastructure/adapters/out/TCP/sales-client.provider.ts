import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export const SalesClientProvider: Provider = {
  provide: 'SALES_SERVICE',
  useFactory: (configService: ConfigService) => {
    const host =
      configService.get<string>('SALES_TCP_HOST') ||
      configService.get<string>('SALES_HOST') ||
      'localhost';

    const port = Number(configService.get<string>('SALES_TCP_PORT') || 3012);

    return ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host, port },
    });
  },
  inject: [ConfigService],
};
