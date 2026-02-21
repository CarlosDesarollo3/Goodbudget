import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { FilaTransaccion } from '@/Interfaz/Componentes/FilaTransaccion';
import { RepositorioSqlite } from '@/Datos/Repositorios/RepositorioSqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const repositorio = new RepositorioSqlite();

export const PantallaDetalleCuenta = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaDetalleCuenta'>): React.JSX.Element => {
  const { idCuenta } = route.params;
  const { ObtenerBalanceCuenta, moneda, ConvertirCuentaEnGrupo } = UsarAlmacenAplicacion();
  const insets = useSafeAreaInsets();
  const [transacciones, setTransacciones] = React.useState(() => repositorio.ListarTransaccionesPorCuenta(idCuenta));

  useFocusEffect(
    React.useCallback(() => {
      setTransacciones(repositorio.ListarTransaccionesPorCuenta(idCuenta));
    }, [idCuenta])
  );

  const balanceCuenta = ObtenerBalanceCuenta(idCuenta);

  return (
    <View style={styles.contenedor}>
      <Surface style={styles.tarjetaTotal} elevation={1}>
        <Text variant="labelLarge" style={styles.textoSecundario}>Balance</Text>
        <Text variant="headlineSmall" style={balanceCuenta >= 0 ? styles.montoPositivo : styles.montoNegativo}>
          {FormatearMoneda(balanceCuenta, moneda)}
        </Text>
      </Surface>

      <ScrollView contentContainerStyle={[styles.listaContenedora, { paddingBottom: 100 + insets.bottom }]}>
        {transacciones.map((transaccion) => (
          <FilaTransaccion
            key={transaccion.id}
            transaccion={transaccion}
            idCuentaContexto={idCuenta}
            moneda={moneda}
            onPress={() => navigation.navigate('PantallaFormularioTransaccion', { transaccion })}
          />
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
  }
});
