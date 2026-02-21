import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
import { MenuCabecera } from '@/Interfaz/Componentes/MenuCabecera';

const Pila = createNativeStackNavigator<ParametrosNavegacion>();
const Pestanas = createBottomTabNavigator<ParametrosPestanasPrincipal>();

const iconosPestanas: Record<keyof ParametrosPestanasPrincipal, { activo: React.ComponentProps<typeof MaterialCommunityIcons>['name']; inactivo: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }> = {
  PantallaInicio: { activo: 'home', inactivo: 'home-outline' },
  PantallaCategorias: { activo: 'shape', inactivo: 'shape-outline' },
  PantallaReglasRecurrentes: { activo: 'calendar-sync', inactivo: 'calendar-sync-outline' },
  PantallaConfiguracion: { activo: 'cog', inactivo: 'cog-outline' }
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
    <Pestanas.Screen name="PantallaReglasRecurrentes" component={PantallaReglasRecurrentes} options={{ title: 'Reglas Recurrentes' }} />
    <Pestanas.Screen name="PantallaConfiguracion" component={PantallaConfiguracion} options={{ title: 'Configuración' }} />
  </Pestanas.Navigator>
);

export const PilaNavegacionPrincipal = (): React.JSX.Element => {
  return (
    <NavigationContainer>
      <Pila.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#000000',
          headerTitleStyle: { fontWeight: '700' }
        }}
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
      </Pila.Navigator>
    </NavigationContainer>
  );
};
