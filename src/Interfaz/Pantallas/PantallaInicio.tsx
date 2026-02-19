import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, FAB, Surface, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { TarjetaGrupo } from '@/Interfaz/Componentes/TarjetaGrupo';
import { TarjetaCuenta } from '@/Interfaz/Componentes/TarjetaCuenta';
import { CLAVE_CUENTAS_RAIZ, UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { CalcularTotalesGrupoRecursivo } from '@/Servicios/MotorBalances';
import { FormatearMoneda } from '@/Utilidades/Formatos';

export const PantallaInicio = ({ navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaInicio'>): React.JSX.Element => {
  const { grupos, cuentasPorGrupo, moneda, InicializarDatos, ObtenerBalanceCuenta, EjecutarReglasPendientes, CrearGrupo, CrearCuenta } = UsarAlmacenAplicacion();
  const [expansionPorGrupo, setExpansionPorGrupo] = useState<Record<string, boolean>>({});

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
    .reduce((sumatoria, grupo) => sumatoria + CalcularTotalesGrupoRecursivo(grupo.id, grupos, cuentas, mapaBalances), 0)
    + (cuentasPorGrupo[CLAVE_CUENTAS_RAIZ] ?? []).reduce((sumatoria, cuenta) => sumatoria + (mapaBalances[cuenta.id] ?? 0), 0);

  const alternarExpansion = (idGrupo: string): void => {
    setExpansionPorGrupo((anterior) => ({ ...anterior, [idGrupo]: !anterior[idGrupo] }));
  };

  const RenderizarGrupoConContenido = (idGrupo: string, nivel = 0): React.JSX.Element[] => {
    const grupo = grupos.find((item) => item.id === idGrupo);

    if (!grupo) {
      return [];
    }

    const cuentasGrupo = cuentasPorGrupo[idGrupo] ?? [];
    const subgrupos = grupos.filter((item) => item.idGrupoPadre === idGrupo);
    const expandido = expansionPorGrupo[idGrupo] ?? true;

    const contenidoExpandido = expandido
      ? [
          ...cuentasGrupo.map((cuenta) => (
            <View key={`cuenta-${cuenta.id}`} style={[styles.itemContenedor, { marginLeft: (nivel + 1) * 10 }]}> 
              <TarjetaCuenta
                nombre={cuenta.nombre}
                balance={ObtenerBalanceCuenta(cuenta.id)}
                moneda={moneda}
                AlPresionar={() => navigation.navigate('PantallaDetalleCuenta', { idCuenta: cuenta.id, nombreCuenta: cuenta.nombre })}
              />
            </View>
          )),
          ...subgrupos.flatMap((subgrupo) => RenderizarGrupoConContenido(subgrupo.id, nivel + 1))
        ]
      : [];

    return [
      <View key={`grupo-${grupo.id}`} style={[styles.itemContenedor, { marginLeft: nivel * 10 }]}> 
        <TarjetaGrupo
          nombre={grupo.nombre}
          total={CalcularTotalesGrupoRecursivo(grupo.id, grupos, cuentas, mapaBalances)}
          moneda={moneda}
          expandido={expandido}
          AlAlternarExpansion={() => alternarExpansion(grupo.id)}
          AlPresionar={() => navigation.navigate('PantallaDetalleGrupo', { idGrupo: grupo.id, nombreGrupo: grupo.nombre })}
        />
      </View>,
      ...contenidoExpandido
    ];
  };

  const cuentasRaiz = cuentasPorGrupo[CLAVE_CUENTAS_RAIZ] ?? [];

  return (
    <View style={styles.contenedor}>
      <Surface style={styles.tarjetaTotal} elevation={1}>
        <Text variant="labelLarge" style={styles.textoSecundario}>Total general</Text>
        <Text variant="headlineSmall" style={totalGeneral >= 0 ? styles.montoPositivo : styles.montoNegativo}>{FormatearMoneda(totalGeneral, moneda)}</Text>
      </Surface>

      <View style={styles.accionesInicio}>
        <Button mode="contained" onPress={() => CrearCuenta('Cuenta principal', null)}>Nueva cuenta</Button>
        <Button mode="outlined" onPress={() => CrearGrupo('Nuevo grupo', null)}>Nuevo grupo</Button>
      </View>

      <ScrollView contentContainerStyle={styles.listaContenedora}>
        {cuentasRaiz.map((cuenta) => (
          <View key={`cuenta-raiz-${cuenta.id}`} style={styles.itemContenedor}>
            <TarjetaCuenta
              nombre={cuenta.nombre}
              balance={ObtenerBalanceCuenta(cuenta.id)}
              moneda={moneda}
              AlPresionar={() => navigation.navigate('PantallaDetalleCuenta', { idCuenta: cuenta.id, nombreCuenta: cuenta.nombre })}
            />
          </View>
        ))}
        {grupos.filter((grupo) => grupo.idGrupoPadre === null).flatMap((grupo) => RenderizarGrupoConContenido(grupo.id))}
      </ScrollView>

      <FAB
        icon="plus"
        label="Nueva cuenta"
        onPress={() => CrearCuenta('Cuenta principal', null)}
        style={styles.fab}
      />
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
  accionesInicio: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
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
    paddingBottom: 88
  },
  itemContenedor: {
    marginBottom: 6
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16
  }
});
