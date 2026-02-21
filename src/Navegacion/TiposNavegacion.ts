import { NavigatorScreenParams } from '@react-navigation/native';
import { TipoTransaccion, Transaccion } from '@/Dominio/Modelos';

export type ParametrosPestanasPrincipal = {
  PantallaInicio: { accionRapida?: 'cuenta' | 'grupo' } | undefined;
  PantallaCategorias: undefined;
  PantallaAnalitica: undefined;
};

export type ParametrosNavegacion = {
  PantallaPestanasPrincipal: NavigatorScreenParams<ParametrosPestanasPrincipal> | undefined;
  PantallaInicio: { accionRapida?: 'cuenta' | 'grupo' } | undefined;
  PantallaDetalleGrupo: { idGrupo: string; nombreGrupo: string };
  PantallaDetalleCuenta: { idCuenta: string; nombreCuenta: string };
  PantallaFormularioTransaccion:
    | { idCuentaPredeterminada?: string; idCategoriaPredeterminada?: string; tipoPredeterminado?: TipoTransaccion }
    | { transaccion?: Transaccion; duplicar?: boolean }
    | undefined;
  PantallaCategorias: undefined;
  PantallaReglasRecurrentes: undefined;
  PantallaAnalitica: undefined;
  PantallaConfiguracion: undefined;
};
