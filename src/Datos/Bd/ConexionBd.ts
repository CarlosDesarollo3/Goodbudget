import * as SQLite from 'expo-sqlite';
import { EjecutarMigraciones } from '../Migraciones/Migraciones';

const baseDatos = SQLite.openDatabaseSync('manejo_sobres.db');
let inicializada = false;

export const ObtenerBd = (): SQLite.SQLiteDatabase => baseDatos;

export const InicializarBd = (): void => {
  if (inicializada) {
    return;
  }
  EjecutarMigraciones(baseDatos);
  inicializada = true;
};
