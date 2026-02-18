import type { SQLiteDatabase } from 'expo-sqlite';

export const EjecutarMigraciones = (bd: SQLiteDatabase): void => {
  bd.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS grupos (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      idGrupoPadre TEXT,
      creadoEn TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cuentas (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      idGrupoPadre TEXT NOT NULL,
      creadoEn TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categorias (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      color TEXT,
      icono TEXT,
      creadoEn TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transacciones (
      id TEXT PRIMARY KEY NOT NULL,
      tipo TEXT NOT NULL,
      monto REAL NOT NULL,
      idCuentaOrigen TEXT,
      idCuentaDestino TEXT,
      idCategoria TEXT,
      nota TEXT,
      fecha TEXT NOT NULL,
      creadoEn TEXT NOT NULL,
      referenciaIdempotencia TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transaccion_idempotencia
      ON transacciones(referenciaIdempotencia)
      WHERE referenciaIdempotencia IS NOT NULL;
    CREATE TABLE IF NOT EXISTS reglasRecurrentes (
      id TEXT PRIMARY KEY NOT NULL,
      habilitada INTEGER NOT NULL,
      frecuencia TEXT NOT NULL,
      diaDelMes INTEGER NOT NULL,
      idCuentaOrigen TEXT NOT NULL,
      idCuentaDestino TEXT NOT NULL,
      monto REAL NOT NULL,
      etiqueta TEXT,
      ultimaEjecucionEn TEXT,
      proximaEjecucionEn TEXT NOT NULL,
      creadoEn TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY NOT NULL,
      valor TEXT NOT NULL
    );
  `);
};
