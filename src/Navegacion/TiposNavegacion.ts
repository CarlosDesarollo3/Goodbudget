export type ParametrosNavegacion = {
  PantallaInicio: undefined;
  PantallaDetalleGrupo: { idGrupo: string; nombreGrupo: string };
  PantallaDetalleCuenta: { idCuenta: string; nombreCuenta: string };
  PantallaFormularioTransaccion: { idCuentaPredeterminada?: string } | undefined;
  PantallaCategorias: undefined;
  PantallaReglasRecurrentes: undefined;
  PantallaConfiguracion: undefined;
};
