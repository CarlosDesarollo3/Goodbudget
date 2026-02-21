import { Transaccion } from '@/Dominio/Modelos';

export type ParametrosNavegacion = {
  PantallaInicio: undefined;
  PantallaDetalleGrupo: { idGrupo: string; nombreGrupo: string };
  PantallaDetalleCuenta: { idCuenta: string; nombreCuenta: string };
  PantallaFormularioTransaccion:
    | { idCuentaPredeterminada?: string }
    | { transaccion?: Transaccion; duplicar?: boolean }
    | undefined;
  PantallaCategorias: undefined;
  PantallaReglasRecurrentes: undefined;
  PantallaConfiguracion: undefined;
};
