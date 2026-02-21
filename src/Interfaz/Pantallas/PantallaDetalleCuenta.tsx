import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, ProgressBar, Surface, Text, TextInput } from 'react-native-paper';
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
  const { ObtenerBalanceCuenta, moneda, ConvertirCuentaEnGrupo, EliminarTransaccion, ListarAvancesObjetivos, categorias, CrearObjetivoPresupuesto } = UsarAlmacenAplicacion();
  const insets = useSafeAreaInsets();
  const [transacciones, setTransacciones] = React.useState<Transaccion[]>([]);
  const [busqueda, setBusqueda] = React.useState('');
  const [filtroTipo, setFiltroTipo] = React.useState<FiltroTipoTransaccion>('TODOS');
  const [fechaDesde, setFechaDesde] = React.useState('');
  const [fechaHasta, setFechaHasta] = React.useState('');
  const [transaccionEliminar, setTransaccionEliminar] = React.useState<Transaccion | null>(null);
  const [mostrarAvisoGesto, setMostrarAvisoGesto] = React.useState(false);
  const [avisoObjetivo, setAvisoObjetivo] = React.useState<string | null>(null);

  const [mostrarDialogoObjetivo, setMostrarDialogoObjetivo] = React.useState(false);
  const [categoriaObjetivoSeleccionada, setCategoriaObjetivoSeleccionada] = React.useState<string | null>(null);
  const [montoObjetivo, setMontoObjetivo] = React.useState('');
  const [errorObjetivo, setErrorObjetivo] = React.useState<string | null>(null);

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


  const abrirDialogoObjetivo = (): void => {
    setCategoriaObjetivoSeleccionada(categorias[0]?.id ?? null);
    setMontoObjetivo('');
    setErrorObjetivo(null);
    setMostrarDialogoObjetivo(true);
  };

  const guardarObjetivo = (): void => {
    if (!categoriaObjetivoSeleccionada) {
      setErrorObjetivo('Selecciona una categoría para el objetivo.');
      return;
    }

    const monto = Number(montoObjetivo.replace(',', '.'));

    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorObjetivo('Ingresa un monto mensual válido mayor que cero.');
      return;
    }

    CrearObjetivoPresupuesto({
      idCuenta,
      idCategoria: categoriaObjetivoSeleccionada,
      montoMensual: monto,
      umbralAlerta: 0.8,
      rolloverHabilitado: false,
      activo: true
    });

    setMostrarDialogoObjetivo(false);
    setErrorObjetivo(null);
  };

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
        <View style={styles.filaTituloObjetivos}>
          <Text variant="labelLarge" style={styles.textoSecundario}>Objetivos de presupuesto</Text>
          <Button compact mode="text" onPress={abrirDialogoObjetivo}>Crear</Button>
        </View>
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

        <Dialog visible={mostrarDialogoObjetivo} onDismiss={() => setMostrarDialogoObjetivo(false)}>
          <Dialog.Title>Nuevo objetivo</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={styles.ayudaObjetivo}>Selecciona una categoría y define un monto mensual.</Text>
            <View style={styles.categoriasObjetivo}>
              {categorias.map((categoria) => (
                <Chip
                  key={categoria.id}
                  selected={categoriaObjetivoSeleccionada === categoria.id}
                  onPress={() => setCategoriaObjetivoSeleccionada(categoria.id)}
                  style={styles.chipCategoria}
                >
                  {categoria.nombre}
                </Chip>
              ))}
            </View>
            <TextInput
              label="Monto mensual"
              value={montoObjetivo}
              keyboardType="decimal-pad"
              onChangeText={setMontoObjetivo}
              mode="outlined"
            />
            {errorObjetivo && <Text style={styles.errorObjetivo}>{errorObjetivo}</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMostrarDialogoObjetivo(false)}>Cancelar</Button>
            <Button onPress={guardarObjetivo}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>

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
  filaTituloObjetivos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ayudaObjetivo: {
    marginBottom: 8,
    opacity: 0.75
  },
  categoriasObjetivo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  chipCategoria: {
    marginRight: 4
  },
  errorObjetivo: {
    color: '#C4362D',
    marginTop: 8
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
