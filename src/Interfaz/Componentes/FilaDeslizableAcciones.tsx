import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

const DESPLAZAMIENTO_MAXIMO = 96;
const UMBRAL_APERTURA = 48;
const UMBRAL_EJECUTAR = 42;
const UMBRAL_VELOCIDAD = 0.45;
const UMBRAL_INICIO_GESTO = 12;

interface PropsFilaDeslizableAcciones {
  id?: string;
  children: React.ReactNode;
  onEditar: () => void;
  onEliminar: () => void;
  etiquetaEditar?: string;
  etiquetaEliminar?: string;
  onDeslizamientoInsuficiente?: () => void;
}

let filaAbiertaId: string | null = null;
const subs = new Set<(id: string | null) => void>();
const publicarFilaAbierta = (id: string | null): void => {
  filaAbiertaId = id;
  subs.forEach((s) => s(id));
};
const suscribirse = (fn: (id: string | null) => void): (() => void) => {
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
  etiquetaEditar = 'Renombrar',
  etiquetaEliminar = 'Eliminar',
  onDeslizamientoInsuficiente
}: PropsFilaDeslizableAcciones): React.JSX.Element => {
  const traslacionX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const [ladoAbierto, setLadoAbierto] = useState<'izquierda' | 'derecha' | null>(null);

  useEffect(() => {
    const unsub = suscribirse((filaId) => {
      if (filaId && filaId !== id) {
        resetearPosicion();
      }
    });
    return unsub;
  }, [id]);

  const animarA = (destino: number, cb?: () => void): void => {
    Animated.spring(traslacionX, {
      toValue: destino,
      useNativeDriver: true,
      damping: 20,
      stiffness: 230,
      mass: 1
    }).start(() => {
      offsetRef.current = destino;
      traslacionX.setValue(destino);
      cb?.();
    });
  };

  const resetearPosicion = (): void => {
    animarA(0, () => {
      setLadoAbierto(null);
      publicarFilaAbierta(null);
    });
  };

  const ejecutarAccionDirecta = (lado: 'derecha' | 'izquierda'): void => {
    if (lado === 'derecha') {
      onEditar();
    } else {
      onEliminar();
    }
    resetearPosicion();
  };

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const absDx = Math.abs(gestureState.dx ?? 0);
        const absDy = Math.abs(gestureState.dy ?? 0);
        return absDx > UMBRAL_INICIO_GESTO && absDx > absDy * 1.4;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const absDx = Math.abs(gestureState.dx ?? 0);
        const absDy = Math.abs(gestureState.dy ?? 0);
        return absDx > UMBRAL_INICIO_GESTO + 4 && absDx > absDy * 1.25;
      },
      onPanResponderGrant: () => {
        traslacionX.stopAnimation((valorActual: number) => {
          offsetRef.current = valorActual ?? 0;
          traslacionX.setValue(valorActual ?? 0);
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const dxTotal = offsetRef.current + gestureState.dx;
        const dxConResistencia =
          Math.abs(dxTotal) <= DESPLAZAMIENTO_MAXIMO
            ? dxTotal
            : Math.sign(dxTotal) * (DESPLAZAMIENTO_MAXIMO + (Math.abs(dxTotal) - DESPLAZAMIENTO_MAXIMO) * 0.25);
        traslacionX.setValue(dxConResistencia);
      },
      onPanResponderRelease: (_, gestureState) => {
        const dxFinal = offsetRef.current + gestureState.dx;
        const vx = gestureState.vx ?? 0;

        const abrirDerecha = dxFinal >= UMBRAL_APERTURA;
        const abrirIzquierda = dxFinal <= -UMBRAL_APERTURA;

        const ejecutarDerecha = dxFinal >= UMBRAL_EJECUTAR || (dxFinal >= UMBRAL_APERTURA && vx >= UMBRAL_VELOCIDAD);
        const ejecutarIzquierda = dxFinal <= -UMBRAL_EJECUTAR || (dxFinal <= -UMBRAL_APERTURA && vx <= -UMBRAL_VELOCIDAD);

        if (ejecutarDerecha) {
          animarA(DESPLAZAMIENTO_MAXIMO, () => ejecutarAccionDirecta('derecha'));
          return;
        }

        if (ejecutarIzquierda) {
          animarA(-DESPLAZAMIENTO_MAXIMO, () => ejecutarAccionDirecta('izquierda'));
          return;
        }

        if (abrirDerecha) {
          animarA(DESPLAZAMIENTO_MAXIMO, () => {
            setLadoAbierto('derecha');
            publicarFilaAbierta(id ?? null);
          });
          return;
        }

        if (abrirIzquierda) {
          animarA(-DESPLAZAMIENTO_MAXIMO, () => {
            setLadoAbierto('izquierda');
            publicarFilaAbierta(id ?? null);
          });
          return;
        }

        if (Math.abs(dxFinal) > 20) {
          onDeslizamientoInsuficiente?.();
        }

        resetearPosicion();
      },
      onPanResponderTerminate: () => {
        resetearPosicion();
      },
      onPanResponderTerminationRequest: () => false
    }),
    [id, onEditar, onEliminar, onDeslizamientoInsuficiente, traslacionX]
  );

  const opacidadEditar = traslacionX.interpolate({
    inputRange: [DESPLAZAMIENTO_MAXIMO * 0.25, DESPLAZAMIENTO_MAXIMO],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const opacidadEliminar = traslacionX.interpolate({
    inputRange: [-DESPLAZAMIENTO_MAXIMO, -DESPLAZAMIENTO_MAXIMO * 0.25],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.filaDeslizableContenedor}>
      <View style={styles.fondoAcciones} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            if (ladoAbierto === 'derecha') {
              onEditar();
              resetearPosicion();
            }
          }}
          style={[styles.botonAccion, styles.botonIzquierdo]}
          hitSlop={8}
        >
          <Animated.View style={[styles.accion, styles.accionEditar, { opacity: opacidadEditar }]}> 
            <Text style={styles.textoAccion}>{etiquetaEditar}</Text>
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={() => {
            if (ladoAbierto === 'izquierda') {
              onEliminar();
              resetearPosicion();
            }
          }}
          style={[styles.botonAccion, styles.botonDerecho]}
          hitSlop={8}
        >
          <Animated.View style={[styles.accion, styles.accionEliminar, { opacity: opacidadEliminar }]}> 
            <Text style={styles.textoAccion}>{etiquetaEliminar}</Text>
          </Animated.View>
        </Pressable>
      </View>

      <Animated.View style={[styles.contenidoDeslizable, { transform: [{ translateX: traslacionX }] }]} {...panResponder.panHandlers}>
        {children}
      </Animated.View>

      {ladoAbierto && (
        <Pressable
          style={[styles.overlayCerrar, { left: DESPLAZAMIENTO_MAXIMO, right: DESPLAZAMIENTO_MAXIMO }]}
          onPress={resetearPosicion}
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
  botonAccion: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: DESPLAZAMIENTO_MAXIMO
  },
  botonIzquierdo: {
    left: 0
  },
  botonDerecho: {
    right: 0
  },
  accion: {
    flex: 1,
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase'
  },
  contenidoDeslizable: {
    backgroundColor: 'transparent'
  },
  overlayCerrar: {
    position: 'absolute',
    top: 0,
    bottom: 0
  }
});
