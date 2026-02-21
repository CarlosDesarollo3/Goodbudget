import { Categoria, Cuenta, TipoTransaccion, Transaccion } from '@/Dominio/Modelos';
import { format, parseISO } from 'date-fns';

interface DatoCategoria {
  idCategoria: string;
  nombre: string;
  total: number;
  color: string;
}

interface DatoMensual {
  mes: string;
  gastos: number;
  ingresos: number;
}

interface DatoCuenta {
  idCuenta: string;
  nombre: string;
  totalGasto: number;
}

export interface ResumenAnalitica {
  gastoPorCategoria: DatoCategoria[];
  evolucionMensual: DatoMensual[];
  topCuentas: DatoCuenta[];
  ahorroNeto: number;
  gastoPromedio: number;
}

const PALETA_COLORES = ['#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#059669', '#0EA5E9'];

const ObtenerMes = (fecha: string): string => format(parseISO(fecha), 'yyyy-MM');

export const GenerarResumenAnalitica = (
  transacciones: Transaccion[],
  categorias: Categoria[],
  cuentas: Cuenta[]
): ResumenAnalitica => {
  const categoriasPorId = new Map(categorias.map((categoria) => [categoria.id, categoria]));
  const cuentasPorId = new Map(cuentas.map((cuenta) => [cuenta.id, cuenta]));

  const gastoPorCategoria = new Map<string, number>();
  const evolucionPorMes = new Map<string, { gastos: number; ingresos: number }>();
  const gastoPorCuenta = new Map<string, number>();

  let totalGastos = 0;
  let totalIngresos = 0;

  transacciones.forEach((transaccion) => {
    const mes = ObtenerMes(transaccion.fecha);
    const resumenMes = evolucionPorMes.get(mes) ?? { gastos: 0, ingresos: 0 };

    if (transaccion.tipo === TipoTransaccion.GASTO) {
      const claveCategoria = transaccion.idCategoria ?? '__SIN_CATEGORIA__';
      gastoPorCategoria.set(claveCategoria, (gastoPorCategoria.get(claveCategoria) ?? 0) + transaccion.monto);

      if (transaccion.idCuentaOrigen) {
        gastoPorCuenta.set(transaccion.idCuentaOrigen, (gastoPorCuenta.get(transaccion.idCuentaOrigen) ?? 0) + transaccion.monto);
      }

      resumenMes.gastos += transaccion.monto;
      totalGastos += transaccion.monto;
    }

    if (transaccion.tipo === TipoTransaccion.INGRESO) {
      resumenMes.ingresos += transaccion.monto;
      totalIngresos += transaccion.monto;
    }

    evolucionPorMes.set(mes, resumenMes);
  });

  const categoriasOrdenadas = Array.from(gastoPorCategoria.entries())
    .map(([idCategoria, total], indice) => ({
      idCategoria,
      nombre: categoriasPorId.get(idCategoria)?.nombre ?? 'Sin categoría',
      total,
      color: categoriasPorId.get(idCategoria)?.color ?? PALETA_COLORES[indice % PALETA_COLORES.length]
    }))
    .sort((a, b) => b.total - a.total);

  const evolucionMensual = Array.from(evolucionPorMes.entries())
    .map(([mes, valores]) => ({ mes, gastos: valores.gastos, ingresos: valores.ingresos }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  const topCuentas = Array.from(gastoPorCuenta.entries())
    .map(([idCuenta, totalGasto]) => ({
      idCuenta,
      nombre: cuentasPorId.get(idCuenta)?.nombre ?? 'Cuenta desconocida',
      totalGasto
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto)
    .slice(0, 3);

  return {
    gastoPorCategoria: categoriasOrdenadas,
    evolucionMensual,
    topCuentas,
    ahorroNeto: totalIngresos - totalGastos,
    gastoPromedio: evolucionMensual.length > 0 ? totalGastos / evolucionMensual.length : 0
  };
};
