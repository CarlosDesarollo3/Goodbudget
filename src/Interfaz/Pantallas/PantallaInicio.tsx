import React, { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, FAB, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { TarjetaGrupo } from '@/Interfaz/Componentes/TarjetaGrupo';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { CalcularTotalesGrupoRecursivo } from '@/Servicios/MotorBalances';

export const PantallaInicio = ({ navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaInicio'>): React.JSX.Element => {
  const { grupos, cuentasPorGrupo, moneda, InicializarDatos, ObtenerBalanceCuenta, EjecutarReglasPendientes } = UsarAlmacenAplicacion();

  useEffect(() => {
    InicializarDatos();
    EjecutarReglasPendientes();
  }, [InicializarDatos, EjecutarReglasPendientes]);

  const cuentas = useMemo(() => Object.values(cuentasPorGrupo).flat(), [cuentasPorGrupo]);
  const mapaBalances = useMemo(
    () =>
      cuentas.reduce<Record<string, number>>((acumulado, cuenta) => {
        acumulado[cuenta.id] = ObtenerBalanceCuenta(cuenta.id);
        return acumulado;
      }, {}),
    [cuentas, ObtenerBalanceCuenta]
  );

  const totalGeneral = grupos
    .filter((grupo) => grupo.idGrupoPadre === null)
    .reduce((sumatoria, grupo) => sumatoria + CalcularTotalesGrupoRecursivo(grupo.id, grupos, cuentas, mapaBalances), 0);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall">Total general: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(totalGeneral)}</Text>
      <Button onPress={() => navigation.navigate('PantallaCategorias')}>Categorías</Button>
      <Button onPress={() => navigation.navigate('PantallaReglasRecurrentes')}>Reglas recurrentes</Button>
      <Button onPress={() => navigation.navigate('PantallaConfiguracion')}>Configuración</Button>
      <ScrollView>
        {grupos
          .filter((grupo) => grupo.idGrupoPadre === null)
          .map((grupo) => (
            <TarjetaGrupo
              key={grupo.id}
              nombre={grupo.nombre}
              total={CalcularTotalesGrupoRecursivo(grupo.id, grupos, cuentas, mapaBalances)}
              moneda={moneda}
              AlPresionar={() => navigation.navigate('PantallaDetalleGrupo', { idGrupo: grupo.id, nombreGrupo: grupo.nombre })}
            />
          ))}
      </ScrollView>
      <FAB icon="plus" label="Nuevo grupo" onPress={() => UsarAlmacenAplicacion.getState().CrearGrupo('Nuevo grupo', null)} style={{ position: 'absolute', right: 16, bottom: 16 }} />
    </View>
  );
};
