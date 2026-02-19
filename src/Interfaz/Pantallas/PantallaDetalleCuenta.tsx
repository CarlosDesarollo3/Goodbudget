import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { FilaTransaccion } from '@/Interfaz/Componentes/FilaTransaccion';
import { RepositorioSqlite } from '@/Datos/Repositorios/RepositorioSqlite';

const repositorio = new RepositorioSqlite();

export const PantallaDetalleCuenta = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaDetalleCuenta'>): React.JSX.Element => {
  const { idCuenta } = route.params;
  const { ObtenerBalanceCuenta, moneda, ConvertirCuentaEnGrupo } = UsarAlmacenAplicacion();
  const transacciones = useMemo(() => repositorio.ListarTransaccionesPorCuenta(idCuenta), [idCuenta]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      <Text variant="headlineSmall">Balance: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(ObtenerBalanceCuenta(idCuenta))}</Text>
      <Button mode="contained" onPress={() => navigation.navigate('PantallaFormularioTransaccion', { idCuentaPredeterminada: idCuenta })}>
        Añadir transacción
      </Button>
      <Button
        mode="outlined"
        onPress={() => {
          const grupo = ConvertirCuentaEnGrupo(idCuenta);

          if (grupo) {
            navigation.replace('PantallaDetalleGrupo', { idGrupo: grupo.id, nombreGrupo: grupo.nombre });
          }
        }}
      >
        Convertir en grupo y crear subcuentas
      </Button>
      <ScrollView>
        {transacciones.map((transaccion) => (
          <FilaTransaccion
            key={transaccion.id}
            transaccion={transaccion}
            moneda={moneda}
            onPress={() => navigation.navigate('PantallaFormularioTransaccion', { transaccion })}
            onEdit={() => navigation.navigate('PantallaFormularioTransaccion', { transaccion })}
            onDelete={() => {
              const { EliminarTransaccion } = UsarAlmacenAplicacion.getState();
              EliminarTransaccion(transaccion.id);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
};
