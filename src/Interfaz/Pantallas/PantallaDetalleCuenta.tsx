import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Snackbar, Surface, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { FilaTransaccion } from '@/Interfaz/Componentes/FilaTransaccion';
import { FilaDeslizableAcciones } from '@/Interfaz/Componentes/FilaDeslizableAcciones';
import { RepositorioSqlite } from '@/Datos/Repositorios/RepositorioSqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Transaccion } from '@/Dominio/Modelos';

const repositorio = new RepositorioSqlite();

export const PantallaDetalleCuenta = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaDetalleCuenta'>): React.JSX.Element => {
  const { idCuenta } = route.params;
  const { ObtenerBalanceCuenta, moneda, ConvertirCuentaEnGrupo, EliminarTransaccion } = UsarAlmacenAplicacion();
  const insets = useSafeAreaInsets();
  const [transacciones, setTransacciones] = React.useState(() => repositorio.ListarTransaccionesPorCuenta(idCuenta));
  const [transaccionEliminar, setTransaccionEliminar] = React.useState<Transaccion | null>(null);
  const [avisoGesto, setAvisoGesto] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setTransacciones(repositorio.ListarTransaccionesPorCuenta(idCuenta));
    }, [idCuenta])
  );

  const balanceCuenta = ObtenerBalanceCuenta(idCuenta);

  const confirmarEliminacion = (): void => {
    if (!transaccionEliminar) {
      return;
    }

    EliminarTransaccion(transaccionEliminar.id);
    setTransacciones(repositorio.ListarTransaccionesPorCuenta(idCuenta));
    setTransaccionEliminar(null);
  };

  return (
    <View style={styles.contenedor}>
      <Surface style={styles.tarjetaTotal} elevation={1}>
        <Text variant="labelLarge" style={styles.textoSecundario}>Balance</Text>
        <Text variant="headlineSmall" style={balanceCuenta >= 0 ? styles.montoPositivo : styles.montoNegativo}>
          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(balanceCuenta)}
        </Text>
      </Surface>

      <ScrollView contentContainerStyle={[styles.listaContenedora, { paddingBottom: 100 + insets.bottom }]}>
        {transacciones.map((transaccion) => (
          <FilaDeslizableAcciones
            key={transaccion.id}
            id={`transaccion-${transaccion.id}`}
            onEditar={() => navigation.navigate('PantallaFormularioTransaccion', { transaccion })}
            onEliminar={() => setTransaccionEliminar(transaccion)}
            onDeslizamientoInsuficiente={() => setAvisoGesto(true)}
          >
            <FilaTransaccion
              transaccion={transaccion}
              idCuentaContexto={idCuenta}
              moneda={moneda}
              onPress={() => navigation.navigate('PantallaFormularioTransaccion', { transaccion })}
            />
          </FilaDeslizableAcciones>
        ))}
      </ScrollView>

      <View style={[styles.accionesInferiores, { bottom: 12 + insets.bottom }]}>
        <Button
          mode="contained"
          style={styles.botonAccion}
          onPress={() => navigation.navigate('PantallaFormularioTransaccion', { idCuentaPredeterminada: idCuenta })}
        >
          Añadir transacción
        </Button>
        <Button
          mode="outlined"
          style={styles.botonAccion}
          onPress={() => {
            const grupo = ConvertirCuentaEnGrupo(idCuenta);

            if (grupo) {
              navigation.replace('PantallaDetalleGrupo', { idGrupo: grupo.id, nombreGrupo: grupo.nombre });
            }
          }}
        >
          Convertir en grupo
        </Button>
      </View>

      <Portal>
        <Dialog visible={Boolean(transaccionEliminar)} onDismiss={() => setTransaccionEliminar(null)}>
          <Dialog.Title>Eliminar transacción</Dialog.Title>
          <Dialog.Content>
            <Text>¿Seguro que deseas eliminar esta transacción de la cuenta?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTransaccionEliminar(null)}>Cancelar</Button>
            <Button onPress={confirmarEliminacion}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={avisoGesto} onDismiss={() => setAvisoGesto(false)} duration={1800}>
        Desliza más para editar o eliminar.
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#F2F5F9'
  },
  tarjetaTotal: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF'
  },
  textoSecundario: {
    opacity: 0.75,
    marginBottom: 4
  },
  montoPositivo: {
    color: '#1F8F4C'
  },
  montoNegativo: {
    color: '#C4362D'
  },
  listaContenedora: {
    gap: 8
  },
  accionesInferiores: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  botonAccion: {
    flex: 1,
    maxWidth: 220
  }
});
