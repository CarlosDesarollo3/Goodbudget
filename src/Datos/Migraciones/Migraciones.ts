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
      idGrupoPadre TEXT,
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

  // Reparación: si la columna idGrupoPadre existiera con NOT NULL en una versión previa,
  // reconstruimos la tabla `cuentas` permitiendo NULLs para idGrupoPadre.
  try {
    const info: Array<{ name: string; notnull: number }> = (bd as any).getAllSync('PRAGMA table_info(cuentas)');
    const columna = info.find((f) => f.name === 'idGrupoPadre');
    if (columna && columna.notnull === 1) {
      bd.execSync(`
        PRAGMA foreign_keys = OFF;
        BEGIN TRANSACTION;
        CREATE TABLE IF NOT EXISTS cuentas_new (
          id TEXT PRIMARY KEY NOT NULL,
          nombre TEXT NOT NULL,
          idGrupoPadre TEXT,
          creadoEn TEXT NOT NULL
        );
        INSERT INTO cuentas_new (id,nombre,idGrupoPadre,creadoEn) SELECT id,nombre,idGrupoPadre,creadoEn FROM cuentas;
        DROP TABLE cuentas;
        ALTER TABLE cuentas_new RENAME TO cuentas;
        COMMIT;
        PRAGMA foreign_keys = ON;
      `);
    }
  } catch (e) {
    // Si falla la verificación/reparación no bloqueamos la inicialización; registramos en desarrollo.
  }
};
