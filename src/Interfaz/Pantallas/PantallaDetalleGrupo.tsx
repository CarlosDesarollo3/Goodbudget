import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { TarjetaCuenta } from '@/Interfaz/Componentes/TarjetaCuenta';
import { TarjetaGrupo } from '@/Interfaz/Componentes/TarjetaGrupo';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

const DESPLAZAMIENTO_ACCION = 84;

type TipoNodo = 'grupo' | 'cuenta';

interface NodoSeleccionado {
  id: string;
  nombre: string;
  tipo: TipoNodo;
}

interface FilaDeslizableProps {
  children: React.ReactNode;
  onEditar: () => void;
  onEliminar: () => void;
}

const FilaDeslizable = ({ children, onEditar, onEliminar }: FilaDeslizableProps): React.JSX.Element => {
  const traslacionX = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 8,
      onPanResponderMove: (_, gestureState) => {
        const dxLimitado = Math.max(-DESPLAZAMIENTO_ACCION, Math.min(DESPLAZAMIENTO_ACCION, gestureState.dx));
        traslacionX.setValue(dxLimitado);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > DESPLAZAMIENTO_ACCION / 2) {
          onEditar();
        } else if (gestureState.dx < -DESPLAZAMIENTO_ACCION / 2) {
          onEliminar();
        }

        Animated.spring(traslacionX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0
        }).start();
      }
    }),
    [onEditar, onEliminar, traslacionX]
  );

  return (
    <View style={styles.filaDeslizableContenedor}>
      <View style={styles.fondoAcciones}>
        <View style={[styles.accion, styles.accionEditar]}>
          <Text style={styles.textoAccion}>Renombrar</Text>
        </View>
        <View style={[styles.accion, styles.accionEliminar]}>
          <Text style={styles.textoAccion}>Eliminar</Text>
        </View>
      </View>

      <Animated.View
        style={[styles.contenidoDeslizable, { transform: [{ translateX: traslacionX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export const PantallaDetalleGrupo = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaDetalleGrupo'>): React.JSX.Element => {
  const { idGrupo } = route.params;
  const {
    grupos,
    cuentasPorGrupo,
    CrearCuenta,
    CrearGrupo,
    ObtenerBalanceCuenta,
    RenombrarCuenta,
    RenombrarGrupo,
    EliminarCuenta,
    EliminarGrupo,
    moneda
  } = UsarAlmacenAplicacion();
  const cuentas = cuentasPorGrupo[idGrupo] ?? [];
  const subgrupos = grupos.filter((grupo) => grupo.idGrupoPadre === idGrupo);

  const [nodoRenombrar, setNodoRenombrar] = useState<NodoSeleccionado | null>(null);
  const [nodoEliminar, setNodoEliminar] = useState<NodoSeleccionado | null>(null);
  const [nombreTemporal, setNombreTemporal] = useState('');

  const abrirDialogoRenombrar = (nodo: NodoSeleccionado): void => {
    setNodoRenombrar(nodo);
    setNombreTemporal(nodo.nombre);
  };

  const confirmarRenombrado = (): void => {
    if (!nodoRenombrar) {
      return;
    }

    const nuevoNombre = nombreTemporal.trim();
    if (!nuevoNombre) {
      return;
    }

    if (nodoRenombrar.tipo === 'grupo') {
      RenombrarGrupo(nodoRenombrar.id, nuevoNombre);
    } else {
      RenombrarCuenta(nodoRenombrar.id, nuevoNombre);
    }

    setNodoRenombrar(null);
    setNombreTemporal('');
  };

  const confirmarEliminacion = (): void => {
    if (!nodoEliminar) {
      return;
    }

    if (nodoEliminar.tipo === 'grupo') {
      EliminarGrupo(nodoEliminar.id);
    } else {
      EliminarCuenta(nodoEliminar.id);
    }

    setNodoEliminar(null);
  };

  return (
    <View style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.contenido}>
        {subgrupos.map((grupo) => (
          <FilaDeslizable
            key={grupo.id}
            onEditar={() => abrirDialogoRenombrar({ id: grupo.id, nombre: grupo.nombre, tipo: 'grupo' })}
            onEliminar={() => setNodoEliminar({ id: grupo.id, nombre: grupo.nombre, tipo: 'grupo' })}
          >
            <TarjetaGrupo
              nombre={grupo.nombre}
              total={0}
              moneda={moneda}
              AlPresionar={() => navigation.push('PantallaDetalleGrupo', { idGrupo: grupo.id, nombreGrupo: grupo.nombre })}
            />
          </FilaDeslizable>
        ))}

        {cuentas.map((cuenta) => (
          <FilaDeslizable
            key={cuenta.id}
            onEditar={() => abrirDialogoRenombrar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
            onEliminar={() => setNodoEliminar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
          >
            <TarjetaCuenta
              nombre={cuenta.nombre}
              balance={ObtenerBalanceCuenta(cuenta.id)}
              moneda={moneda}
              AlPresionar={() => navigation.navigate('PantallaDetalleCuenta', { idCuenta: cuenta.id, nombreCuenta: cuenta.nombre })}
            />
          </FilaDeslizable>
        ))}
      </ScrollView>

      <View style={styles.accionesInferiores}>
        <Button mode="contained" onPress={() => CrearCuenta(`Cuenta ${cuentas.length + 1}`, idGrupo)}>Crear cuenta</Button>
        <Button mode="outlined" onPress={() => CrearGrupo(`Subgrupo ${subgrupos.length + 1}`, idGrupo)}>Crear subgrupo</Button>
      </View>

      <Portal>
        <Dialog visible={Boolean(nodoRenombrar)} onDismiss={() => setNodoRenombrar(null)}>
          <Dialog.Title>Renombrar {nodoRenombrar?.tipo}</Dialog.Title>
          <Dialog.Content>
            <TextInput value={nombreTemporal} onChangeText={setNombreTemporal} mode="outlined" label="Nombre" autoFocus />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNodoRenombrar(null)}>Cancelar</Button>
            <Button onPress={confirmarRenombrado}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={Boolean(nodoEliminar)} onDismiss={() => setNodoEliminar(null)}>
          <Dialog.Title>Confirmar eliminación</Dialog.Title>
          <Dialog.Content>
            <Text>¿Seguro que deseas eliminar {nodoEliminar?.tipo} "{nodoEliminar?.nombre}"?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNodoEliminar(null)}>Cancelar</Button>
            <Button onPress={confirmarEliminacion}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 16
  },
  contenido: {
    paddingBottom: 88,
    gap: 8
  },
  filaDeslizableContenedor: {
    overflow: 'hidden',
    borderRadius: 12
  },
  fondoAcciones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  accion: {
    width: DESPLAZAMIENTO_ACCION,
    justifyContent: 'center',
    alignItems: 'center'
  },
  accionEditar: {
    backgroundColor: '#1976D2'
  },
  accionEliminar: {
    backgroundColor: '#C62828'
  },
  textoAccion: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase'
  },
  contenidoDeslizable: {
    backgroundColor: 'transparent'
  },
  accionesInferiores: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 8
  }
});
