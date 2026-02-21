import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, SegmentedButtons, Snackbar, Surface, Text, TextInput } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { FilaTransaccion } from '@/Interfaz/Componentes/FilaTransaccion';
import { RepositorioSqlite } from '@/Datos/Repositorios/RepositorioSqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CerrarFilaAbierta, FilaDeslizableAcciones } from '@/Interfaz/Componentes/FilaDeslizableAcciones';
import { TipoTransaccion, Transaccion } from '@/Dominio/Modelos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const repositorio = new RepositorioSqlite();
type FiltroTipoTransaccion = 'TODOS' | TipoTransaccion.GASTO | TipoTransaccion.INGRESO | TipoTransaccion.TRANSFERENCIA;

const ParsearFechaFiltro = (valor: string, finDeDia = false): number | null => {
  const valorNormalizado = valor.trim();

  if (!valorNormalizado) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(valorNormalizado)) {
    return null;
  }

  const sufijoHora = finDeDia ? 'T23:59:59.999' : 'T00:00:00.000';
  const fecha = new Date(`${valorNormalizado}${sufijoHora}`);
  const timestamp = fecha.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

export const PantallaDetalleCuenta = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaDetalleCuenta'>): React.JSX.Element => {
  const { idCuenta } = route.params;
  const { ObtenerBalanceCuenta, moneda, categorias, ConvertirCuentaEnGrupo, EliminarTransaccion } = UsarAlmacenAplicacion();
  const insets = useSafeAreaInsets();
  const [transacciones, setTransacciones] = React.useState<Transaccion[]>([]);
  const [busqueda, setBusqueda] = React.useState('');
  const [filtroTipo, setFiltroTipo] = React.useState<FiltroTipoTransaccion>('TODOS');
  const [fechaDesde, setFechaDesde] = React.useState('');
  const [fechaHasta, setFechaHasta] = React.useState('');
  const [transaccionEliminar, setTransaccionEliminar] = React.useState<Transaccion | null>(null);
  const [mostrarAvisoGesto, setMostrarAvisoGesto] = React.useState(false);

  const recargarTransacciones = React.useCallback((): void => {
    setTransacciones(repositorio.ListarTransaccionesPorCuenta(idCuenta));
  }, [idCuenta]);

  useFocusEffect(
    React.useCallback(() => {
      recargarTransacciones();
    }, [recargarTransacciones])
  );

  const categoriasPorId = React.useMemo(() => {
    return categorias.reduce<Record<string, string>>((acumulado, categoria) => {
      acumulado[categoria.id] = categoria.nombre;
      return acumulado;
    }, {});
  }, [categorias]);

  const transaccionesFiltradas = React.useMemo(() => {
    const terminoBusqueda = busqueda.trim().toLowerCase();
    const inicio = ParsearFechaFiltro(fechaDesde);
    const fin = ParsearFechaFiltro(fechaHasta, true);

    return transacciones.filter((transaccion) => {
      const nota = transaccion.nota?.toLowerCase() ?? '';
      const categoria = (transaccion.idCategoria ? categoriasPorId[transaccion.idCategoria] : '')?.toLowerCase() ?? '';
      const coincideBusqueda = !terminoBusqueda || nota.includes(terminoBusqueda) || categoria.includes(terminoBusqueda);

      const coincideTipo = filtroTipo === 'TODOS' || transaccion.tipo === filtroTipo;

      const fechaTransaccion = new Date(transaccion.fecha).getTime();
      const coincideFechaInicio = inicio === null || fechaTransaccion >= inicio;
      const coincideFechaFin = fin === null || fechaTransaccion <= fin;

      return coincideBusqueda && coincideTipo && coincideFechaInicio && coincideFechaFin;
    });
  }, [busqueda, categoriasPorId, fechaDesde, fechaHasta, filtroTipo, transacciones]);

  const transaccionesAgrupadasPorMes = React.useMemo(() => {
    return transaccionesFiltradas.reduce<Array<{ clave: string; titulo: string; transacciones: Transaccion[] }>>((acumulado, transaccion) => {
      const fecha = new Date(transaccion.fecha);
      const claveMes = format(fecha, 'yyyy-MM');
      const tituloMes = format(fecha, 'MMMM yyyy', { locale: es });
      const grupoExistente = acumulado[acumulado.length - 1];

      if (!grupoExistente || grupoExistente.clave !== claveMes) {
        acumulado.push({
          clave: claveMes,
          titulo: tituloMes.charAt(0).toUpperCase() + tituloMes.slice(1),
          transacciones: [transaccion]
        });
        return acumulado;
      }

      grupoExistente.transacciones.push(transaccion);
      return acumulado;
    }, []);
  }, [transaccionesFiltradas]);

  const balanceCuenta = ObtenerBalanceCuenta(idCuenta);

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

      <Surface style={styles.tarjetaFiltros} elevation={1}>
        <TextInput
          mode="outlined"
          label="Buscar por nota o categoría"
          value={busqueda}
          onChangeText={setBusqueda}
          left={<TextInput.Icon icon="magnify" />}
        />

        <SegmentedButtons
          value={filtroTipo}
          onValueChange={(valor) => setFiltroTipo(valor as FiltroTipoTransaccion)}
          density="small"
          style={styles.segmentosTipo}
          buttons={[
            { value: 'TODOS', label: 'Todos' },
            { value: TipoTransaccion.GASTO, label: 'Gasto' },
            { value: TipoTransaccion.INGRESO, label: 'Ingreso' },
            { value: TipoTransaccion.TRANSFERENCIA, label: 'Transferencia' }
          ]}
        />

        <View style={styles.filaFechas}>
          <TextInput
            mode="outlined"
            label="Desde"
            placeholder="AAAA-MM-DD"
            value={fechaDesde}
            onChangeText={setFechaDesde}
            style={styles.inputFecha}
          />
          <TextInput
            mode="outlined"
            label="Hasta"
            placeholder="AAAA-MM-DD"
            value={fechaHasta}
            onChangeText={setFechaHasta}
            style={styles.inputFecha}
          />
        </View>
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
              onDuplicar={() => navigation.navigate('PantallaFormularioTransaccion', { transaccion, duplicar: true })}
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

      <Snackbar visible={mostrarAvisoGesto} onDismiss={() => setMostrarAvisoGesto(false)} duration={1800}>
        Completa el gesto para activar la acción
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
  tarjetaFiltros: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    backgroundColor: '#FFFFFF'
  },
  segmentosTipo: {
    marginTop: 2
  },
  filaFechas: {
    flexDirection: 'row',
    gap: 8
  },
  inputFecha: {
    flex: 1
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
    paddingBottom: 10
  },
  subtituloMes: {
    marginTop: 10,
    marginBottom: 6,
    color: '#445063'
  },
  textoVacio: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 20
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
