import { Grupo, TipoTransaccion, Transaccion } from '@/Dominio/Modelos';

export interface FuenteCuentas {
  id: string;
  idGrupoPadre: string;
}

export const CalcularBalanceCuenta = (idCuenta: string, transacciones: Transaccion[]): number => {
  return transacciones.reduce((acumulado, transaccion) => {
    switch (transaccion.tipo) {
      case TipoTransaccion.AJUSTE:
        return transaccion.idCuentaDestino === idCuenta ? transaccion.monto : acumulado;
      case TipoTransaccion.TRANSFERENCIA:
        if (transaccion.idCuentaOrigen === idCuenta) {
          return acumulado - transaccion.monto;
        }
        if (transaccion.idCuentaDestino === idCuenta) {
          return acumulado + transaccion.monto;
        }
        return acumulado;
      case TipoTransaccion.GASTO:
        return transaccion.idCuentaOrigen === idCuenta ? acumulado - transaccion.monto : acumulado;
      case TipoTransaccion.INGRESO:
        if (transaccion.idCuentaDestino === idCuenta) {
          return acumulado + transaccion.monto;
        }
        return transaccion.idCuentaOrigen === idCuenta ? acumulado + transaccion.monto : acumulado;
      default:
        return acumulado;
    }
  }, 0);
};

export const CalcularTotalesGrupoRecursivo = (
  idGrupo: string,
  grupos: Grupo[],
  cuentas: FuenteCuentas[],
  mapaBalancesCuenta: Record<string, number>
): number => {
  const totalCuentas = cuentas
    .filter((cuenta) => cuenta.idGrupoPadre === idGrupo)
    .reduce((sumatoria, cuenta) => sumatoria + (mapaBalancesCuenta[cuenta.id] ?? 0), 0);

  const totalSubgrupos = grupos
    .filter((grupo) => grupo.idGrupoPadre === idGrupo)
    .reduce((sumatoria, grupoHijo) => sumatoria + CalcularTotalesGrupoRecursivo(grupoHijo.id, grupos, cuentas, mapaBalancesCuenta), 0);

  return totalCuentas + totalSubgrupos;
};
