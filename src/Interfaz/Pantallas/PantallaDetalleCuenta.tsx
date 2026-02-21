import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, ProgressBar, Surface, Text } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { FilaTransaccion } from '@/Interfaz/Componentes/FilaTransaccion';
import { RepositorioSqlite } from '@/Datos/Repositorios/RepositorioSqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CerrarFilaAbierta, FilaDeslizableAcciones } from '@/Interfaz/Componentes/FilaDeslizableAcciones';
import { Transaccion } from '@/Dominio/Modelos';

const repositorio = new RepositorioSqlite();

export const PantallaDetalleCuenta = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaDetalleCuenta'>): React.JSX.Element => {
  const { idCuenta } = route.params;
  const { ObtenerBalanceCuenta, moneda, ConvertirCuentaEnGrupo, EliminarTransaccion, ListarAvancesObjetivos, categorias } = UsarAlmacenAplicacion();
  const insets = useSafeAreaInsets();
  const [transacciones, setTransacciones] = React.useState<Transaccion[]>([]);
  const [transaccionEliminar, setTransaccionEliminar] = React.useState<Transaccion | null>(null);
  const [mostrarAvisoGesto, setMostrarAvisoGesto] = React.useState(false);
  const [avisoObjetivo, setAvisoObjetivo] = React.useState<string | null>(null);

  const recargarTransacciones = React.useCallback((): void => {
    setTransacciones(repositorio.ListarTransaccionesPorCuenta(idCuenta));
  }, [idCuenta]);

  useFocusEffect(
    React.useCallback(() => {
      recargarTransacciones();
    }, [recargarTransacciones])
  );

  const balanceCuenta = ObtenerBalanceCuenta(idCuenta);
  const avances = React.useMemo(() => ListarAvancesObjetivos(idCuenta), [ListarAvancesObjetivos, idCuenta]);

  React.useEffect(() => {
    const hoy = new Date();
    const alerta = avances.find((avance) => avance.excedido || avance.alertaUmbral);

    if (!alerta) {
      return;
    }

    if (alerta.excedido) {
      setAvisoObjetivo('Sobregasto en una categoría con objetivo activo.');
      return;
    }

    if (hoy.getDate() >= 26) {
      setAvisoObjetivo('Vencimiento cercano: revisa tus objetivos mensuales.');
    }
  }, [avances]);

  const confirmarEliminacion = (): void => {
    if (!transaccionEliminar) {
      return;
    }

    EliminarTransaccion(transaccionEliminar.id);
    setTransaccionEliminar(null);
    recargarTransacciones();
  };

  return (
    <View style={styles.contenedor}>
      <Surface style={styles.tarjetaTotal} elevation={1}>
        <Text variant="labelLarge" style={styles.textoSecundario}>Balance</Text>
        <Text variant="headlineSmall" style={balanceCuenta >= 0 ? styles.montoPositivo : styles.montoNegativo}>
          {FormatearMoneda(balanceCuenta, moneda)}
        </Text>
      </Surface>

      <Surface style={styles.tarjetaTotal} elevation={1}>
        <Text variant="labelLarge" style={styles.textoSecundario}>Objetivos de presupuesto</Text>
        {avances.length === 0 ? (
          <Text variant="bodySmall" style={styles.textoSecundario}>Sin objetivos configurados para esta cuenta.</Text>
        ) : (
          avances.map((avance) => {
            const categoria = categorias.find((item) => item.id === avance.objetivo.idCategoria)?.nombre ?? avance.objetivo.idCategoria;
            const progreso = Math.max(0, Math.min(avance.progreso, 1));
            return (
              <View key={avance.objetivo.id} style={styles.bloqueObjetivo}>
                <Text variant="bodySmall">{categoria}</Text>
                <ProgressBar progress={progreso} color={avance.excedido || avance.alertaUmbral ? '#C4362D' : '#1F8F4C'} style={styles.barraObjetivo} />
                <Text variant="labelSmall" style={avance.excedido ? styles.montoNegativo : styles.textoSecundario}>
                  {Math.round(avance.progreso * 100)}% · {FormatearMoneda(avance.gastoActual, moneda)} / {FormatearMoneda(avance.presupuestoDisponible, moneda)}
                </Text>
              </View>
            );
          })
        )}
      </Surface>

      <ScrollView
        contentContainerStyle={[styles.listaContenedora, { paddingBottom: 100 + insets.bottom }]}
        onStartShouldSetResponder={() => {
          CerrarFilaAbierta();
          return false;
        }}
      >
        {transacciones.map((transaccion) => (
          <FilaDeslizableAcciones
            key={transaccion.id}
            id={transaccion.id}
            onEditar={() => navigation.navigate('PantallaFormularioTransaccion', { transaccion })}
            onEliminar={() => setTransaccionEliminar(transaccion)}
            etiquetaEditar="Editar"
            etiquetaEliminar="Eliminar"
            onDeslizamientoInsuficiente={() => setMostrarAvisoGesto(true)}
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
          <Dialog.Title>Eliminar movimiento</Dialog.Title>
          <Dialog.Content>
            <Text>¿Seguro que deseas eliminar este movimiento?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTransaccionEliminar(null)}>Cancelar</Button>
            <Button onPress={confirmarEliminacion}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {mostrarAvisoGesto && <Text style={[styles.avisoTexto, { bottom: 82 + insets.bottom }]}>Completa el gesto para activar la acción</Text>}
      {avisoObjetivo && <Text style={[styles.avisoTexto, { bottom: 126 + insets.bottom }]}>{avisoObjetivo}</Text>}
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
  bloqueObjetivo: {
    marginTop: 8,
    gap: 4
  },
  barraObjetivo: {
    height: 8,
    borderRadius: 8
  },
  listaContenedora: {},
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
  },
  avisoTexto: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 80,
    backgroundColor: '#2F3B4A',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  }
});
