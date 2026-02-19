import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

const DESPLAZAMIENTO_ACCION = 96;
const UMBRAL_CONFIRMACION = DESPLAZAMIENTO_ACCION * 0.75;

interface PropsFilaDeslizableAcciones {
  children: React.ReactNode;
  onEditar: () => void;
  onEliminar: () => void;
  onDeslizamientoInsuficiente?: () => void;
}

export const FilaDeslizableAcciones = ({
  children,
  onEditar,
  onEliminar,
  onDeslizamientoInsuficiente
}: PropsFilaDeslizableAcciones): React.JSX.Element => {
  const traslacionX = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 8,
      onPanResponderMove: (_, gestureState) => {
        const dxLimitado = Math.max(-DESPLAZAMIENTO_ACCION, Math.min(DESPLAZAMIENTO_ACCION, gestureState.dx));
        traslacionX.setValue(dxLimitado);
      },
      onPanResponderRelease: (_, gestureState) => {
        const fueDerecha = gestureState.dx >= UMBRAL_CONFIRMACION;
        const fueIzquierda = gestureState.dx <= -UMBRAL_CONFIRMACION;

        if (fueDerecha) {
          onEditar();
        } else if (fueIzquierda) {
          onEliminar();
        } else if (Math.abs(gestureState.dx) > DESPLAZAMIENTO_ACCION / 3) {
          onDeslizamientoInsuficiente?.();
        }

        Animated.spring(traslacionX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0
        }).start();
      }
    }),
    [onEditar, onEliminar, onDeslizamientoInsuficiente, traslacionX]
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

const styles = StyleSheet.create({
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
  }
});
