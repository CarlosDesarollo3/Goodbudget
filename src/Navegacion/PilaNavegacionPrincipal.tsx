import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from './TiposNavegacion';
import { PantallaInicio } from '@/Interfaz/Pantallas/PantallaInicio';
import { PantallaDetalleGrupo } from '@/Interfaz/Pantallas/PantallaDetalleGrupo';
import { PantallaDetalleCuenta } from '@/Interfaz/Pantallas/PantallaDetalleCuenta';
import { PantallaFormularioTransaccion } from '@/Interfaz/Pantallas/PantallaFormularioTransaccion';
import { PantallaCategorias } from '@/Interfaz/Pantallas/PantallaCategorias';
import { PantallaReglasRecurrentes } from '@/Interfaz/Pantallas/PantallaReglasRecurrentes';
import { PantallaConfiguracion } from '@/Interfaz/Pantallas/PantallaConfiguracion';

const Pila = createNativeStackNavigator<ParametrosNavegacion>();

export const PilaNavegacionPrincipal = (): React.JSX.Element => {
  return (
    <NavigationContainer>
      <Pila.Navigator>
        <Pila.Screen name="PantallaInicio" component={PantallaInicio} options={{ title: 'Manejo de Sobres' }} />
        <Pila.Screen name="PantallaDetalleGrupo" component={PantallaDetalleGrupo} options={{ title: 'Detalle de Grupo' }} />
        <Pila.Screen name="PantallaDetalleCuenta" component={PantallaDetalleCuenta} options={{ title: 'Detalle de Cuenta' }} />
        <Pila.Screen name="PantallaFormularioTransaccion" component={PantallaFormularioTransaccion} options={{ title: 'Nueva Transacción' }} />
        <Pila.Screen name="PantallaCategorias" component={PantallaCategorias} options={{ title: 'Categorías' }} />
        <Pila.Screen name="PantallaReglasRecurrentes" component={PantallaReglasRecurrentes} options={{ title: 'Reglas Recurrentes' }} />
        <Pila.Screen name="PantallaConfiguracion" component={PantallaConfiguracion} options={{ title: 'Configuración' }} />
      </Pila.Navigator>
    </NavigationContainer>
  );
};
