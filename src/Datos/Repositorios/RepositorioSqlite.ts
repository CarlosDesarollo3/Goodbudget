import { AvanceObjetivoPresupuesto, Categoria, Cuenta, Grupo, ObjetivoPresupuesto, ReglaRecurrente, Transaccion, TipoTransaccion } from '@/Dominio/Modelos';
import { ErrorDatos, RegistrarLogDesarrollo } from '@/Utilidades/Errores';
import { ObtenerBd } from '../Bd/ConexionBd';
import {
  RepositorioCategorias,
  RepositorioConfiguracion,
  RepositorioObjetivosPresupuesto,
  RepositorioReglas,
  RepositorioSobres,
  RepositorioTransacciones
} from './RepositorioTipos';

const MapearBooleano = (valor: number): boolean => valor === 1;

const ObtenerMesReferencia = (fecha = new Date()): string => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

const ObtenerRangoMes = (mesReferencia: string): { inicio: string; fin: string; mesAnterior: string } => {
  const [anioTexto, mesTexto] = mesReferencia.split('-');
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const inicioFecha = new Date(anio, mes - 1, 1);
  const finFecha = new Date(anio, mes, 1);
  const anteriorFecha = new Date(anio, mes - 2, 1);

  const formatear = (fecha: Date): string => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

  return {
    inicio: inicioFecha.toISOString(),
    fin: finFecha.toISOString(),
    mesAnterior: formatear(anteriorFecha)
  };
};

