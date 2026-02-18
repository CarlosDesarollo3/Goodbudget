export class ErrorDominio extends Error {
  constructor(public readonly codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorDominio';
  }
}

export class ErrorDatos extends Error {
  constructor(mensaje: string, public readonly detalle?: unknown) {
    super(mensaje);
    this.name = 'ErrorDatos';
  }
}

export const RegistrarLogDesarrollo = (mensaje: string, detalle?: unknown): void => {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${mensaje}`, detalle ?? '');
  }
};

export const ObtenerMensajeAmigable = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
};
