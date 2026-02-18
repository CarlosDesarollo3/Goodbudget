export const FormatearMoneda = (monto: number, moneda: string = 'MXN'): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 2
  }).format(monto);
};
