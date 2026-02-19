import 'react-native-get-random-values';
import React from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { PilaNavegacionPrincipal } from '@/Navegacion/PilaNavegacionPrincipal';

const tema = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1D6FD8',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D9E9FF',
    onPrimaryContainer: '#0D2B52',
    secondary: '#3B7FBD',
    secondaryContainer: '#DDEFFF',
    tertiary: '#2F6EA9',
    surfaceVariant: '#ECF3FB'
  }
};

const App = (): React.JSX.Element => {
  return (
    <PaperProvider theme={tema}>
      <PilaNavegacionPrincipal />
    </PaperProvider>
  );
};

export default App;
