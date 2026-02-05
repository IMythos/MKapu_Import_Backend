/* sales/src/core/sales-receipt/infrastructure/adapters/out/TCP/logistics-stock.proxy.ts */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable()
export class LogisticsStockProxy implements OnModuleInit {
  constructor(
    @Inject('LOGISTICS_SERVICE') private readonly client: ClientProxy,
  ) {}

  // Esto asegura que Sales intente conectar a Logistics apenas arranque el módulo
  async onModuleInit() {
    try {
      await this.client.connect();
      console.log('✅ Sales conectado exitosamente al bus TCP de Logística');
    } catch (err) {
      console.error('❌ Sales no pudo conectar al bus TCP de Logística:', err.message);
    }
  }

  async registerMovement(data: any): Promise<void> {
    try {
      const pattern = { cmd: 'register_movement' };
      
      // Enviamos y esperamos respuesta con un tiempo límite de 5 segundos
      await lastValueFrom(
        this.client.send(pattern, data).pipe(timeout(5000))
      );
      
    } catch (error) {
      // Si el error es un timeout o conexión cerrada
      const errorMsg = error.name === 'TimeoutError' 
        ? 'Tiempo de espera agotado (Logística no respondió)' 
        : (error.message || 'Conexión cerrada abruptamente');
      
      console.error(`[LogisticsStockProxy] Error: ${errorMsg}`);
      throw new Error(`No se pudo registrar el movimiento de stock: ${errorMsg}`);
    }
  }
}