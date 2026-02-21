import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, ProgressBar, Searchbar, Surface, Text, TextInput } from 'react-native-paper';
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
import { EstadoVacioLista } from '@/Interfaz/Componentes/EstadoVacioLista';

const repositorio = new RepositorioSqlite();
type FiltroTipoTransaccion = 'TODOS' | TipoTransaccion.GASTO | TipoTransaccion.INGRESO | TipoTransaccion.TRANSFERENCIA;
type PresetRangoFecha = '7_DIAS' | '30_DIAS' | 'MES_ACTUAL' | 'PERSONALIZADO';

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
  const [presetRangoFecha, setPresetRangoFecha] = React.useState<PresetRangoFecha>('PERSONALIZADO');
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

  const aplicarPresetFecha = React.useCallback((preset: PresetRangoFecha): void => {
    setPresetRangoFecha(preset);

    if (preset === 'PERSONALIZADO') {
      return;
    }

    const hoy = new Date();
    let inicio = new Date();
    const fin = new Date();

    if (preset === '7_DIAS') {
      inicio.setDate(hoy.getDate() - 6);
    } else if (preset === '30_DIAS') {
      inicio.setDate(hoy.getDate() - 29);
    } else {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }

    setFechaDesde(format(inicio, 'yyyy-MM-dd'));
    setFechaHasta(format(fin, 'yyyy-MM-dd'));
  }, []);

  const errorFechaDesde = React.useMemo(() => {
    if (!fechaDesde.trim()) {
      return null;
    }

    return ParsearFechaFiltro(fechaDesde) === null ? 'Fecha desde inválida. Usa formato AAAA-MM-DD.' : null;
  }, [fechaDesde]);

  const errorFechaHasta = React.useMemo(() => {
    if (!fechaHasta.trim()) {
      return null;
    }

    return ParsearFechaFiltro(fechaHasta, true) === null ? 'Fecha hasta inválida. Usa formato AAAA-MM-DD.' : null;
  }, [fechaHasta]);

  const hayErrorRangoFecha = Boolean(errorFechaDesde || errorFechaHasta);

  const descripcionRangoActivo = React.useMemo(() => {
    if (!fechaDesde && !fechaHasta) {
      return 'Sin rango de fechas activo';
    }

    const inicio = ParsearFechaFiltro(fechaDesde);
    const fin = ParsearFechaFiltro(fechaHasta, true);

    if (hayErrorRangoFecha) {
      return 'Corrige el formato de fecha para aplicar el rango personalizado';
    }

    const formatearNatural = (timestamp: number): string => format(new Date(timestamp), "d 'de' MMMM yyyy", { locale: es });

    if (inicio && fin) {
      return `Desde ${formatearNatural(inicio)} hasta ${formatearNatural(fin)}`;
    }

    if (inicio) {
      return `Desde ${formatearNatural(inicio)} en adelante`;
    }

    if (fin) {
      return `Hasta ${formatearNatural(fin)}`;
    }

    return 'Sin rango de fechas activo';
  }, [fechaDesde, fechaHasta, hayErrorRangoFecha]);

  const transaccionesFiltradas = React.useMemo(() => {
    const terminoBusqueda = busqueda.trim().toLowerCase();
    const inicio = hayErrorRangoFecha ? null : ParsearFechaFiltro(fechaDesde);
    const fin = hayErrorRangoFecha ? null : ParsearFechaFiltro(fechaHasta, true);

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
      <ScrollView
        contentContainerStyle={[styles.contenidoPrincipal, { paddingBottom: 120 + insets.bottom }]}
        onStartShouldSetResponder={() => {
          CerrarFilaAbierta();
          return false;
        }}
      >
        <Surface style={styles.tarjetaTotal} elevation={1}>
        <Text variant="labelLarge" style={styles.textoSecundario}>Balance</Text>
        <Text variant="headlineSmall" style={balanceCuenta >= 0 ? styles.montoPositivo : styles.montoNegativo}>
          {FormatearMoneda(balanceCuenta, moneda)}
        </Text>
        </Surface>

        <Surface style={styles.tarjetaFiltros} elevation={1}>
        <Text variant="labelLarge" style={styles.textoSecundario}>Buscar y filtrar movimientos</Text>
        <Searchbar
          placeholder="Buscar por nota o categoría"
          value={busqueda}
          onChangeText={setBusqueda}
          style={styles.buscador}
        />

        <View style={styles.segmentosTipo}>
          {(['TODOS', TipoTransaccion.GASTO, TipoTransaccion.INGRESO, TipoTransaccion.TRANSFERENCIA] as const).map((tipo) => (
            <Chip
              key={tipo}
              selected={filtroTipo === tipo}
              onPress={() => setFiltroTipo(tipo)}
              compact
            >
              {tipo === 'TODOS' ? 'Todos' : tipo}
            </Chip>
          ))}
        </View>

        <View style={styles.filaFechas}>
          <TextInput
            style={styles.inputFecha}
            mode="outlined"
            dense
            value={fechaDesde}
            onChangeText={(valor) => {
              setFechaDesde(valor);
              setPresetRangoFecha('PERSONALIZADO');
            }}
            label="Desde (AAAA-MM-DD)"
            placeholder="2026-01-01"
            error={Boolean(errorFechaDesde)}
          />
          <TextInput
            style={styles.inputFecha}
            mode="outlined"
            dense
            value={fechaHasta}
            onChangeText={(valor) => {
              setFechaHasta(valor);
              setPresetRangoFecha('PERSONALIZADO');
            }}
            label="Hasta (AAAA-MM-DD)"
            placeholder="2026-12-31"
            error={Boolean(errorFechaHasta)}
          />
        </View>

        <View style={styles.segmentosTipo}>
          {([
            { id: '7_DIAS', etiqueta: '7 días' },
            { id: '30_DIAS', etiqueta: '30 días' },
            { id: 'MES_ACTUAL', etiqueta: 'Mes actual' },
            { id: 'PERSONALIZADO', etiqueta: 'Personalizado' }
          ] as const).map((preset) => (
            <Chip
              key={preset.id}
              selected={presetRangoFecha === preset.id}
              onPress={() => aplicarPresetFecha(preset.id)}
              compact
            >
              {preset.etiqueta}
            </Chip>
          ))}
        </View>

        {(errorFechaDesde || errorFechaHasta) && (
          <Text style={styles.errorObjetivo}>{errorFechaDesde ?? errorFechaHasta}</Text>
        )}

        <Text variant="bodySmall" style={styles.textoSecundario}>{descripcionRangoActivo}</Text>

        <View style={styles.filaResumenFiltros}>
          <Text variant="bodySmall" style={styles.textoSecundario}>
            Mostrando {transaccionesFiltradas.length} de {transacciones.length} movimientos
          </Text>
          <Button
            compact
            onPress={() => {
              setBusqueda('');
              setFiltroTipo('TODOS');
              setFechaDesde('');
              setFechaHasta('');
              setPresetRangoFecha('PERSONALIZADO');
            }}
          >
            Limpiar
          </Button>
        </View>
        <Button
          mode="outlined"
          compact
          style={styles.botonRestablecerRango}
          onPress={() => {
            setFechaDesde('');
            setFechaHasta('');
            setPresetRangoFecha('PERSONALIZADO');
          }}
        >
          Restablecer rango
        </Button>
        </Surface>

        <Surface style={styles.tarjetaTotalCompacta} elevation={1}>
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

        {transaccionesFiltradas.length === 0 ? (
          <EstadoVacioLista
            icono="text-box-search-outline"
            titulo={transacciones.length === 0 ? 'Todavía no hay movimientos' : 'Sin resultados con esos filtros'}
            descripcion={transacciones.length === 0
              ? 'Empieza creando tu primer movimiento para ver el historial de esta cuenta.'
              : 'Prueba cambiar la búsqueda, el tipo o el rango de fechas para encontrar más resultados.'}
            etiquetaCta={transacciones.length === 0 ? 'Añadir transacción' : 'Limpiar filtros'}
            onPressCta={() => {
              if (transacciones.length === 0) {
                navigation.navigate('PantallaFormularioTransaccion', { idCuentaPredeterminada: idCuenta });
                return;
              }

              setBusqueda('');
              setFiltroTipo('TODOS');
              setFechaDesde('');
              setFechaHasta('');
              setPresetRangoFecha('PERSONALIZADO');
            }}
          />
        ) : (
          transaccionesAgrupadasPorMes.map((grupo) => (
            <View key={grupo.clave} style={styles.bloqueMes}>
              <Text variant="titleSmall" style={styles.tituloMes}>{grupo.titulo}</Text>
              {grupo.transacciones.map((transaccion) => (
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
            </View>
          ))
        )}
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
  contenidoPrincipal: {
    gap: 10
  },
  tarjetaTotal: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF'
  },
  tarjetaTotalCompacta: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF'
  },
  tarjetaFiltros: {
    borderRadius: 16,
    padding: 10,
    gap: 8,
    backgroundColor: '#FFFFFF'
  },
  segmentosTipo: {
    marginTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
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
  buscador: {
    backgroundColor: '#F8FBFF'
  },
  filaResumenFiltros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  botonRestablecerRango: {
    alignSelf: 'flex-start'
  },
  bloqueMes: {
    marginTop: 6
  },
  tituloMes: {
    marginBottom: 6,
    color: '#4A6078'
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
