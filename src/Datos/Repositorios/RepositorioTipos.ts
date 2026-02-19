import { Categoria, Cuenta, Grupo, ReglaRecurrente, Transaccion } from '@/Dominio/Modelos';

export interface RepositorioSobres {
  ListarGrupos(): Grupo[];
  ListarCuentasPorGrupo(idGrupoPadre: string): Cuenta[];
  CrearGrupo(grupo: Grupo): void;
  CrearCuenta(cuenta: Cuenta): void;
  EliminarCuenta(idCuenta: string): void;
}

export interface RepositorioTransacciones {
  CrearTransaccion(transaccion: Transaccion): void;
  ListarTransaccionesPorCuenta(idCuenta: string): Transaccion[];
  ExisteReferenciaIdempotencia(referenciaIdempotencia: string): boolean;
  ActualizarTransaccion(transaccion: Transaccion): void;
  EliminarTransaccion(idTransaccion: string): void;
}

export interface RepositorioCategorias {
  ListarCategorias(): Categoria[];
  CrearCategoria(categoria: Categoria): void;
  EliminarCategoria(idCategoria: string): void;
}

export interface RepositorioReglas {
  ListarReglas(): ReglaRecurrente[];
  GuardarRegla(regla: ReglaRecurrente): void;
  ActualizarRegla(regla: ReglaRecurrente): void;
}

export interface RepositorioConfiguracion {
  ObtenerMoneda(): string;
  GuardarMoneda(moneda: string): void;
}
