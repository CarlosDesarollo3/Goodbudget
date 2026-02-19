import { create } from 'zustand';
import { formatISO } from 'date-fns';
import { v4 as GenerarUuid } from 'uuid';
import { Categoria, Cuenta, FrecuenciaRegla, Grupo, ReglaRecurrente, TipoTransaccion, Transaccion } from '@/Dominio/Modelos';
import { RepositorioSqlite } from '@/Datos/Repositorios/RepositorioSqlite';
import { InicializarBd } from '@/Datos/Bd/ConexionBd';
import { CalcularBalanceCuenta } from '@/Servicios/MotorBalances';
import { MotorRecurrencias } from '@/Servicios/MotorRecurrencias';

interface EstadoAplicacion {
  grupos: Grupo[];
  cuentasPorGrupo: Record<string, Cuenta[]>;
  categorias: Categoria[];
  reglas: ReglaRecurrente[];
  transaccionesPorCuenta: Record<string, Transaccion[]>;
  moneda: string;
  errorUi?: string;
  InicializarDatos(): void;
  CrearGrupo(nombre: string, idGrupoPadre: string | null): void;
  CrearCuenta(nombre: string, idGrupoPadre: string | null): void;
  ConvertirCuentaEnGrupo(idCuenta: string): Grupo | null;
  EliminarCuenta(idCuenta: string): void;
  RegistrarTransaccion(datos: Omit<Transaccion, 'id' | 'creadoEn'>): void;
  ActualizarTransaccion(transaccion: Transaccion): void;
  EliminarTransaccion(idTransaccion: string): void;
  CrearCategoria(nombre: string, color?: string): void;
  CrearReglaRecurrente(regla: Omit<ReglaRecurrente, 'id' | 'frecuencia' | 'creadoEn'>): void;
  EjecutarReglasPendientes(): number;
  GuardarMoneda(moneda: string): void;
  ObtenerBalanceCuenta(idCuenta: string): number;
}

export const CLAVE_CUENTAS_RAIZ = '__RAIZ__';

const repositorio = new RepositorioSqlite();
const motorRecurrencias = new MotorRecurrencias(repositorio, repositorio);

export const UsarAlmacenAplicacion = create<EstadoAplicacion>((set, get) => ({
  grupos: [],
  cuentasPorGrupo: {},
  categorias: [],
  reglas: [],
  transaccionesPorCuenta: {},
  moneda: 'MXN',

  InicializarDatos: () => {
    InicializarBd();
    const grupos = repositorio.ListarGrupos();
    const cuentasPorGrupo = grupos.reduce<Record<string, Cuenta[]>>((acumulado, grupo) => {
      acumulado[grupo.id] = repositorio.ListarCuentasPorGrupo(grupo.id);
      return acumulado;
    }, {});
    cuentasPorGrupo[CLAVE_CUENTAS_RAIZ] = repositorio.ListarCuentasPorGrupo(null);

    const categorias = repositorio.ListarCategorias();
    const reglas = repositorio.ListarReglas();
    const moneda = repositorio.ObtenerMoneda();

    set({ grupos, cuentasPorGrupo, categorias, reglas, moneda });
  },

  CrearGrupo: (nombre, idGrupoPadre) => {
    const nuevoGrupo: Grupo = { id: GenerarUuid(), nombre, idGrupoPadre, creadoEn: formatISO(new Date()) };
    repositorio.CrearGrupo(nuevoGrupo);
    get().InicializarDatos();
  },

  CrearCuenta: (nombre, idGrupoPadre) => {
    const nuevaCuenta: Cuenta = { id: GenerarUuid(), nombre, idGrupoPadre, creadoEn: formatISO(new Date()) };
    repositorio.CrearCuenta(nuevaCuenta);
    get().InicializarDatos();
  },

  ConvertirCuentaEnGrupo: (idCuenta) => {
    const cuenta = repositorio.ObtenerCuenta(idCuenta);

    if (!cuenta) {
      return null;
    }

    const nuevoGrupo: Grupo = {
      id: GenerarUuid(),
      nombre: cuenta.nombre,
      idGrupoPadre: cuenta.idGrupoPadre,
      creadoEn: formatISO(new Date())
    };

    repositorio.CrearGrupo(nuevoGrupo);
    repositorio.ActualizarCuentaPadre(cuenta.id, nuevoGrupo.id);
    get().InicializarDatos();

    return nuevoGrupo;
  },

  EliminarCuenta: (idCuenta) => {
    repositorio.EliminarCuenta(idCuenta);
    get().InicializarDatos();
  },

  RegistrarTransaccion: (datos) => {
    const transaccion: Transaccion = { ...datos, id: GenerarUuid(), creadoEn: formatISO(new Date()) };
    repositorio.CrearTransaccion(transaccion);
    get().InicializarDatos();
  },

  ActualizarTransaccion: (transaccion) => {
    repositorio.ActualizarTransaccion(transaccion);
    get().InicializarDatos();
  },

  EliminarTransaccion: (idTransaccion) => {
    repositorio.EliminarTransaccion(idTransaccion);
    get().InicializarDatos();
  },

  CrearCategoria: (nombre, color) => {
    repositorio.CrearCategoria({ id: GenerarUuid(), nombre, color, creadoEn: formatISO(new Date()) });
    get().InicializarDatos();
  },

  CrearReglaRecurrente: (regla) => {
    const nuevaRegla: ReglaRecurrente = {
      ...regla,
      id: GenerarUuid(),
      frecuencia: FrecuenciaRegla.MENSUAL,
      creadoEn: formatISO(new Date())
    };
    repositorio.GuardarRegla(nuevaRegla);
    get().InicializarDatos();
  },

  EjecutarReglasPendientes: () => {
    const total = motorRecurrencias.EjecutarReglasPendientes(new Date());
    get().InicializarDatos();
    return total;
  },

  GuardarMoneda: (moneda) => {
    repositorio.GuardarMoneda(moneda);
    set({ moneda });
  },

  ObtenerBalanceCuenta: (idCuenta) => {
    const transacciones = repositorio.ListarTransaccionesPorCuenta(idCuenta);
    return CalcularBalanceCuenta(idCuenta, transacciones);
  }
}));

export const CrearTransaccionAjusteSaldoExacto = (idCuentaDestino: string, monto: number): Omit<Transaccion, 'id' | 'creadoEn'> => ({
  tipo: TipoTransaccion.AJUSTE,
  monto,
  idCuentaDestino,
  fecha: formatISO(new Date()),
  nota: 'Ajuste manual de saldo exacto'
});
