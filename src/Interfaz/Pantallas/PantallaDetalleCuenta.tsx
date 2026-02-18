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
  const { ObtenerBalanceCuenta, moneda } = UsarAlmacenAplicacion();
  const transacciones = useMemo(() => repositorio.ListarTransaccionesPorCuenta(idCuenta), [idCuenta]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall">Balance: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(ObtenerBalanceCuenta(idCuenta))}</Text>
      <Button mode="contained" onPress={() => navigation.navigate('PantallaFormularioTransaccion', { idCuentaPredeterminada: idCuenta })}>
        Añadir transacción
      </Button>
      <ScrollView>
        {transacciones.map((transaccion) => (
          <FilaTransaccion key={transaccion.id} transaccion={transaccion} moneda={moneda} />
        ))}
      </ScrollView>
    </View>
  );
};
