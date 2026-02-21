import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { TarjetaCuenta } from '@/Interfaz/Componentes/TarjetaCuenta';
import { TarjetaGrupo } from '@/Interfaz/Componentes/TarjetaGrupo';
import { FilaDeslizableAcciones, CerrarFilaAbierta } from '@/Interfaz/Componentes/FilaDeslizableAcciones';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TipoNodo = 'grupo' | 'cuenta';

type TipoCreacion = 'grupo' | 'cuenta';

interface NodoSeleccionado {
  id: string;
  nombre: string;
  tipo: TipoNodo;
}

interface CreacionPendiente {
  tipo: TipoCreacion;
}

export const PantallaDetalleGrupo = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaDetalleGrupo'>): React.JSX.Element => {
  const { idGrupo } = route.params;
  const insets = useSafeAreaInsets();
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
    moneda,
    onboardingGestosCompletado,
    solicitudAyudaRapida,
    MarcarOnboardingGestosCompletado
  } = UsarAlmacenAplicacion();
  const cuentas = cuentasPorGrupo[idGrupo] ?? [];
  const subgrupos = grupos.filter((grupo) => grupo.idGrupoPadre === idGrupo);

  const [nodoRenombrar, setNodoRenombrar] = useState<NodoSeleccionado | null>(null);
  const [nodoEliminar, setNodoEliminar] = useState<NodoSeleccionado | null>(null);
  const [creacionPendiente, setCreacionPendiente] = useState<CreacionPendiente | null>(null);
  const [nombreTemporal, setNombreTemporal] = useState('');
  const [montoInicialTemporal, setMontoInicialTemporal] = useState('0');
  const [mostrarAvisoGesto, setMostrarAvisoGesto] = useState(false);
  const [mostrarCoachMarks, setMostrarCoachMarks] = useState(false);

  React.useEffect(() => {
    if (!onboardingGestosCompletado) {
      setMostrarCoachMarks(true);
    }
  }, [onboardingGestosCompletado, solicitudAyudaRapida]);

  const cerrarCoachMarks = (): void => {
    setMostrarCoachMarks(false);
    MarcarOnboardingGestosCompletado(true);
  };

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

  const abrirDialogoCreacion = (tipo: TipoCreacion): void => {
    setCreacionPendiente({ tipo });
    setNombreTemporal('');
    setMontoInicialTemporal('0');
  };

  const obtenerMontoInicial = (): number => {
    const monto = Number(montoInicialTemporal.replace(',', '.'));
    return Number.isFinite(monto) ? monto : 0;
  };

  const confirmarCreacion = (): void => {
    if (!creacionPendiente) {
      return;
    }

    const nombreCapturado = nombreTemporal.trim();

    if (creacionPendiente.tipo === 'cuenta') {
      const nombreDefecto = `Cuenta ${cuentas.length + 1}`;
      CrearCuenta(nombreCapturado || nombreDefecto, idGrupo, obtenerMontoInicial());
    } else {
      const nombreDefecto = `Subgrupo ${subgrupos.length + 1}`;
      CrearGrupo(nombreCapturado || nombreDefecto, idGrupo);
    }

    setCreacionPendiente(null);
    setNombreTemporal('');
    setMontoInicialTemporal('0');
  };

  return (
    <View style={styles.contenedor}>
      <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: 100 + insets.bottom }]} onStartShouldSetResponder={() => { CerrarFilaAbierta(); return false; }}>
        {subgrupos.map((grupo) => (
          <FilaDeslizableAcciones
            key={grupo.id}
            id={grupo.id}
            onEditar={() => abrirDialogoRenombrar({ id: grupo.id, nombre: grupo.nombre, tipo: 'grupo' })}
            onEliminar={() => setNodoEliminar({ id: grupo.id, nombre: grupo.nombre, tipo: 'grupo' })}
            onDeslizamientoInsuficiente={() => setMostrarAvisoGesto(true)}
          >
            <TarjetaGrupo
              nombre={grupo.nombre}
              total={0}
              moneda={moneda}
              AlPresionar={() => navigation.push('PantallaDetalleGrupo', { idGrupo: grupo.id, nombreGrupo: grupo.nombre })}
            />
          </FilaDeslizableAcciones>
        ))}

        {cuentas.map((cuenta) => (
          <FilaDeslizableAcciones
            key={cuenta.id}
            id={cuenta.id}
            onEditar={() => abrirDialogoRenombrar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
            onEliminar={() => setNodoEliminar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
            onDeslizamientoInsuficiente={() => setMostrarAvisoGesto(true)}
          >
            <TarjetaCuenta
              nombre={cuenta.nombre}
              balance={ObtenerBalanceCuenta(cuenta.id)}
              moneda={moneda}
              AlPresionar={() => navigation.navigate('PantallaDetalleCuenta', { idCuenta: cuenta.id, nombreCuenta: cuenta.nombre })}
            />
          </FilaDeslizableAcciones>
        ))}
      </ScrollView>

      <View style={[styles.accionesInferiores, { bottom: 12 + insets.bottom }]}>
        <Button mode="contained" onPress={() => abrirDialogoCreacion('cuenta')}>Crear cuenta</Button>
        <Button mode="outlined" onPress={() => abrirDialogoCreacion('grupo')}>Crear subgrupo</Button>
      </View>

      <Portal>
        <Dialog visible={Boolean(creacionPendiente)} onDismiss={() => setCreacionPendiente(null)}>
          <Dialog.Title>{creacionPendiente?.tipo === 'cuenta' ? 'Nueva cuenta' : 'Nuevo subgrupo'}</Dialog.Title>
          <Dialog.Content>
            <TextInput value={nombreTemporal} onChangeText={setNombreTemporal} mode="outlined" label="Nombre (opcional)" autoFocus />
            {creacionPendiente?.tipo === 'cuenta' ? (
              <TextInput
                value={montoInicialTemporal}
                onChangeText={setMontoInicialTemporal}
                mode="outlined"
                keyboardType="decimal-pad"
                label="Monto inicial"
                style={styles.campoMontoInicial}
              />
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreacionPendiente(null)}>Cancelar</Button>
            <Button onPress={confirmarCreacion}>Crear</Button>
          </Dialog.Actions>
        </Dialog>

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

        <Dialog visible={mostrarCoachMarks} onDismiss={cerrarCoachMarks}>
          <Dialog.Title>Guía rápida</Dialog.Title>
          <Dialog.Content>
            <Text>• Desliza una fila para editar o eliminar.</Text>
            <Text>• Mantén presionado en inicio para activar arrastre.</Text>
            <Text>• Suelta sobre un grupo o en "Nivel raíz" para reubicar.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cerrarCoachMarks}>Entendido</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={mostrarAvisoGesto} onDismiss={() => setMostrarAvisoGesto(false)} duration={1800}>
        Completa el gesto para activar la acción
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 16
  },
  contenido: {
    gap: 8
  },
  campoMontoInicial: {
    marginTop: 10
  },
  accionesInferiores: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8
  }
});
