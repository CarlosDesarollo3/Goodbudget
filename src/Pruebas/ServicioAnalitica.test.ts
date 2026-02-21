import { TipoTransaccion, Transaccion } from '@/Dominio/Modelos';
import { GenerarResumenAnalitica } from '@/Servicios/ServicioAnalitica';

describe('ServicioAnalitica', () => {
  it('calcula agregaciones y KPIs principales', () => {
    const transacciones: Transaccion[] = [
      { id: '1', tipo: TipoTransaccion.GASTO, monto: 300, idCuentaOrigen: 'c1', idCategoria: 'cat1', fecha: '2024-01-05', creadoEn: '2024-01-05' },
      { id: '2', tipo: TipoTransaccion.GASTO, monto: 100, idCuentaOrigen: 'c2', idCategoria: 'cat2', fecha: '2024-01-15', creadoEn: '2024-01-15' },
      { id: '3', tipo: TipoTransaccion.INGRESO, monto: 900, idCuentaDestino: 'c1', fecha: '2024-01-20', creadoEn: '2024-01-20' },
      { id: '4', tipo: TipoTransaccion.GASTO, monto: 200, idCuentaOrigen: 'c1', idCategoria: 'cat1', fecha: '2024-02-02', creadoEn: '2024-02-02' }
    ];

    const resumen = GenerarResumenAnalitica(transacciones, [{ id: 'cat1', nombre: 'Comida', creadoEn: '' }, { id: 'cat2', nombre: 'Transporte', creadoEn: '' }], [
      { id: 'c1', nombre: 'Principal', idGrupoPadre: null, creadoEn: '' },
      { id: 'c2', nombre: 'Secundaria', idGrupoPadre: null, creadoEn: '' }
    ]);

    expect(resumen.gastoPorCategoria[0]).toMatchObject({ nombre: 'Comida', total: 500 });
    expect(resumen.evolucionMensual).toHaveLength(2);
    expect(resumen.topCuentas[0]).toMatchObject({ idCuenta: 'c1', totalGasto: 500 });
    expect(resumen.ahorroNeto).toBe(300);
    expect(resumen.gastoPromedio).toBe(300);
  });
});
