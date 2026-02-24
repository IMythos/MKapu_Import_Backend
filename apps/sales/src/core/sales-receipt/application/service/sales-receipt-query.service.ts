/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ISalesReceiptQueryPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { ListSalesReceiptFilterDto } from '../dto/in';
import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptKpiDto,
  SalesReceiptSummaryListDto,
  SalesReceiptSummaryItemDto,
  SalesReceiptDetalleCompletoDto,
} from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';

import { UsersTcpProxy } from '../../infrastructure/adapters/out/TCP/users-tcp.proxy';
import { SedeTcpProxy } from '../../infrastructure/adapters/out/TCP/sede-tcp.proxy';

@Injectable()
export class SalesReceiptQueryService implements ISalesReceiptQueryPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,

    private readonly usersTcpProxy: UsersTcpProxy,
    private readonly sedeTcpProxy: SedeTcpProxy,
  ) {}

  async findSaleByCorrelativo(correlativo: string): Promise<any> {
    const parts = correlativo.split('-');
    if (parts.length !== 2) {
      throw new BadRequestException(
        'El formato del correlativo debe ser SERIE-NUMERO (Ej: F001-123)',
      );
    }
    const [serie, numeroStr] = parts;
    const numero = parseInt(numeroStr, 10);
    const sale = await this.receiptRepository.findByCorrelativo(serie, numero);
    if (!sale) {
      throw new NotFoundException(
        `No se encontró el comprobante ${correlativo}`,
      );
    }
    return {
      id: sale.id_comprobante,
      id_sede: sale.id_sede_ref,
      id_almacen: (sale as any).id_almacen || 1,
      cliente_direccion:
        (sale as any).direccion_entrega || 'Dirección no especificada',
      cliente_ubigeo: (sale as any).ubigeo_destino || '150101',
      detalles: sale.details.map((d) => ({
        id_producto: d.id_prod_ref,
        cod_prod: d.cod_prod,
        cantidad: d.cantidad,
        peso_unitario: d.id_prod_ref,
      })),
    };
  }

  async verifySaleForRemission(id: number): Promise<any> {
    const sale = await this.receiptRepository.findById(id);
    if (!sale) return null;
    return {
      id: sale.id_comprobante || id,
      detalles: (sale.items || []).map((item) => ({
        cod_prod: item.productId,
        cantidad: item.quantity,
      })),
    };
  }

  async findCustomerByDocument(documentNumber: string): Promise<any> {
    const customer =
      await this.customerRepository.findByDocument(documentNumber);
    if (!customer) {
      throw new NotFoundException(
        `No se encontró ningún cliente con el documento: ${documentNumber}`,
      );
    }
    return customer;
  }

  async listReceipts(
    filters?: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptListResponse> {
    const repoFilters = filters
      ? {
          estado: filters.status,
          id_cliente: filters.customerId,
          id_tipo_comprobante: filters.receiptTypeId,
          fec_desde: filters.dateFrom,
          fec_hasta: filters.dateTo,
          search: filters.search,
        }
      : undefined;

    const receipts = await this.receiptRepository.findAll(repoFilters);
    return {
      receipts: receipts.map((r) => SalesReceiptMapper.toResponseDto(r)),
      total: receipts.length,
    };
  }

  async getReceiptById(id: number): Promise<SalesReceiptResponseDto | null> {
    const receipt = await this.receiptRepository.findById(id);
    return receipt ? SalesReceiptMapper.toResponseDto(receipt) : null;
  }

  async getReceiptsBySerie(serie: string): Promise<SalesReceiptListResponse> {
    const receipts = await this.receiptRepository.findBySerie(serie);
    return {
      receipts: receipts.map((r) => SalesReceiptMapper.toResponseDto(r)),
      total: receipts.length,
    };
  }

  // ── KPI semanal ───────────────────────────────────────────────────────────
  async getKpiSemanal(sedeId?: number): Promise<SalesReceiptKpiDto> {
    const raw = await this.receiptRepository.getKpiSemanal(sedeId);

    const ahora = new Date();
    const diaSemana = ahora.getDay();
    const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;

    const lunes = new Date(ahora);
    lunes.setDate(ahora.getDate() - diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    return {
      total_ventas: raw.total_ventas,
      cantidad_ventas: raw.cantidad_ventas,
      total_boletas: raw.total_boletas,
      total_facturas: raw.total_facturas,
      semana_desde: lunes.toISOString().split('T')[0],
      semana_hasta: domingo.toISOString().split('T')[0],
    };
  }

    async listReceiptsPaginated(
    filters: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptSummaryListDto> {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;

      const [rows, total] = await this.receiptRepository.findAllPaginated(
        {
          estado:               filters.status,
          id_cliente:           filters.customerId,
          id_tipo_comprobante:  filters.receiptTypeId,
          id_metodo_pago:       filters.paymentMethodId,
          fec_desde:            filters.dateFrom,
          fec_hasta:            filters.dateTo,
          search:               filters.search,
          sedeId:               filters.sedeId,
        },
        page,
        limit,
      );

    // ── 1. Recolectar IDs únicos ────────────────────────────────────────────
    const responsableIds = [
      ...new Set(
        rows
          .map((r) => Number(r.id_responsable))
          .filter((n) => !Number.isNaN(n) && n > 0),
      ),
    ];

    const sedeIds = [...new Set(rows.map((r) => r.id_sede).filter(Boolean))];

    // ── 2. Llamadas TCP en paralelo ─────────────────────────────────────────
    const [usuarios, sedes] = await Promise.all([
      responsableIds.length > 0
        ? this.usersTcpProxy.findByIds(responsableIds)
        : Promise.resolve([]),
      Promise.all(
        sedeIds.map((id) =>
          this.sedeTcpProxy
            .getSedeById(id)
            .then((s) => ({ id_sede: id, nombre: s?.nombre ?? '—' })),
        ),
      ),
    ]);

    // ── 3. Mapas para lookup O(1) ───────────────────────────────────────────
    const usuarioMap = new Map(
      usuarios.map((u) => [u.id_usuario, u.nombreCompleto]),
    );
    const sedeMap = new Map(sedes.map((s) => [s.id_sede, s.nombre]));

    // ── 4. Construir respuesta enriquecida ──────────────────────────────────
    const receipts: SalesReceiptSummaryItemDto[] = rows.map((r) => ({
      idComprobante:      r.id_comprobante,
      numeroCompleto:     `${r.serie}-${String(r.numero).padStart(8, '0')}`,
      serie:              r.serie,
      numero:             r.numero,
      tipoComprobante:    r.tipo_comprobante,
      fecEmision:         r.fec_emision,
      clienteNombre:      r.cliente_nombre || '—',
      clienteDocumento:   r.cliente_doc,
      idResponsable:      r.id_responsable,
      responsableNombre:  usuarioMap.get(Number(r.id_responsable)) ?? '—',  // ← TCP
      idSede:             r.id_sede,
      sedeNombre:         sedeMap.get(r.id_sede) ?? '—',                    // ← TCP
      metodoPago:         r.metodo_pago,
      total:              r.total,
      estado:             r.estado,
    }));

    return {
      receipts,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getDetalleCompleto(
    id_comprobante: number,
  ): Promise<SalesReceiptDetalleCompletoDto | null> {
    const raw =
      await this.receiptRepository.findDetalleCompleto(id_comprobante);
    if (!raw) return null;

    const { comprobante, productos, historial } = raw;

    // ── Resuelve nombre del responsable via TCP ──────────────────────────
    const idResponsable = Number(comprobante.id_responsable);
    let nombreResponsable = `Usuario ${idResponsable}`;
    if (!Number.isNaN(idResponsable) && idResponsable > 0) {
      const usuarios = await this.usersTcpProxy.findByIds([idResponsable]);
      if (usuarios.length > 0) nombreResponsable = usuarios[0].nombreCompleto;
    }

    // ── Resuelve nombre de sede via TCP ──────────────────────────────────
    const idSede = Number(comprobante.id_sede);
    let nombreSede = `Sede ${idSede}`;
    const sedeInfo = await this.sedeTcpProxy.getSedeById(idSede);
    if (sedeInfo?.nombre) nombreSede = sedeInfo.nombre;

    // ── Nombre cliente: razon_social o nombres+apellidos ─────────────────
    const nombreCliente =
      comprobante.cliente_nombre?.trim() || comprobante.cliente_doc || '—';

    // ── Total gastado ────────────────────────────────────────────────────
    const totalHistorial = (historial as any[])
      .filter((h) => h.estado !== 'ANULADO')
      .reduce((sum, h) => sum + Number(h.total), 0);

    const totalGastado =
      comprobante.estado !== 'ANULADO'
        ? totalHistorial + Number(comprobante.total)
        : totalHistorial;

    const cantidadCompras =
      (historial as any[]).filter((h) => h.estado !== 'ANULADO').length +
      (comprobante.estado !== 'ANULADO' ? 1 : 0);

    return {
      id_comprobante: Number(comprobante.id_comprobante),
      numero_completo: `${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')}`,
      serie: comprobante.serie,
      numero: Number(comprobante.numero),
      tipo_comprobante: comprobante.tipo_comprobante ?? '—',
      fec_emision: comprobante.fec_emision,
      estado: comprobante.estado,
      subtotal: Number(comprobante.subtotal),
      igv: Number(comprobante.igv),
      total: Number(comprobante.total),
      metodo_pago: comprobante.metodo_pago,

      cliente: {
        id_cliente: comprobante.cliente_id,
        nombre: nombreCliente, // ← CORREGIDO
        documento: comprobante.cliente_doc,
        direccion: comprobante.cliente_direccion,
        email: comprobante.cliente_email,
        telefono: comprobante.cliente_telefono,
        total_gastado_cliente: totalGastado,
        cantidad_compras: cantidadCompras,
      },

      productos: (productos as any[]).map((p) => ({
        id_prod_ref: p.id_prod_ref,
        cod_prod: p.cod_prod,
        descripcion: p.descripcion,
        cantidad: Number(p.cantidad),
        precio_unit: Number(p.precio_unit),
        igv: Number(p.igv),
        total: Number(p.total),
      })),

      responsable: {
        id: comprobante.id_responsable,
        nombre: nombreResponsable, // ← NUEVO
        sede: idSede,
        nombreSede, // ← NUEVO
      },

      historial_cliente: (historial as any[]).map((h) => ({
        id_comprobante: Number(h.id_comprobante),
        numero_completo: `${h.serie}-${String(h.numero).padStart(8, '0')}`,
        fec_emision: h.fec_emision,
        total: Number(h.total),
        estado: h.estado,
        metodo_pago: h.metodo_pago,
      })),
    };
  }
}
