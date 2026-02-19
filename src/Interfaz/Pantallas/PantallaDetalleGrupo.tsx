import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { TarjetaCuenta } from '@/Interfaz/Componentes/TarjetaCuenta';
import { TarjetaGrupo } from '@/Interfaz/Componentes/TarjetaGrupo';
import { FilaDeslizableAcciones } from '@/Interfaz/Componentes/FilaDeslizableAcciones';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

type TipoNodo = 'grupo' | 'cuenta';

interface NodoSeleccionado {
  id: string;
  nombre: string;
  tipo: TipoNodo;
}

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
  const [mostrarAvisoGesto, setMostrarAvisoGesto] = useState(false);

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
          <FilaDeslizableAcciones
            key={grupo.id}
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
    paddingBottom: 88,
    gap: 8
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
