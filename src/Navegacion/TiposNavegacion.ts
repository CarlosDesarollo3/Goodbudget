import { NavigatorScreenParams } from '@react-navigation/native';
import { Transaccion } from '@/Dominio/Modelos';

export type ParametrosPestanasPrincipal = {
  PantallaInicio: undefined;
  PantallaCategorias: undefined;
  PantallaReglasRecurrentes: undefined;
  PantallaConfiguracion: undefined;
};

export type ParametrosNavegacion = {
  PantallaPestanasPrincipal: NavigatorScreenParams<ParametrosPestanasPrincipal> | undefined;
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
