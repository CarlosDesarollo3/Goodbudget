import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { RepositorioSqlite } from '@/Datos/Repositorios/RepositorioSqlite';
import { GenerarResumenAnalitica, ResumenAnalitica } from '@/Servicios/ServicioAnalitica';
import { FormatearMoneda } from '@/Utilidades/Formatos';

const repositorio = new RepositorioSqlite();

const TarjetaKpi = ({ titulo, valor, positivo }: { titulo: string; valor: string; positivo?: boolean }): React.JSX.Element => (
  <Surface style={styles.tarjetaKpi} elevation={1}>
    <Text variant="labelLarge" style={styles.textoSecundario}>{titulo}</Text>
    <Text variant="titleLarge" style={positivo ? styles.kpiPositivo : styles.kpiNegativo}>{valor}</Text>
  </Surface>
);

export const PantallaAnalitica = (_: NativeStackScreenProps<ParametrosNavegacion, 'PantallaAnalitica'>): React.JSX.Element => {
  const { categorias, moneda } = UsarAlmacenAplicacion();
  const [resumen, setResumen] = React.useState<ResumenAnalitica | null>(null);

  const recargarResumen = React.useCallback((): void => {
    const transacciones = repositorio.ListarTransacciones();
    const cuentas = repositorio.ListarCuentas();
    setResumen(GenerarResumenAnalitica(transacciones, categorias, cuentas));
  }, [categorias]);

  useFocusEffect(
    React.useCallback(() => {
      recargarResumen();
    }, [recargarResumen])
  );

  if (!resumen) {
    return <View style={styles.contenedor} />;
  }

  const maxCategoria = Math.max(...resumen.gastoPorCategoria.map((dato) => dato.total), 1);
  const maxEvolucion = Math.max(...resumen.evolucionMensual.map((dato) => Math.max(dato.gastos, dato.ingresos)), 1);
  const totalCategorias = resumen.gastoPorCategoria.reduce((ac, item) => ac + item.total, 0);

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <View style={styles.filaKpis}>
        <TarjetaKpi titulo="Ahorro neto" valor={FormatearMoneda(resumen.ahorroNeto, moneda)} positivo={resumen.ahorroNeto >= 0} />
        <TarjetaKpi titulo="Gasto promedio" valor={FormatearMoneda(resumen.gastoPromedio, moneda)} positivo={false} />
      </View>

      <Surface style={styles.tarjeta} elevation={1}>
        <Text variant="titleMedium">Gasto por categoría (barras)</Text>
        {resumen.gastoPorCategoria.length === 0 ? <Text style={styles.vacio}>Sin gastos todavía.</Text> : resumen.gastoPorCategoria.map((dato) => (
          <View key={dato.idCategoria} style={styles.filaGrafico}>
            <Text style={styles.etiquetaFila}>{dato.nombre}</Text>
            <View style={styles.pistaBarra}><View style={[styles.barra, { width: `${(dato.total / maxCategoria) * 100}%`, backgroundColor: dato.color }]} /></View>
            <Text style={styles.valorFila}>{FormatearMoneda(dato.total, moneda)}</Text>
          </View>
        ))}
      </Surface>

      <Surface style={styles.tarjeta} elevation={1}>
        <Text variant="titleMedium">Evolución mensual (líneas)</Text>
        {resumen.evolucionMensual.length === 0 ? <Text style={styles.vacio}>Sin movimientos mensuales.</Text> : (
          <View style={styles.lineaContenedor}>
            {resumen.evolucionMensual.map((dato) => (
              <View key={dato.mes} style={styles.columnaLinea}>
                <View style={[styles.punto, { bottom: `${(dato.gastos / maxEvolucion) * 100}%`, backgroundColor: '#EF4444' }]} />
                <View style={[styles.punto, { bottom: `${(dato.ingresos / maxEvolucion) * 100}%`, backgroundColor: '#10B981' }]} />
                <Text style={styles.etiquetaMes}>{dato.mes.slice(5)}</Text>
              </View>
            ))}
          </View>
        )}
      </Surface>

      <Surface style={styles.tarjeta} elevation={1}>
        <Text variant="titleMedium">Distribución de gasto (pastel simplificado)</Text>
        <View style={styles.pastelFila}>
          {resumen.gastoPorCategoria.slice(0, 4).map((dato) => (
            <View key={`legend-${dato.idCategoria}`} style={styles.leyendaItem}>
              <View style={[styles.puntoLeyenda, { backgroundColor: dato.color }]} />
              <Text>{dato.nombre} ({totalCategorias > 0 ? Math.round((dato.total / totalCategorias) * 100) : 0}%)</Text>
            </View>
          ))}
        </View>
      </Surface>

      <Surface style={styles.tarjeta} elevation={1}>
        <Text variant="titleMedium">Top cuentas por gasto</Text>
        {resumen.topCuentas.map((cuenta, indice) => (
          <View key={cuenta.idCuenta} style={styles.filaTop}>
            <Text style={styles.posicion}>{indice + 1}.</Text>
            <Text style={styles.nombreCuenta}>{cuenta.nombre}</Text>
            <Text>{FormatearMoneda(cuenta.totalGasto, moneda)}</Text>
          </View>
        ))}
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    padding: 14,
    backgroundColor: '#F2F5F9',
    gap: 12
  },
  filaKpis: {
    flexDirection: 'row',
    gap: 10
  },
  tarjetaKpi: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF'
  },
  textoSecundario: {
    color: '#4B5563'
  },
  kpiPositivo: {
    color: '#059669',
    fontWeight: '700'
  },
  kpiNegativo: {
    color: '#DC2626',
    fontWeight: '700'
  },
  tarjeta: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8
  },
  vacio: {
    color: '#6B7280'
  },
  filaGrafico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  etiquetaFila: {
    width: 100,
    fontSize: 12
  },
  pistaBarra: {
    flex: 1,
    height: 10,
    borderRadius: 99,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden'
  },
  barra: {
    height: '100%'
  },
  valorFila: {
    width: 100,
    textAlign: 'right',
    fontSize: 12
  },
  lineaContenedor: {
    height: 130,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6
  },
  columnaLinea: {
    flex: 1,
    height: '100%',
    borderLeftWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    justifyContent: 'flex-end'
  },
  punto: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 9,
    left: 2
  },
  etiquetaMes: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center'
  },
  pastelFila: {
    gap: 6
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  puntoLeyenda: {
    width: 10,
    height: 10,
    borderRadius: 10
  },
  filaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4
  },
  posicion: {
    width: 18,
    fontWeight: '700'
  },
  nombreCuenta: {
    flex: 1
  }
});
