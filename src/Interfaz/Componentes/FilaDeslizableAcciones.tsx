import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, StyleSheet, View, Pressable } from 'react-native';
import { Text } from 'react-native-paper';

const DESPLAZAMIENTO_MAXIMO = 100;
const UMBRAL_DISTANCIA = 10;

interface PropsFilaDeslizableAcciones {
  id?: string;
  children: React.ReactNode;
  onEditar: () => void;
  onEliminar: () => void;
  onDeslizamientoInsuficiente?: ()   => void;
}

// Mecanismo simple para mantener una sola fila abierta
let filaAbiertaId: string | null = null;
const subs = new Set<(id: string | null) => void>();
const publicarFilaAbierta = (id: string | null) => {
  filaAbiertaId = id;
  subs.forEach((s) => s(id));
};
const suscribirse = (fn: (id: string | null) => void) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

export const CerrarFilaAbierta = (): void => {
  if (filaAbiertaId !== null) {
    publicarFilaAbierta(null);
  }
};

export const FilaDeslizableAcciones = ({
  id,
  children,
  onEditar,
  onEliminar,
  onDeslizamientoInsuficiente
}: PropsFilaDeslizableAcciones): React.JSX.Element => {
  const traslacionX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const [ladoAbierto, setLadoAbierto] = useState<'izquierda' | 'derecha' | null>(null);

  useEffect(() => {
    const unsub = suscribirse((filaId) => {
      // si otra fila abre, cerrarnos
      if (filaId && filaId !== id) {
        resetearPosicion();
      }
    });
    return unsub;
  }, [id]);

  const resetearPosicion = (velocidad = 0): void => {
    Animated.spring(traslacionX, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
      mass: 1
    }).start(() => {
      offsetRef.current = 0;
      traslacionX.setValue(0);
      setLadoAbierto(null);
      // anunciar cierre
      publicarFilaAbierta(null);
    });
  };

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const dx = gestureState.dx ?? 0;
        const dy = gestureState.dy ?? 0;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        // Permitir el gesto cuando el movimiento horizontal es notable y domina,
        // o cuando el desplazamiento horizontal es suficientemente grande (más tolerante al scroll).
        return (absDx > 5 && absDx > absDy * 0.5) || absDx > 10;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const dx = gestureState.dx ?? 0;
        const dy = gestureState.dy ?? 0;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        return (absDx > 6 && absDx > absDy * 0.6) || absDx > 20;
      },
      onPanResponderGrant: () => {
        traslacionX.stopAnimation((valorActual: number) => {
          offsetRef.current = valorActual ?? 0;
          traslacionX.setValue(0);
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const dxTotal = offsetRef.current + gestureState.dx;
        const dxLimitado = Math.max(-DESPLAZAMIENTO_MAXIMO, Math.min(DESPLAZAMIENTO_MAXIMO, dxTotal));
        traslacionX.setValue(dxLimitado);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dx = offsetRef.current + gestureState.dx;
        // Confirmación basada sólo en distancia mínima, no en velocidad
        const gestoDerecha = dx >= UMBRAL_DISTANCIA;
        const gestoIzquierda = dx <= -UMBRAL_DISTANCIA;

        if (gestoDerecha) {
          // abrir hacia la derecha y dejar fijo hasta confirmación
          Animated.spring(traslacionX, { toValue: DESPLAZAMIENTO_MAXIMO, useNativeDriver: true, damping: 12, stiffness: 220 }).start(() => {
            offsetRef.current = DESPLAZAMIENTO_MAXIMO;
            setLadoAbierto('derecha');
            // anunciar que esta fila quedó abierta
            publicarFilaAbierta(id ?? null);
          });
        } else if (gestoIzquierda) {
          Animated.spring(traslacionX, { toValue: -DESPLAZAMIENTO_MAXIMO, useNativeDriver: true, damping: 12, stiffness: 220 }).start(() => {
            offsetRef.current = -DESPLAZAMIENTO_MAXIMO;
            setLadoAbierto('izquierda');
            publicarFilaAbierta(id ?? null);
          });
        } else {
          if (Math.abs(dx) > 40) {
            onDeslizamientoInsuficiente?.();
          }
          resetearPosicion();
        }
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

  const scaleEditar = traslacionX.interpolate({
    inputRange: [0, DESPLAZAMIENTO_MAXIMO],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const scaleEliminar = traslacionX.interpolate({
    inputRange: [-DESPLAZAMIENTO_MAXIMO, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.filaDeslizableContenedor}>
      <View style={styles.fondoAcciones} pointerEvents="box-none">
        <Pressable onPress={() => { if (ladoAbierto === 'derecha') { onEditar(); resetearPosicion(); } }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0 }}>
          <Animated.View style={[styles.accion, styles.accionEditar, { width: DESPLAZAMIENTO_MAXIMO, transform: [{ scaleX: scaleEditar }], opacity: opacidadEditar, height: '100%' }]}>
            <Text style={styles.textoAccion}>Renombrar</Text>
          </Animated.View>
        </Pressable>
        <Pressable onPress={() => { if (ladoAbierto === 'izquierda') { onEliminar(); resetearPosicion(); } }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}>
          <Animated.View style={[styles.accion, styles.accionEliminar, { width: DESPLAZAMIENTO_MAXIMO, transform: [{ scaleX: scaleEliminar }], opacity: opacidadEliminar, height: '100%' }]}>
            <Text style={styles.textoAccion}>Eliminar</Text>
          </Animated.View>
        </Pressable>
      </View>

      <Animated.View
        style={[styles.contenidoDeslizable, { transform: [{ translateX: traslacionX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>

      {ladoAbierto && (
        <Pressable
          style={[styles.overlayCerrar, { left: DESPLAZAMIENTO_MAXIMO, right: DESPLAZAMIENTO_MAXIMO }]}
          onPress={() => {
            setLadoAbierto(null);
            resetearPosicion();
          }}
        />
      )}
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
  ,
  overlayCerrar: {
    position: 'absolute',
    top: 0,
    bottom: 0
  }
});
