/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { GetEmpresaService } from 'apps/administration/src/core/company/application/service/query/get-empresa.service';

@Controller()
export class EmpresaTcpController {
  private readonly logger = new Logger(EmpresaTcpController.name);

  constructor(private readonly getEmpresaService: GetEmpresaService) {}

  @MessagePattern('get_empresa_activa')
  async getEmpresaActiva() {
    this.logger.log('📡 [TCP] Solicitud recibida: get_empresa_activa');
    try {
      // Usamos tu servicio existente en Administración para obtener la empresa
      const response = await this.getEmpresaService.execute();
      return { ok: true, data: response };
    } catch (error) {
      this.logger.error(`❌ Error en TCP get_empresa_activa: ${error.message}`);
      return { ok: false, message: error.message, data: null };
    }
  }
}
