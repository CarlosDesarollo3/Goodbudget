import React from 'react';
import { NavigationContainer, DarkTheme as TemaNavegacionOscuro, DefaultTheme as TemaNavegacionClaro, Theme as TemaNavegacion } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from './TiposNavegacion';
import { PantallaInicio } from '@/Interfaz/Pantallas/PantallaInicio';
import { PantallaDetalleGrupo } from '@/Interfaz/Pantallas/PantallaDetalleGrupo';
import { PantallaDetalleCuenta } from '@/Interfaz/Pantallas/PantallaDetalleCuenta';
import { PantallaFormularioTransaccion } from '@/Interfaz/Pantallas/PantallaFormularioTransaccion';
import { PantallaCategorias } from '@/Interfaz/Pantallas/PantallaCategorias';
import { PantallaReglasRecurrentes } from '@/Interfaz/Pantallas/PantallaReglasRecurrentes';
import { PantallaConfiguracion } from '@/Interfaz/Pantallas/PantallaConfiguracion';
import { MenuCabecera } from '@/Interfaz/Componentes/MenuCabecera';
import { TemaAplicacion } from '@/Interfaz/Tema/temaAplicacion';

const Pila = createNativeStackNavigator<ParametrosNavegacion>();

interface PropsPilaNavegacionPrincipal {
  tema: TemaAplicacion;
}

const CrearTemaNavegacion = (tema: TemaAplicacion): TemaNavegacion => ({
  ...(tema.dark ? TemaNavegacionOscuro : TemaNavegacionClaro),
  dark: tema.dark,
  colors: {
    ...(tema.dark ? TemaNavegacionOscuro.colors : TemaNavegacionClaro.colors),
    primary: tema.colors.primary,
    background: tema.colors.background,
    card: tema.colors.surface,
    text: tema.colors.onSurface,
    border: tema.colors.outline,
    notification: tema.colors.error
  }
});

export const PilaNavegacionPrincipal = ({ tema }: PropsPilaNavegacionPrincipal): React.JSX.Element => {
  const temaNavegacion = CrearTemaNavegacion(tema);

  return (
    <NavigationContainer theme={temaNavegacion}>
      <Pila.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: tema.colors.surface },
          headerTintColor: tema.colors.onSurface,
          headerTitleStyle: { fontWeight: '700' },
          headerRight: () => <MenuCabecera navigation={navigation} />
        })}
      >
        <Pila.Screen name="PantallaInicio" component={PantallaInicio} options={{ title: 'Manejo de Sobres' }} />
        <Pila.Screen name="PantallaDetalleGrupo" component={PantallaDetalleGrupo} options={{ title: 'Detalle de Grupo' }} />
        <Pila.Screen name="PantallaDetalleCuenta" component={PantallaDetalleCuenta} options={{ title: 'Detalle de Cuenta' }} />
        <Pila.Screen
          name="PantallaFormularioTransaccion"
          component={PantallaFormularioTransaccion}
          options={({ route }) => {
            const editando = Boolean((route.params as { transaccion?: unknown } | undefined)?.transaccion);
            return { title: editando ? 'Editar transacción' : 'Nueva transacción' };
          }}
        />
        <Pila.Screen name="PantallaCategorias" component={PantallaCategorias} options={{ title: 'Categorías' }} />
        <Pila.Screen name="PantallaReglasRecurrentes" component={PantallaReglasRecurrentes} options={{ title: 'Reglas Recurrentes' }} />
        <Pila.Screen name="PantallaConfiguracion" component={PantallaConfiguracion} options={{ title: 'Configuración' }} />
      </Pila.Navigator>
    </NavigationContainer>
  );
};