export class RepositorioSqlite
  implements RepositorioSobres, RepositorioTransacciones, RepositorioCategorias, RepositorioReglas, RepositorioConfiguracion, RepositorioObjetivosPresupuesto
{
  private bd = ObtenerBd();

  ListarGrupos(): Grupo[] {
    try {
      return this.bd.getAllSync<Grupo>('SELECT * FROM grupos ORDER BY nombre');
    } catch (error) {
      throw new ErrorDatos('No se pudieron listar los grupos', error);
    }
  }

  ListarCuentasPorGrupo(idGrupoPadre: string | null): Cuenta[] {
    try {
      if (idGrupoPadre === null) {
        return this.bd.getAllSync<Cuenta>('SELECT * FROM cuentas WHERE idGrupoPadre IS NULL ORDER BY nombre');
      }

      return this.bd.getAllSync<Cuenta>('SELECT * FROM cuentas WHERE idGrupoPadre = ? ORDER BY nombre', [idGrupoPadre]);
    } catch (error) {
      throw new ErrorDatos('No se pudieron listar las cuentas', error);
    }
  }

  CrearGrupo(grupo: Grupo): void {
    try {
      this.bd.runSync('INSERT INTO grupos (id,nombre,idGrupoPadre,creadoEn) VALUES (?,?,?,?)', [
        grupo.id,
        grupo.nombre,
        grupo.idGrupoPadre,
        grupo.creadoEn
      ]);
    } catch (error) {
      throw new ErrorDatos('No se pudo crear el grupo', error);
    }
  }

  CrearCuenta(cuenta: Cuenta): void {
    try {
      this.bd.runSync('INSERT INTO cuentas (id,nombre,idGrupoPadre,creadoEn) VALUES (?,?,?,?)', [
        cuenta.id,
        cuenta.nombre,
        cuenta.idGrupoPadre,
        cuenta.creadoEn
      ]);
    } catch (error) {
      RegistrarLogDesarrollo('Error al crear cuenta en RepositorioSqlite', error);
      throw new ErrorDatos('No se pudo crear la cuenta', error);
    }
  }

  ActualizarNombreGrupo(idGrupo: string, nombre: string): void {
    this.bd.runSync('UPDATE grupos SET nombre = ? WHERE id = ?', [nombre, idGrupo]);
  }

  ActualizarGrupoPadre(idGrupo: string, idGrupoPadre: string | null): void {
    this.bd.runSync('UPDATE grupos SET idGrupoPadre = ? WHERE id = ?', [idGrupoPadre, idGrupo]);
  }

  ActualizarNombreCuenta(idCuenta: string, nombre: string): void {
    this.bd.runSync('UPDATE cuentas SET nombre = ? WHERE id = ?', [nombre, idCuenta]);
  }

  CrearTransaccion(transaccion: Transaccion): void {
    try {
      this.bd.runSync(
        `INSERT INTO transacciones
          (id,tipo,monto,idCuentaOrigen,idCuentaDestino,idCategoria,nota,fecha,creadoEn,referenciaIdempotencia)
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          transaccion.id,
          transaccion.tipo,
          transaccion.monto,
          transaccion.idCuentaOrigen,
          transaccion.idCuentaDestino,
          transaccion.idCategoria,
          transaccion.nota,
          transaccion.fecha,
          transaccion.creadoEn,
          transaccion.referenciaIdempotencia
        ]
      );
    } catch (error) {
      throw new ErrorDatos('No se pudo registrar la transacción', error);
    }
  }

  ListarTransaccionesPorCuenta(idCuenta: string): Transaccion[] {
    try {
      return this.bd.getAllSync<Transaccion>(
        `SELECT * FROM transacciones
         WHERE idCuentaOrigen = ? OR idCuentaDestino = ?
         ORDER BY fecha DESC, creadoEn DESC`,
        [idCuenta, idCuenta]
      );
    } catch (error) {
      throw new ErrorDatos('No se pudieron listar las transacciones', error);
    }
  }

  ExisteReferenciaIdempotencia(referenciaIdempotencia: string): boolean {
    const resultado = this.bd.getFirstSync<{ total: number }>(
      'SELECT COUNT(*) as total FROM transacciones WHERE referenciaIdempotencia = ?',
      [referenciaIdempotencia]
    );
    return (resultado?.total ?? 0) > 0;
  }

  ListarCategorias(): Categoria[] {
    return this.bd.getAllSync<Categoria>('SELECT * FROM categorias ORDER BY nombre');
  }

  CrearCategoria(categoria: Categoria): void {
    this.bd.runSync('INSERT INTO categorias (id,nombre,color,icono,creadoEn) VALUES (?,?,?,?,?)', [
      categoria.id,
      categoria.nombre,
      categoria.color,
      categoria.icono,
      categoria.creadoEn
    ]);
  }

  EliminarCategoria(idCategoria: string): void {
    this.bd.runSync('DELETE FROM categorias WHERE id = ?', [idCategoria]);
  }

  ObtenerCuenta(idCuenta: string): Cuenta | null {
    return this.bd.getFirstSync<Cuenta>('SELECT * FROM cuentas WHERE id = ?', [idCuenta]) ?? null;
  }

  ActualizarCuentaPadre(idCuenta: string, idGrupoPadre: string | null): void {
    this.bd.runSync('UPDATE cuentas SET idGrupoPadre = ? WHERE id = ?', [idGrupoPadre, idCuenta]);
  }

  EliminarGrupo(idGrupo: string): void {
    try {
      const cuentas = this.bd.getAllSync<Cuenta>('SELECT id FROM cuentas WHERE idGrupoPadre = ?', [idGrupo]);
      cuentas.forEach((cuenta) => this.EliminarCuenta(cuenta.id));

      const subgrupos = this.bd.getAllSync<Grupo>('SELECT id FROM grupos WHERE idGrupoPadre = ?', [idGrupo]);
      subgrupos.forEach((subgrupo) => this.EliminarGrupo(subgrupo.id));

      this.bd.runSync('DELETE FROM grupos WHERE id = ?', [idGrupo]);
    } catch (error) {
      throw new ErrorDatos('No se pudo eliminar el grupo', error);
    }
  }

  EliminarCuenta(idCuenta: string): void {
    try {
      // borrar transacciones relacionadas primero
      this.bd.runSync('DELETE FROM transacciones WHERE idCuentaOrigen = ? OR idCuentaDestino = ?', [idCuenta, idCuenta]);
      this.bd.runSync('DELETE FROM cuentas WHERE id = ?', [idCuenta]);
    } catch (error) {
      throw new ErrorDatos('No se pudo eliminar la cuenta', error);
    }
  }

  ActualizarTransaccion(transaccion: Transaccion): void {
    try {
      this.bd.runSync(
        `UPDATE transacciones
         SET tipo = ?, monto = ?, idCuentaOrigen = ?, idCuentaDestino = ?, idCategoria = ?, nota = ?, fecha = ?
         WHERE id = ?`,
        [
          transaccion.tipo,
          transaccion.monto,
          transaccion.idCuentaOrigen,
          transaccion.idCuentaDestino,
          transaccion.idCategoria,
          transaccion.nota,
          transaccion.fecha,
          transaccion.id
        ]
      );
    } catch (error) {
      throw new ErrorDatos('No se pudo actualizar la transacción', error);
    }
  }

  EliminarTransaccion(idTransaccion: string): void {
    try {
      this.bd.runSync('DELETE FROM transacciones WHERE id = ?', [idTransaccion]);
    } catch (error) {
      throw new ErrorDatos('No se pudo eliminar la transacción', error);
    }
  }

  ListarReglas(): ReglaRecurrente[] {
    const filas = this.bd.getAllSync<(Omit<ReglaRecurrente, 'habilitada'> & { habilitada: number })>(
      'SELECT * FROM reglasRecurrentes ORDER BY creadoEn DESC'
    );
    return filas.map((fila) => ({ ...fila, habilitada: MapearBooleano(fila.habilitada) }));
  }

  GuardarRegla(regla: ReglaRecurrente): void {
    this.bd.runSync(
      `INSERT INTO reglasRecurrentes
      (id,habilitada,frecuencia,diaDelMes,idCuentaOrigen,idCuentaDestino,monto,etiqueta,ultimaEjecucionEn,proximaEjecucionEn,creadoEn)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        regla.id,
        regla.habilitada ? 1 : 0,
        regla.frecuencia,
        regla.diaDelMes,
        regla.idCuentaOrigen,
        regla.idCuentaDestino,
        regla.monto,
        regla.etiqueta,
        regla.ultimaEjecucionEn,
        regla.proximaEjecucionEn,
        regla.creadoEn
      ]
    );
  }

  ActualizarRegla(regla: ReglaRecurrente): void {
    this.bd.runSync(
      `UPDATE reglasRecurrentes
       SET habilitada = ?, diaDelMes = ?, idCuentaOrigen = ?, idCuentaDestino = ?, monto = ?,
           etiqueta = ?, ultimaEjecucionEn = ?, proximaEjecucionEn = ?
       WHERE id = ?`,
      [
        regla.habilitada ? 1 : 0,
        regla.diaDelMes,
        regla.idCuentaOrigen,
        regla.idCuentaDestino,
        regla.monto,
        regla.etiqueta,
        regla.ultimaEjecucionEn,
        regla.proximaEjecucionEn,
        regla.id
      ]
    );
  }


  ListarObjetivosPresupuesto(): ObjetivoPresupuesto[] {
    const filas = this.bd.getAllSync<(Omit<ObjetivoPresupuesto, 'rolloverHabilitado' | 'activo'> & { rolloverHabilitado: number; activo: number })>(
      'SELECT * FROM objetivosPresupuesto ORDER BY creadoEn DESC'
    );
    return filas.map((fila) => ({
      ...fila,
      rolloverHabilitado: MapearBooleano(fila.rolloverHabilitado),
      activo: MapearBooleano(fila.activo)
    }));
  }

  GuardarObjetivoPresupuesto(objetivo: ObjetivoPresupuesto): void {
    this.bd.runSync(
      `INSERT INTO objetivosPresupuesto
       (id,idCuenta,idCategoria,montoMensual,umbralAlerta,rolloverHabilitado,activo,creadoEn,actualizadoEn)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        objetivo.id,
        objetivo.idCuenta,
        objetivo.idCategoria,
        objetivo.montoMensual,
        objetivo.umbralAlerta,
        objetivo.rolloverHabilitado ? 1 : 0,
        objetivo.activo ? 1 : 0,
        objetivo.creadoEn,
        objetivo.actualizadoEn
      ]
    );
  }

  ActualizarObjetivoPresupuesto(objetivo: ObjetivoPresupuesto): void {
    this.bd.runSync(
      `UPDATE objetivosPresupuesto
       SET idCuenta = ?, idCategoria = ?, montoMensual = ?, umbralAlerta = ?, rolloverHabilitado = ?, activo = ?, actualizadoEn = ?
       WHERE id = ?`,
      [
        objetivo.idCuenta,
        objetivo.idCategoria,
        objetivo.montoMensual,
        objetivo.umbralAlerta,
        objetivo.rolloverHabilitado ? 1 : 0,
        objetivo.activo ? 1 : 0,
        objetivo.actualizadoEn,
        objetivo.id
      ]
    );
  }

  EliminarObjetivoPresupuesto(idObjetivo: string): void {
    this.bd.runSync('DELETE FROM objetivosPresupuesto WHERE id = ?', [idObjetivo]);
  }

  CalcularAvanceObjetivo(idObjetivo: string, mesReferencia = ObtenerMesReferencia()): AvanceObjetivoPresupuesto | null {
    const objetivo = this.ListarObjetivosPresupuesto().find((item) => item.id === idObjetivo);

    if (!objetivo || !objetivo.activo) {
      return null;
    }

    return this.ConstruirAvanceObjetivo(objetivo, mesReferencia);
  }

  ListarAvancesObjetivos(mesReferencia = ObtenerMesReferencia(), idCuenta?: string): AvanceObjetivoPresupuesto[] {
    const objetivos = this.ListarObjetivosPresupuesto().filter((objetivo) => objetivo.activo && (!idCuenta || objetivo.idCuenta === idCuenta));
    return objetivos
      .map((objetivo) => this.ConstruirAvanceObjetivo(objetivo, mesReferencia))
      .sort((a, b) => b.progreso - a.progreso);
  }

  private ObtenerGastoCategoriaEnMes(idCuenta: string, idCategoria: string, inicio: string, fin: string): number {
    const resultado = this.bd.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(monto), 0) as total
       FROM transacciones
       WHERE tipo = ?
         AND idCuentaOrigen = ?
         AND idCategoria = ?
         AND fecha >= ?
         AND fecha < ?`,
      [TipoTransaccion.GASTO, idCuenta, idCategoria, inicio, fin]
    );

    return resultado?.total ?? 0;
  }

  private ConstruirAvanceObjetivo(objetivo: ObjetivoPresupuesto, mesReferencia: string): AvanceObjetivoPresupuesto {
    const rangoMes = ObtenerRangoMes(mesReferencia);
    const gastoActual = this.ObtenerGastoCategoriaEnMes(objetivo.idCuenta, objetivo.idCategoria, rangoMes.inicio, rangoMes.fin);
    let presupuestoDisponible = objetivo.montoMensual;

    if (objetivo.rolloverHabilitado) {
      const rangoAnterior = ObtenerRangoMes(rangoMes.mesAnterior);
      const gastoMesAnterior = this.ObtenerGastoCategoriaEnMes(
        objetivo.idCuenta,
        objetivo.idCategoria,
        rangoAnterior.inicio,
        rangoAnterior.fin
      );
      const sobranteAnterior = Math.max(0, objetivo.montoMensual - gastoMesAnterior);
      presupuestoDisponible += sobranteAnterior;
    }

    const progreso = presupuestoDisponible <= 0 ? 0 : gastoActual / presupuestoDisponible;

    return {
      objetivo,
      mesReferencia,
      presupuestoDisponible,
      gastoActual,
      progreso,
      excedido: gastoActual > presupuestoDisponible,
      alertaUmbral: progreso >= objetivo.umbralAlerta
    };
  }

  ObtenerMoneda(): string {
    const fila = this.bd.getFirstSync<{ valor: string }>('SELECT valor FROM configuracion WHERE clave = ?', ['moneda']);
    return fila?.valor ?? 'MXN';
  }

  GuardarMoneda(moneda: string): void {
    this.bd.runSync('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?,?)', ['moneda', moneda]);
  }
}
