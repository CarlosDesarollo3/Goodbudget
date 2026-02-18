import { addMonths, endOfMonth, formatISO, setDate } from 'date-fns';
import { TipoTransaccion, ReglaRecurrente, Transaccion } from '@/Dominio/Modelos';
import { RepositorioReglas, RepositorioTransacciones } from '@/Datos/Repositorios/RepositorioTipos';
import { v4 as GenerarUuid } from 'uuid';

const CalcularProximaEjecucion = (fechaBase: Date, diaDelMes: number): string => {
  const proximoMes = addMonths(fechaBase, 1);
  const ultimoDia = Number(endOfMonth(proximoMes).getDate());
  const diaSeguro = Math.min(diaDelMes, ultimoDia);
  return formatISO(setDate(proximoMes, diaSeguro));
};

export class MotorRecurrencias {
  constructor(
    private readonly repositorioReglas: RepositorioReglas,
    private readonly repositorioTransacciones: RepositorioTransacciones
  ) {}

  EjecutarReglasPendientes(fechaActual: Date): number {
    const reglas = this.repositorioReglas.ListarReglas().filter((regla) => regla.habilitada);
    let totalEjecutadas = 0;

    reglas.forEach((regla) => {
      if (new Date(regla.proximaEjecucionEn) > fechaActual) {
        return;
      }

      const referenciaIdempotencia = `regla:${regla.id}:${regla.proximaEjecucionEn.slice(0, 10)}`;
      if (this.repositorioTransacciones.ExisteReferenciaIdempotencia(referenciaIdempotencia)) {
        return;
      }

      const transaccion: Transaccion = {
        id: GenerarUuid(),
        tipo: TipoTransaccion.TRANSFERENCIA,
        monto: regla.monto,
        idCuentaOrigen: regla.idCuentaOrigen,
        idCuentaDestino: regla.idCuentaDestino,
        nota: regla.etiqueta ?? 'Automática',
        fecha: regla.proximaEjecucionEn,
        creadoEn: formatISO(fechaActual),
        referenciaIdempotencia
      };

      this.repositorioTransacciones.CrearTransaccion(transaccion);
      const reglaActualizada: ReglaRecurrente = {
        ...regla,
        ultimaEjecucionEn: regla.proximaEjecucionEn,
        proximaEjecucionEn: CalcularProximaEjecucion(new Date(regla.proximaEjecucionEn), regla.diaDelMes)
      };
      this.repositorioReglas.ActualizarRegla(reglaActualizada);
      totalEjecutadas += 1;
    });

    return totalEjecutadas;
  }
}
