import React from 'react';
import { NavigationContainer, DarkTheme as TemaNavegacionOscuro, DefaultTheme as TemaNavegacionClaro, Theme as TemaNavegacion } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ParametrosNavegacion, ParametrosPestanasPrincipal } from './TiposNavegacion';
import { PantallaInicio } from '@/Interfaz/Pantallas/PantallaInicio';
import { PantallaDetalleGrupo } from '@/Interfaz/Pantallas/PantallaDetalleGrupo';
import { PantallaDetalleCuenta } from '@/Interfaz/Pantallas/PantallaDetalleCuenta';
import { PantallaFormularioTransaccion } from '@/Interfaz/Pantallas/PantallaFormularioTransaccion';
import { PantallaCategorias } from '@/Interfaz/Pantallas/PantallaCategorias';
import { PantallaReglasRecurrentes } from '@/Interfaz/Pantallas/PantallaReglasRecurrentes';
import { PantallaConfiguracion } from '@/Interfaz/Pantallas/PantallaConfiguracion';
import { PantallaAnalitica } from '@/Interfaz/Pantallas/PantallaAnalitica';
import { MenuCabecera } from '@/Interfaz/Componentes/MenuCabecera';
import { TemaAplicacion } from '@/Interfaz/Tema/temaAplicacion';

const Pila = createNativeStackNavigator<ParametrosNavegacion>();
const Pestanas = createBottomTabNavigator<ParametrosPestanasPrincipal>();

const iconosPestanas: Record<keyof ParametrosPestanasPrincipal, { activo: React.ComponentProps<typeof MaterialCommunityIcons>['name']; inactivo: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }> = {
  PantallaInicio: { activo: 'home', inactivo: 'home-outline' },
  PantallaCategorias: { activo: 'shape', inactivo: 'shape-outline' },
  PantallaAnalitica: { activo: 'chart-box', inactivo: 'chart-box-outline' }
};

const NavegacionPestanasPrincipal = (): React.JSX.Element => (
  <Pestanas.Navigator
    screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: '#ffffff' },
      headerTintColor: '#000000',
      headerTitleStyle: { fontWeight: '700' },
      tabBarActiveTintColor: '#175ddc',
      tabBarInactiveTintColor: '#7b7b7b',
      tabBarIcon: ({ color, size, focused }) => {
        const icono = iconosPestanas[route.name as keyof ParametrosPestanasPrincipal];
        return <MaterialCommunityIcons name={focused ? icono.activo : icono.inactivo} color={color} size={size} />;
      }
    })}
  >
    <Pestanas.Screen name="PantallaInicio" component={PantallaInicio} options={{ title: 'Manejo de Sobres' }} />
    <Pestanas.Screen name="PantallaCategorias" component={PantallaCategorias} options={{ title: 'Categorías' }} />
    <Pestanas.Screen name="PantallaAnalitica" component={PantallaAnalitica} options={{ title: 'Analítica' }} />
  </Pestanas.Navigator>
);

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
        <Pila.Screen
          name="PantallaPestanasPrincipal"
          component={NavegacionPestanasPrincipal}
          options={{ headerShown: false }}
        />
        <Pila.Screen
          name="PantallaDetalleGrupo"
          component={PantallaDetalleGrupo}
          options={({ navigation }) => ({ title: 'Detalle de Grupo', headerRight: () => <MenuCabecera navigation={navigation} /> })}
        />
        <Pila.Screen
          name="PantallaDetalleCuenta"
          component={PantallaDetalleCuenta}
          options={({ navigation }) => ({ title: 'Detalle de Cuenta', headerRight: () => <MenuCabecera navigation={navigation} /> })}
        />
        <Pila.Screen
          name="PantallaFormularioTransaccion"
          component={PantallaFormularioTransaccion}
          options={({ route, navigation }) => {
            const editando = Boolean((route.params as { transaccion?: unknown } | undefined)?.transaccion);
            return {
              title: editando ? 'Editar transacción' : 'Nueva transacción',
              headerRight: () => <MenuCabecera navigation={navigation} />
            };
          }}
        />
        <Pila.Screen name="PantallaCategorias" component={PantallaCategorias} options={{ title: 'Categorías' }} />
        <Pila.Screen name="PantallaReglasRecurrentes" component={PantallaReglasRecurrentes} options={{ title: 'Reglas Recurrentes' }} />
        <Pila.Screen name="PantallaAnalitica" component={PantallaAnalitica} options={{ title: 'Analítica' }} />
        <Pila.Screen name="PantallaConfiguracion" component={PantallaConfiguracion} options={{ title: 'Configuración' }} />
      </Pila.Navigator>
    </NavigationContainer>
  );
};
