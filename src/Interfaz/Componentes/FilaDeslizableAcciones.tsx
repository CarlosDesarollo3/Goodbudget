import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

const DESPLAZAMIENTO_MAXIMO = 104;
const UMBRAL_DISTANCIA = 52;
const UMBRAL_VELOCIDAD = 0.35;

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

  const resetearPosicion = (): void => {
    Animated.spring(traslacionX, {
      toValue: 0,
      useNativeDriver: true,
      speed: 22,
      bounciness: 0
    }).start();
  };

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 6,
      onPanResponderGrant: () => {
        traslacionX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const dxLimitado = Math.max(-DESPLAZAMIENTO_MAXIMO, Math.min(DESPLAZAMIENTO_MAXIMO, gestureState.dx));
        traslacionX.setValue(dxLimitado);
      },
      onPanResponderRelease: (_, gestureState) => {
        const gestoDerecha = gestureState.dx >= UMBRAL_DISTANCIA || gestureState.vx >= UMBRAL_VELOCIDAD;
        const gestoIzquierda = gestureState.dx <= -UMBRAL_DISTANCIA || gestureState.vx <= -UMBRAL_VELOCIDAD;

        if (gestoDerecha) {
          onEditar();
        } else if (gestoIzquierda) {
          onEliminar();
        } else if (Math.abs(gestureState.dx) > 20) {
          onDeslizamientoInsuficiente?.();
        }

        resetearPosicion();
      },
      onPanResponderTerminate: () => {
        resetearPosicion();
      },
      onPanResponderTerminationRequest: () => true
    }),
    [onEditar, onEliminar, onDeslizamientoInsuficiente, traslacionX]
  );

  const opacidadEditar = traslacionX.interpolate({
    inputRange: [0, DESPLAZAMIENTO_MAXIMO / 2],
    outputRange: [0.2, 1],
    extrapolate: 'clamp'
  });

  const opacidadEliminar = traslacionX.interpolate({
    inputRange: [-DESPLAZAMIENTO_MAXIMO / 2, 0],
    outputRange: [1, 0.2],
    extrapolate: 'clamp'
  });

  const anchoEditar = traslacionX.interpolate({
    inputRange: [0, DESPLAZAMIENTO_MAXIMO],
    outputRange: [0, DESPLAZAMIENTO_MAXIMO],
    extrapolate: 'clamp'
  });

  const anchoEliminar = traslacionX.interpolate({
    inputRange: [-DESPLAZAMIENTO_MAXIMO, 0],
    outputRange: [DESPLAZAMIENTO_MAXIMO, 0],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.filaDeslizableContenedor}>
      <View style={styles.fondoAcciones}>
        <Animated.View style={[styles.accion, styles.accionEditar, { width: anchoEditar, opacity: opacidadEditar }]}>
          <Text style={styles.textoAccion}>Renombrar</Text>
        </Animated.View>
        <Animated.View style={[styles.accion, styles.accionEliminar, { width: anchoEliminar, opacity: opacidadEliminar }]}>
          <Text style={styles.textoAccion}>Eliminar</Text>
        </Animated.View>
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
    borderRadius: 14
  },
  fondoAcciones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch'
  },
  accion: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  accionEditar: {
    backgroundColor: '#1E73D8'
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
