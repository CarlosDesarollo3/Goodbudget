import React from 'react';
import { NavigationContainer, DarkTheme as TemaNavegacionOscuro, DefaultTheme as TemaNavegacionClaro, NavigationContainerRef, Theme as TemaNavegacion } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { TipoTransaccion } from '@/Dominio/Modelos';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

const CLAVE_ULTIMA_CUENTA = 'ultimaCuentaUsada';
const CLAVE_ULTIMA_CATEGORIA = 'ultimaCategoriaUsada';

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
    <Pestanas.Screen name="PantallaInicio" component={PantallaInicio} options={{ title: 'Inicio' }} />
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

const rutasSinAccionRapida: Array<keyof ParametrosNavegacion> = ['PantallaFormularioTransaccion'];


type RutaActiva = {
  nombre: keyof ParametrosNavegacion;
  parametros?: ParametrosNavegacion[keyof ParametrosNavegacion];
};

const ObtenerNombreRutaActiva = (estado: any): keyof ParametrosNavegacion | undefined => {
  if (!estado || !stateHasRoutes(estado)) {
    return undefined;
  }

  const rutaActiva = estado.routes[estado.index ?? 0];
  if (!rutaActiva) {
    return undefined;
  }

  if (rutaActiva.state) {
    return ObtenerNombreRutaActiva(rutaActiva.state);
  }

  return rutaActiva.name as keyof ParametrosNavegacion;
};

const stateHasRoutes = (estado: any): estado is { routes: unknown[]; index?: number } => Array.isArray(estado.routes);

const AccionRapidaGlobal = ({
  navigationRef,
  rutaActiva,
  tema
}: {
  navigationRef: React.RefObject<NavigationContainerRef<ParametrosNavegacion>>;
  rutaActiva: RutaActiva;
  tema: TemaAplicacion;
}): React.JSX.Element | null => {
  const insets = useSafeAreaInsets();
  const [expandido, setExpandido] = React.useState(false);
  const { ObtenerValorConfiguracion } = UsarAlmacenAplicacion();

  React.useEffect(() => {
    if (!rutasSinAccionRapida.includes(rutaActiva.nombre)) {
      return;
    }

    setExpandido(false);
  }, [rutaActiva.nombre]);

  if (rutasSinAccionRapida.includes(rutaActiva.nombre)) {
    return null;
  }

  const idCuentaContexto = rutaActiva.nombre === 'PantallaDetalleCuenta'
    ? (rutaActiva.parametros as ParametrosNavegacion['PantallaDetalleCuenta'] | undefined)?.idCuenta
    : undefined;

  const navegarFormulario = (tipoPredeterminado?: TipoTransaccion): void => {
    const idCuentaPredeterminada = idCuentaContexto ?? ObtenerValorConfiguracion(CLAVE_ULTIMA_CUENTA) ?? undefined;
    const idCategoriaPredeterminada = ObtenerValorConfiguracion(CLAVE_ULTIMA_CATEGORIA) ?? undefined;
    navigationRef.current?.navigate('PantallaFormularioTransaccion', {
      idCuentaPredeterminada,
      idCategoriaPredeterminada,
      tipoPredeterminado
    });
    setExpandido(false);
  };

  const navegarInicioConAccion = (accionRapida: 'cuenta' | 'grupo'): void => {
    navigationRef.current?.navigate('PantallaPestanasPrincipal', {
      screen: 'PantallaInicio',
      params: { accionRapida }
    });
    setExpandido(false);
  };

  const acciones = rutaActiva.nombre === 'PantallaInicio'
    ? [
        { icon: 'credit-card-plus-outline', label: 'Nueva cuenta', onPress: () => navegarInicioConAccion('cuenta') },
        { icon: 'folder-plus-outline', label: 'Nuevo grupo', onPress: () => navegarInicioConAccion('grupo') }
      ]
    : [
        { icon: 'arrow-up-bold-circle-outline', label: 'Ingreso', onPress: () => navegarFormulario(TipoTransaccion.INGRESO) },
        { icon: 'swap-horizontal', label: 'Transferencia', onPress: () => navegarFormulario(TipoTransaccion.TRANSFERENCIA) },
        { icon: 'arrow-down-bold-circle-outline', label: 'Gasto', onPress: () => navegarFormulario(TipoTransaccion.GASTO) }
      ];

  return (
    <FAB.Group
      open={expandido}
      visible
      icon={expandido ? 'close' : 'plus'}
      color={tema.colors.onPrimary}
      fabStyle={{ backgroundColor: tema.colors.primary }}
      style={[styles.fabGlobal, { bottom: 96 + insets.bottom }]}
      backdropColor="rgba(0, 0, 0, 0.16)"
      actions={acciones}
      onStateChange={({ open }) => setExpandido(open)}
    />
  );
};

export const PilaNavegacionPrincipal = ({ tema }: PropsPilaNavegacionPrincipal): React.JSX.Element => {
  const temaNavegacion = CrearTemaNavegacion(tema);
  const navigationRef = React.useRef<NavigationContainerRef<ParametrosNavegacion>>(null);
  const [rutaActiva, setRutaActiva] = React.useState<RutaActiva>({ nombre: 'PantallaPestanasPrincipal' });

  const actualizarRutaActiva = React.useCallback(() => {
    const estado = navigationRef.current?.getRootState();
    const siguienteRuta = ObtenerNombreRutaActiva(estado);
    const rutaActual = navigationRef.current?.getCurrentRoute();

    if (siguienteRuta) {
      setRutaActiva({
        nombre: siguienteRuta,
        parametros: rutaActual?.params as ParametrosNavegacion[keyof ParametrosNavegacion] | undefined
      });
    }
  }, []);

  return (
    <View style={styles.contenedorNavegacion}>
      <NavigationContainer ref={navigationRef} theme={temaNavegacion} onReady={actualizarRutaActiva} onStateChange={actualizarRutaActiva}>
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
      <AccionRapidaGlobal navigationRef={navigationRef} rutaActiva={rutaActiva} tema={tema} />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedorNavegacion: {
    flex: 1
  },
  fabGlobal: {
    position: 'absolute',
    right: 16
  }
});
