import 'react-native-get-random-values';
import React from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { PilaNavegacionPrincipal } from '@/Navegacion/PilaNavegacionPrincipal';

const tema = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4A6FA5',
    secondary: '#8AA1C1'
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
