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
  CrearCuenta(nombre: string, idGrupoPadre: string | null, saldoInicial?: number): void;
  RenombrarGrupo(idGrupo: string, nombre: string): void;
  RenombrarCuenta(idCuenta: string, nombre: string): void;
  ReubicarGrupo(idGrupo: string, idNuevoGrupoPadre: string | null): boolean;
  ReubicarCuenta(idCuenta: string, idNuevoGrupoPadre: string | null): void;
  ConvertirCuentaEnGrupo(idCuenta: string): Grupo | null;
  EliminarGrupo(idGrupo: string): void;
  EliminarCuenta(idCuenta: string): void;
  RegistrarTransaccion(datos: Omit<Transaccion, 'id' | 'creadoEn'>): void;
  ActualizarTransaccion(transaccion: Transaccion): void;
  EliminarTransaccion(idTransaccion: string): void;
  CrearCategoria(nombre: string, color?: string, icono?: string): void;
  ActualizarCategoria(idCategoria: string, nombre: string, color?: string, icono?: string): void;
  EliminarCategoria(idCategoria: string): void;
  CrearReglaRecurrente(regla: Omit<ReglaRecurrente, 'id' | 'frecuencia' | 'creadoEn'>): void;
  ActualizarReglaRecurrente(regla: ReglaRecurrente): void;
  EliminarReglaRecurrente(idRegla: string): void;
  EjecutarReglasPendientes(): number;
  GuardarMoneda(moneda: string): void;
  ExportarDatos(): string;
  ImportarDatos(contenidoRespaldo: string): void;
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
    InicializarBd();
    const nuevoGrupo: Grupo = { id: GenerarUuid(), nombre, idGrupoPadre, creadoEn: formatISO(new Date()) };
    repositorio.CrearGrupo(nuevoGrupo);
    get().InicializarDatos();
  },

  CrearCuenta: (nombre, idGrupoPadre, saldoInicial = 0) => {
    InicializarBd();
    const nuevaCuenta: Cuenta = { id: GenerarUuid(), nombre, idGrupoPadre, creadoEn: formatISO(new Date()) };
    repositorio.CrearCuenta(nuevaCuenta);

    if (saldoInicial !== 0) {
      repositorio.CrearTransaccion({
        ...CrearTransaccionAjusteSaldoExacto(nuevaCuenta.id, saldoInicial),
        id: GenerarUuid(),
        creadoEn: formatISO(new Date())
      });
    }

    get().InicializarDatos();
  },

  RenombrarGrupo: (idGrupo, nombre) => {
    repositorio.ActualizarNombreGrupo(idGrupo, nombre);
    get().InicializarDatos();
  },

  RenombrarCuenta: (idCuenta, nombre) => {
    repositorio.ActualizarNombreCuenta(idCuenta, nombre);
    get().InicializarDatos();
  },

  ReubicarGrupo: (idGrupo, idNuevoGrupoPadre) => {
    if (idGrupo === idNuevoGrupoPadre) {
      return false;
    }

    const grupos = get().grupos;
    const idsDescendientes = new Set<string>();

    const recolectarDescendientes = (idPadre: string): void => {
      grupos
        .filter((grupo) => grupo.idGrupoPadre === idPadre)
        .forEach((grupoHijo) => {
          idsDescendientes.add(grupoHijo.id);
          recolectarDescendientes(grupoHijo.id);
        });
    };

    recolectarDescendientes(idGrupo);

    if (idNuevoGrupoPadre && idsDescendientes.has(idNuevoGrupoPadre)) {
      return false;
    }

    repositorio.ActualizarGrupoPadre(idGrupo, idNuevoGrupoPadre);
    get().InicializarDatos();
    return true;
  },

  ReubicarCuenta: (idCuenta, idNuevoGrupoPadre) => {
    repositorio.ActualizarCuentaPadre(idCuenta, idNuevoGrupoPadre);
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

  EliminarGrupo: (idGrupo) => {
    repositorio.EliminarGrupo(idGrupo);
    get().InicializarDatos();
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

  CrearCategoria: (nombre, color, icono) => {
    repositorio.CrearCategoria({ id: GenerarUuid(), nombre, color, icono, creadoEn: formatISO(new Date()) });
    get().InicializarDatos();
  },

  ActualizarCategoria: (idCategoria, nombre, color, icono) => {
    repositorio.ActualizarCategoria({ id: idCategoria, nombre, color, icono });
    get().InicializarDatos();
  },

  EliminarCategoria: (idCategoria) => {
    repositorio.EliminarCategoria(idCategoria);
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

  ActualizarReglaRecurrente: (regla) => {
    repositorio.ActualizarRegla(regla);
    get().InicializarDatos();
  },

  EliminarReglaRecurrente: (idRegla) => {
    repositorio.EliminarRegla(idRegla);
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

  ExportarDatos: () => {
    InicializarBd();
    const datos = repositorio.ExportarDatos();
    return JSON.stringify({ version: 1, exportadoEn: formatISO(new Date()), datos }, null, 2);
  },

  ImportarDatos: (contenidoRespaldo) => {
    InicializarBd();
    const respaldo = JSON.parse(contenidoRespaldo) as {
      datos?: ReturnType<RepositorioSqlite['ExportarDatos']>;
    };

    if (!respaldo?.datos) {
      throw new Error('El archivo no contiene un respaldo válido.');
    }

    repositorio.ImportarDatos(respaldo.datos);
    get().InicializarDatos();
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
