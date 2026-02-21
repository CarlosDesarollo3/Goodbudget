import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';

export type ModoTema = 'sistema' | 'claro' | 'oscuro';

export interface ColoresExtendidos {
  exito: string;
  onExito: string;
}

export type TemaAplicacion = MD3Theme & {
  colors: MD3Theme['colors'] & ColoresExtendidos;
};

export const temaClaro: TemaAplicacion = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1D6FD8',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D9E9FF',
    onPrimaryContainer: '#0D2B52',
    secondary: '#3B7FBD',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DDEFFF',
    onSecondaryContainer: '#12314D',
    tertiary: '#2F6EA9',
    onTertiary: '#FFFFFF',
    surface: '#FAFCFF',
    onSurface: '#1A1C1E',
    surfaceVariant: '#E0E7EF',
    onSurfaceVariant: '#41484F',
    outline: '#6E757C',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    exito: '#2E7D32',
    onExito: '#FFFFFF'
  }
};

export const temaOscuro: TemaAplicacion = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A7C8FF',
    onPrimary: '#00315D',
    primaryContainer: '#004882',
    onPrimaryContainer: '#D9E9FF',
    secondary: '#A6CBF2',
    onSecondary: '#063354',
    secondaryContainer: '#224A6B',
    onSecondaryContainer: '#DDEFFF',
    tertiary: '#9ECAFF',
    onTertiary: '#003258',
    surface: '#111417',
    onSurface: '#E2E2E6',
    surfaceVariant: '#41484F',
    onSurfaceVariant: '#C1C7D0',
    outline: '#8B919A',
    error: '#FFB4AB',
    onError: '#690005',
    exito: '#7DDA84',
    onExito: '#00390B'
  }
};

export const ResolverTema = (modo: ModoTema, esquemaSistema: 'light' | 'dark' | null): TemaAplicacion => {
  if (modo === 'claro') {
    return temaClaro;
  }

  if (modo === 'oscuro') {
    return temaOscuro;
  }

  return esquemaSistema === 'dark' ? temaOscuro : temaClaro;
};
