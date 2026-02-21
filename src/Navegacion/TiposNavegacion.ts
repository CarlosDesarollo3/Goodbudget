import { Transaccion } from '@/Dominio/Modelos';

export type ParametrosNavegacion = {
  PantallaInicio: undefined;
  PantallaDetalleGrupo: { idGrupo: string; nombreGrupo: string };
  PantallaDetalleCuenta: { idCuenta: string; nombreCuenta: string };
  PantallaFormularioTransaccion: { idCuentaPredeterminada?: string } | { transaccion?: Transaccion } | undefined;
  PantallaCategorias: undefined;
  PantallaReglasRecurrentes: undefined;
  PantallaAnalitica: undefined;
  PantallaConfiguracion: undefined;
};
