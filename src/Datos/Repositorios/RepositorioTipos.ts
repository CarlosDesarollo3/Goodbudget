import { AvanceObjetivoPresupuesto, Categoria, Cuenta, Grupo, ObjetivoPresupuesto, ReglaRecurrente, Transaccion } from '@/Dominio/Modelos';

export interface RepositorioSobres {
  ListarGrupos(): Grupo[];
  ListarCuentas(): Cuenta[];
  ListarCuentasPorGrupo(idGrupoPadre: string | null): Cuenta[];
  CrearGrupo(grupo: Grupo): void;
  CrearCuenta(cuenta: Cuenta): void;
  ActualizarNombreGrupo(idGrupo: string, nombre: string): void;
  ActualizarNombreCuenta(idCuenta: string, nombre: string): void;
  ObtenerCuenta(idCuenta: string): Cuenta | null;
  ActualizarCuentaPadre(idCuenta: string, idGrupoPadre: string | null): void;
  EliminarGrupo(idGrupo: string): void;
  EliminarCuenta(idCuenta: string): void;
}

export interface RepositorioTransacciones {
  CrearTransaccion(transaccion: Transaccion): void;
  ListarTransacciones(): Transaccion[];
  ListarTransaccionesPorCuenta(idCuenta: string): Transaccion[];
  ExisteReferenciaIdempotencia(referenciaIdempotencia: string): boolean;
  ActualizarTransaccion(transaccion: Transaccion): void;
  EliminarTransaccion(idTransaccion: string): void;
}

export interface RepositorioCategorias {
  ListarCategorias(): Categoria[];
  CrearCategoria(categoria: Categoria): void;
  ActualizarCategoria(categoria: Pick<Categoria, 'id' | 'nombre' | 'color' | 'icono'>): void;
  EliminarCategoria(idCategoria: string): void;
}

export interface RepositorioReglas {
  ListarReglas(): ReglaRecurrente[];
  GuardarRegla(regla: ReglaRecurrente): void;
  ActualizarRegla(regla: ReglaRecurrente): void;
  EliminarRegla(idRegla: string): void;
}

export interface RepositorioConfiguracion {
  ObtenerMoneda(): string;
  GuardarMoneda(moneda: string): void;
  ObtenerModoTema(): 'sistema' | 'claro' | 'oscuro';
  GuardarModoTema(modoTema: 'sistema' | 'claro' | 'oscuro'): void;
}

export interface RepositorioObjetivosPresupuesto {
  ListarObjetivosPresupuesto(): ObjetivoPresupuesto[];
  GuardarObjetivoPresupuesto(objetivo: ObjetivoPresupuesto): void;
  ActualizarObjetivoPresupuesto(objetivo: ObjetivoPresupuesto): void;
  EliminarObjetivoPresupuesto(idObjetivo: string): void;
  CalcularAvanceObjetivo(idObjetivo: string, mesReferencia?: string): AvanceObjetivoPresupuesto | null;
  ListarAvancesObjetivos(mesReferencia?: string, idCuenta?: string): AvanceObjetivoPresupuesto[];
}
