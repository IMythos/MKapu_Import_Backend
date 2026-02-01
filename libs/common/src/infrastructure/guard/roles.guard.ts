/* auth/src/core/infrastructure/guard/roles.guard.ts */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../..';

@Injectable()
export class RoleGuard {
  constructor(private reflector: Reflector) {}
  private readonly rolePermissions = {
    VENDEDOR: ['REGISTRAR_VENTA', 'GENERAR_COTIZACION', 'BUSCAR_PRODUCTOS', 'REGISTRAR_RECLAMO', 'REGISTRAR_GARANTIA'],
    CAJERO: ['ABRIR_CAJA', 'CERRAR_CAJA', 'GESTIONAR_CAJA_CHICA', 'GENERAR_COTIZACION', 'BUSCAR_PRODUCTOS'],
    ALMACENERO: ['VER_STOCK', 'REGISTRAR_ENTRADA', 'REGISTRAR_SALIDA', 'VER_MOVIMIENTOS', 'CLASIFICAR_PRODUCTO'],
    'JEFE DE ALMACEN': ['VER_STOCK', 'REGISTRAR_ENTRADA', 'REGISTRAR_SALIDA', 'APROBAR_GARANTIA', 'VER_MOVIMIENTOS'],
    ADMINISTRADOR: ['*']
  };
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const userRoleHeader = request.headers['x-role'];
    if (!userRoleHeader) {
      throw new UnauthorizedException('Faltan credenciales de rol (x-role)');
    }
    return requiredRoles.includes(userRoleHeader);
  }
}
