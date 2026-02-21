import 'react-native-get-random-values';
import React from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { PilaNavegacionPrincipal } from '@/Navegacion/PilaNavegacionPrincipal';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { ResolverTema } from '@/Interfaz/Tema/temaAplicacion';

const App = (): React.JSX.Element => {
  const esquemaSistema = useColorScheme();
  const modoTema = UsarAlmacenAplicacion((estado) => estado.modoTema);
  const tema = ResolverTema(modoTema, esquemaSistema);

  return (
    <PaperProvider theme={tema}>
      <PilaNavegacionPrincipal tema={tema} />
    </PaperProvider>
  );
};

export default App;
