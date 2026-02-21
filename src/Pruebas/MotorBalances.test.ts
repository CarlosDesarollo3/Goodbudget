import { CalcularBalanceCuenta } from '@/Servicios/MotorBalances';
import { TipoTransaccion, Transaccion } from '@/Dominio/Modelos';

describe('MotorBalances', () => {
  it('Calcula balance con ajuste, transferencia y gasto', () => {
    const transacciones: Transaccion[] = [
      { id: '1', tipo: TipoTransaccion.AJUSTE, monto: 1000, idCuentaDestino: 'A', fecha: '2024-01-01', creadoEn: '2024-01-01' },
      { id: '2', tipo: TipoTransaccion.TRANSFERENCIA, monto: 200, idCuentaOrigen: 'A', idCuentaDestino: 'B', fecha: '2024-01-02', creadoEn: '2024-01-02' },
      { id: '3', tipo: TipoTransaccion.GASTO, monto: 100, idCuentaOrigen: 'A', fecha: '2024-01-03', creadoEn: '2024-01-03' }
    ];

    expect(CalcularBalanceCuenta('A', transacciones)).toBe(700);
    expect(CalcularBalanceCuenta('B', transacciones)).toBe(200);
  });

  it('Suma ingresos en cuenta destino (comportamiento esperado)', () => {
    const transacciones: Transaccion[] = [
      { id: 'ingreso', tipo: TipoTransaccion.INGRESO, monto: 350, idCuentaDestino: 'A', fecha: '2024-01-01', creadoEn: '2024-01-01' }
    ];

    expect(CalcularBalanceCuenta('A', transacciones)).toBe(350);
  });

  it('Suma ingresos legacy guardados en cuenta origen', () => {
    const transacciones: Transaccion[] = [
      { id: 'ingreso-legacy', tipo: TipoTransaccion.INGRESO, monto: 350, idCuentaOrigen: 'A', fecha: '2024-01-01', creadoEn: '2024-01-01' }
    ];

    expect(CalcularBalanceCuenta('A', transacciones)).toBe(350);
  });

  it('No duplica el ingreso si origen y destino apuntan a la misma cuenta', () => {
    const transacciones: Transaccion[] = [
      {
        id: 'ingreso-repetido',
        tipo: TipoTransaccion.INGRESO,
        monto: 400,
        idCuentaOrigen: 'A',
        idCuentaDestino: 'A',
        fecha: '2024-01-01',
        creadoEn: '2024-01-01'
      }
    ];

    expect(CalcularBalanceCuenta('A', transacciones)).toBe(400);
  });
});
