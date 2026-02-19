import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
    <View style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.contenido}>
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
          <View key={cuenta.id} style={styles.filaCuenta}>
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

      <View style={styles.accionesInferiores}>
        <Button mode="contained" onPress={() => CrearCuenta(`Cuenta ${cuentas.length + 1}`, idGrupo)}>Crear cuenta</Button>
        <Button mode="outlined" onPress={() => CrearGrupo(`Subgrupo ${subgrupos.length + 1}`, idGrupo)}>Crear subgrupo</Button>
      </View>
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
  filaCuenta: {
    flexDirection: 'row',
    alignItems: 'center'
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
