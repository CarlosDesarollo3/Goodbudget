import { formatISO } from 'date-fns';
import { v4 as GenerarUuid } from 'uuid';
import { RepositorioSqlite } from './Repositorios/RepositorioSqlite';

export const EjecutarSemilla = (): void => {
  const repositorio = new RepositorioSqlite();
  const grupo = { id: GenerarUuid(), nombre: 'Hogar', idGrupoPadre: null, creadoEn: formatISO(new Date()) };
  repositorio.CrearGrupo(grupo);
  repositorio.CrearCuenta({ id: GenerarUuid(), nombre: 'Supermercado', idGrupoPadre: grupo.id, creadoEn: formatISO(new Date()) });
  repositorio.CrearCuenta({ id: GenerarUuid(), nombre: 'Servicios', idGrupoPadre: grupo.id, creadoEn: formatISO(new Date()) });
  repositorio.CrearCategoria({ id: GenerarUuid(), nombre: 'Comida', color: '#C8E6C9', creadoEn: formatISO(new Date()) });
};
