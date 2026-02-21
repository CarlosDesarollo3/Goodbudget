export const FormatearMoneda = (monto: number, moneda: string = 'MXN'): string => {
  // Detect reliable Intl support before using it. Some React Native runtimes
  // provide a partial Intl implementation where formatToParts is missing
  // and calling `format` can throw. In that case use a simple fallback.
  try {
    if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
      const nf = new Intl.NumberFormat('es', {
        style: 'currency',
        currency: moneda,
        maximumFractionDigits: 2
      });

      if (typeof (nf as any).formatToParts === 'function') {
        return nf.format(monto);
      }
      // If formatToParts is not available, avoid calling format (it may fail)
      // and fall through to the JS fallback below.
    }
  } catch (e) {
    // Fall through to fallback implementation
  }

  // Fallback for environments without full Intl support
  const symbols: Record<string, string> = { MXN: '$', USD: '$', EUR: '€' };
  const symbol = symbols[moneda] ?? `${moneda} `;
  const value = Number(monto) || 0;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value).toFixed(2);
  const parts = abs.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decPart = parts[1] ?? '00';
  return `${sign}${symbol}${intPart}.${decPart}`;
};
