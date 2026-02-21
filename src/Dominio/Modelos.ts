export enum TipoTransaccion {
  AJUSTE = 'AJUSTE',
  TRANSFERENCIA = 'TRANSFERENCIA',
  GASTO = 'GASTO',
  INGRESO = 'INGRESO'
}

export enum TipoNodo {
  GRUPO = 'GRUPO',
  CUENTA = 'CUENTA'
}

export enum FrecuenciaRegla {
  MENSUAL = 'MENSUAL'
}

export interface Grupo {
  id: string;
  nombre: string;
  idGrupoPadre: string | null;
  creadoEn: string;
}

export interface Cuenta {
  id: string;
  nombre: string;
  idGrupoPadre: string | null;
  creadoEn: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  color?: string;
  icono?: string;
  creadoEn: string;
}

export interface Transaccion {
  id: string;
  tipo: TipoTransaccion;
  monto: number;
  idCuentaOrigen?: string;
  idCuentaDestino?: string;
  idCategoria?: string;
  nota?: string;
  fecha: string;
  creadoEn: string;
  referenciaIdempotencia?: string;
}

export interface ReglaRecurrente {
  id: string;
  habilitada: boolean;
  frecuencia: FrecuenciaRegla;
  diaDelMes: number;
  idCuentaOrigen: string;
  idCuentaDestino: string;
  monto: number;
  etiqueta?: string;
  ultimaEjecucionEn?: string;
  proximaEjecucionEn: string;
  creadoEn: string;
}

export interface NodoResumen {
  id: string;
  nombre: string;
  tipoNodo: TipoNodo;
  idGrupoPadre: string | null;
  total: number;
}

export interface ObjetivoPresupuesto {
  id: string;
  idCuenta: string;
  idCategoria: string;
  montoMensual: number;
  umbralAlerta: number;
  rolloverHabilitado: boolean;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface AvanceObjetivoPresupuesto {
  objetivo: ObjetivoPresupuesto;
  mesReferencia: string;
  presupuestoDisponible: number;
  gastoActual: number;
  progreso: number;
  excedido: boolean;
  alertaUmbral: boolean;
}
