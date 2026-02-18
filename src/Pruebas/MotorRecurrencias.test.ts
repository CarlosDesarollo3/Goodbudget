import { MotorRecurrencias } from '@/Servicios/MotorRecurrencias';
import { FrecuenciaRegla, ReglaRecurrente, Transaccion } from '@/Dominio/Modelos';
import { RepositorioReglas, RepositorioTransacciones } from '@/Datos/Repositorios/RepositorioTipos';

class RepositorioReglasMemoria implements RepositorioReglas {
  constructor(public reglas: ReglaRecurrente[]) {}
  ListarReglas(): ReglaRecurrente[] { return this.reglas; }
  GuardarRegla(): void {}
  ActualizarRegla(regla: ReglaRecurrente): void {
    this.reglas = this.reglas.map((item) => (item.id === regla.id ? regla : item));
  }
}

class RepositorioTransaccionesMemoria implements RepositorioTransacciones {
  public transacciones: Transaccion[] = [];
  CrearTransaccion(transaccion: Transaccion): void { this.transacciones.push(transaccion); }
  ListarTransaccionesPorCuenta(): Transaccion[] { return []; }
  ExisteReferenciaIdempotencia(referenciaIdempotencia: string): boolean {
    return this.transacciones.some((item) => item.referenciaIdempotencia === referenciaIdempotencia);
  }
}

describe('MotorRecurrencias', () => {
  it('Ejecuta solo una vez por referencia idempotente', () => {
    const regla: ReglaRecurrente = {
      id: 'r1', habilitada: true, frecuencia: FrecuenciaRegla.MENSUAL, diaDelMes: 15,
      idCuentaOrigen: 'A', idCuentaDestino: 'B', monto: 50, proximaEjecucionEn: '2024-03-15T00:00:00Z', creadoEn: '2024-01-01T00:00:00Z'
    };

    const repositorioReglas = new RepositorioReglasMemoria([regla]);
    const repositorioTransacciones = new RepositorioTransaccionesMemoria();
    const motor = new MotorRecurrencias(repositorioReglas, repositorioTransacciones);

    expect(motor.EjecutarReglasPendientes(new Date('2024-03-16T00:00:00Z'))).toBe(1);
    expect(motor.EjecutarReglasPendientes(new Date('2024-03-16T00:00:00Z'))).toBe(0);
  });
});
