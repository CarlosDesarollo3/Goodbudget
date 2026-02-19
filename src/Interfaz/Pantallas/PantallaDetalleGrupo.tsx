import React from 'react';
import { ScrollView, View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { TarjetaCuenta } from '@/Interfaz/Componentes/TarjetaCuenta';
import { TarjetaGrupo } from '@/Interfaz/Componentes/TarjetaGrupo';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

export const PantallaDetalleGrupo = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaDetalleGrupo'>): React.JSX.Element => {
  const { idGrupo } = route.params;
  const { grupos, cuentasPorGrupo, CrearCuenta, CrearGrupo, ObtenerBalanceCuenta, moneda } = UsarAlmacenAplicacion();
  const cuentas = cuentasPorGrupo[idGrupo] ?? [];
  const subgrupos = grupos.filter((grupo) => grupo.idGrupoPadre === idGrupo);

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button mode="contained" onPress={() => CrearCuenta(`Cuenta ${cuentas.length + 1}`, idGrupo)}>Crear cuenta</Button>
        <Button mode="outlined" onPress={() => CrearGrupo(`Subgrupo ${subgrupos.length + 1}`, idGrupo)}>Crear subgrupo</Button>
      </View>

      {subgrupos.map((grupo) => (
        <TarjetaGrupo
          key={grupo.id}
          nombre={grupo.nombre}
          total={0}
          moneda={moneda}
          AlPresionar={() => navigation.push('PantallaDetalleGrupo', { idGrupo: grupo.id, nombreGrupo: grupo.nombre })}
        />
      ))}

      {cuentas.map((cuenta) => (
        <View key={cuenta.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TarjetaCuenta
            nombre={cuenta.nombre}
            balance={ObtenerBalanceCuenta(cuenta.id)}
            moneda={moneda}
            AlPresionar={() => navigation.navigate('PantallaDetalleCuenta', { idCuenta: cuenta.id, nombreCuenta: cuenta.nombre })}
          />
          <IconButton icon="delete" onPress={() => {
            const { EliminarCuenta } = UsarAlmacenAplicacion.getState();
            EliminarCuenta(cuenta.id);
          }} />
        </View>
      ))}
    </ScrollView>
  );
};
