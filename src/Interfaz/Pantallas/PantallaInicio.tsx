import React from 'react';
import { GestureResponderEvent, LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Snackbar, Surface, Text } from 'react-native-paper';
import { InputConCerrarTeclado } from '@/Interfaz/Componentes/InputConCerrarTeclado';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { TarjetaGrupo } from '@/Interfaz/Componentes/TarjetaGrupo';
import { TarjetaCuenta } from '@/Interfaz/Componentes/TarjetaCuenta';
import { CerrarFilaAbierta, FilaDeslizableAcciones } from '@/Interfaz/Componentes/FilaDeslizableAcciones';
import { CLAVE_CUENTAS_RAIZ, UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { CalcularTotalesGrupoRecursivo } from '@/Servicios/MotorBalances';
import { FormatearMoneda } from '@/Utilidades/Formatos';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TipoNodo = 'grupo' | 'cuenta';
type TipoCreacion = 'grupo' | 'cuenta';

interface NodoSeleccionado {
  id: string;
  nombre: string;
  tipo: TipoNodo;
}

interface CreacionPendiente {
  tipo: TipoCreacion;
}

interface NodoArrastrable {
  id: string;
  nombre: string;
  tipo: TipoNodo;
}

interface ZonaArrastre {
  y: number;
  alto: number;
  idGrupoPadre: string | null;
}

export const PantallaInicio = ({ navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaInicio'>): React.JSX.Element => {
  const {
    grupos,
    cuentasPorGrupo,
    moneda,
    InicializarDatos,
    ObtenerBalanceCuenta,
    EjecutarReglasPendientes,
    CrearGrupo,
    CrearCuenta,
    RenombrarGrupo,
    RenombrarCuenta,
    ReubicarGrupo,
    ReubicarCuenta,
    EliminarGrupo,
    EliminarCuenta,
    onboardingGestosCompletado,
    solicitudAyudaRapida,
    MarcarOnboardingGestosCompletado
  } = UsarAlmacenAplicacion();
  const insets = useSafeAreaInsets();
  const [expansionPorGrupo, setExpansionPorGrupo] = React.useState<Record<string, boolean>>({});
  const [nodoRenombrar, setNodoRenombrar] = React.useState<NodoSeleccionado | null>(null);
  const [nodoEliminar, setNodoEliminar] = React.useState<NodoSeleccionado | null>(null);
  const [creacionPendiente, setCreacionPendiente] = React.useState<CreacionPendiente | null>(null);
  const [nombreTemporal, setNombreTemporal] = React.useState('');
  const [montoInicialTemporal, setMontoInicialTemporal] = React.useState('0');
  const [mostrarAvisoGesto, setMostrarAvisoGesto] = React.useState(false);
  const [mostrarCoachMarks, setMostrarCoachMarks] = React.useState(false);
  const [avisoReubicacion, setAvisoReubicacion] = React.useState<string | null>(null);
  const [estadoSoltar, setEstadoSoltar] = React.useState<'valido' | 'invalido' | null>(null);
  const [nodoArrastrado, setNodoArrastrado] = React.useState<NodoArrastrable | null>(null);
  const [objetivoArrastre, setObjetivoArrastre] = React.useState<string | null>(null);
  const [zonaRaiz, setZonaRaiz] = React.useState<{ y: number; alto: number }>({ y: 0, alto: 0 });
  const [punteroArrastre, setPunteroArrastre] = React.useState<{ x: number; y: number } | null>(null);
  const zonasArrastre = React.useRef<Record<string, ZonaArrastre>>({});
  const scrollActualRef = React.useRef(0);
  const vistaRaizRef = React.useRef<View | null>(null);
  const scrollRef = React.useRef<ScrollView | null>(null);
  const offsetPantallaVistaRef = React.useRef({ x: 0, y: 0 });
  const offsetPantallaScrollRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    InicializarDatos();
    EjecutarReglasPendientes();
    requestAnimationFrame(medirOffsetsPantalla);
  }, [InicializarDatos, EjecutarReglasPendientes]);

  React.useEffect(() => {
    if (!onboardingGestosCompletado) {
      setMostrarCoachMarks(true);
    }
  }, [onboardingGestosCompletado, solicitudAyudaRapida]);


  const medirOffsetsPantalla = (): void => {
    vistaRaizRef.current?.measureInWindow((x, y) => {
      offsetPantallaVistaRef.current = { x, y };
    });

    scrollRef.current?.measureInWindow((x, y) => {
      offsetPantallaScrollRef.current = { x, y };
    });
  };
  const cuentas = React.useMemo(() => Object.values(cuentasPorGrupo).flat(), [cuentasPorGrupo]);
  const mapaBalances = React.useMemo(
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

  const abrirDialogoRenombrar = (nodo: NodoSeleccionado): void => {
    setNodoRenombrar(nodo);
    setNombreTemporal(nodo.nombre);
  };

  const confirmarRenombrado = (): void => {
    if (!nodoRenombrar) {
      return;
    }

    const nuevoNombre = nombreTemporal.trim();
    if (!nuevoNombre) {
      return;
    }

    if (nodoRenombrar.tipo === 'grupo') {
      RenombrarGrupo(nodoRenombrar.id, nuevoNombre);
    } else {
      RenombrarCuenta(nodoRenombrar.id, nuevoNombre);
    }

    setNodoRenombrar(null);
    setNombreTemporal('');
  };

  const confirmarEliminacion = (): void => {
    if (!nodoEliminar) {
      return;
    }

    if (nodoEliminar.tipo === 'grupo') {
      EliminarGrupo(nodoEliminar.id);
    } else {
      EliminarCuenta(nodoEliminar.id);
    }

    setNodoEliminar(null);
  };

  const abrirDialogoCreacion = (tipo: TipoCreacion): void => {
    setCreacionPendiente({ tipo });
    setNombreTemporal('');
    setMontoInicialTemporal('0');
  };

  const obtenerMontoInicial = (): number => {
    const monto = Number(montoInicialTemporal.replace(',', '.'));
    return Number.isFinite(monto) ? monto : 0;
  };

  const confirmarCreacion = (): void => {
    if (!creacionPendiente) {
      return;
    }

    const nombreCapturado = nombreTemporal.trim();

    if (creacionPendiente.tipo === 'cuenta') {
      const totalCuentasRaiz = cuentasPorGrupo[CLAVE_CUENTAS_RAIZ]?.length ?? 0;
      const nombreDefecto = `Cuenta ${totalCuentasRaiz + 1}`;
      CrearCuenta(nombreCapturado || nombreDefecto, null, obtenerMontoInicial());
    } else {
      const gruposRaiz = grupos.filter((grupo) => grupo.idGrupoPadre === null).length;
      const nombreDefecto = `Grupo ${gruposRaiz + 1}`;
      CrearGrupo(nombreCapturado || nombreDefecto, null);
    }

    setCreacionPendiente(null);
    setNombreTemporal('');
    setMontoInicialTemporal('0');
  };

  const registrarZonaArrastre = (clave: string, idGrupoPadre: string | null) => (evento: LayoutChangeEvent): void => {
    const { y, height } = evento.nativeEvent.layout;
    zonasArrastre.current[clave] = { y, alto: height, idGrupoPadre };
  };

  const iniciarArrastre = (nodo: NodoArrastrable): void => {
    CerrarFilaAbierta();
    medirOffsetsPantalla();
    setNodoArrastrado(nodo);
    setObjetivoArrastre(null);
    setPunteroArrastre(null);
    setEstadoSoltar(null);
    setAvisoReubicacion(`Arrastrando ${nodo.tipo} "${nodo.nombre}". Suelta sobre un grupo o sobre "Nivel raíz".`);
  };

  const cerrarCoachMarks = (): void => {
    setMostrarCoachMarks(false);
    MarcarOnboardingGestosCompletado(true);
  };

  const esDescendienteDeGrupo = (idGrupoObjetivo: string, idGrupoOrigen: string): boolean => {
    const cola = grupos.filter((grupo) => grupo.idGrupoPadre === idGrupoOrigen).map((grupo) => grupo.id);

    while (cola.length > 0) {
      const actual = cola.shift();
      if (!actual) {
        continue;
      }

      if (actual === idGrupoObjetivo) {
        return true;
      }

      grupos
        .filter((grupo) => grupo.idGrupoPadre === actual)
        .forEach((grupo) => cola.push(grupo.id));
    }

    return false;
  };

  const esObjetivoValido = (idGrupoDestino: string | null): boolean => {
    if (!nodoArrastrado) {
      return false;
    }

    if (nodoArrastrado.tipo === 'cuenta') {
      return true;
    }

    if (idGrupoDestino === null) {
      return true;
    }

    if (idGrupoDestino === nodoArrastrado.id) {
      return false;
    }

    return !esDescendienteDeGrupo(idGrupoDestino, nodoArrastrado.id);
  };

  const actualizarObjetivoArrastre = (evento: GestureResponderEvent): void => {
    if (!nodoArrastrado) {
      return;
    }

    const posicionPantallaY = evento.nativeEvent.pageY;
    const posicionPantallaX = evento.nativeEvent.pageX;
    const posicionContenidoY = posicionPantallaY - offsetPantallaScrollRef.current.y + scrollActualRef.current;

    setPunteroArrastre({
      x: posicionPantallaX - offsetPantallaVistaRef.current.x,
      y: posicionPantallaY - offsetPantallaVistaRef.current.y
    });

    const posicionesPosibles = [posicionContenidoY];

    const zonaDetectada = Object.entries(zonasArrastre.current).find(([, zona]) =>
      posicionesPosibles.some((posicionY) => posicionY >= zona.y && posicionY <= zona.y + zona.alto)
    );

    if (zonaDetectada && esObjetivoValido(zonaDetectada[1].idGrupoPadre)) {
      setObjetivoArrastre(zonaDetectada[1].idGrupoPadre ?? '__ROOT__');
      return;
    }

    const dentroRaiz = posicionesPosibles.some((posicionY) => posicionY >= zonaRaiz.y && posicionY <= zonaRaiz.y + zonaRaiz.alto);
    setObjetivoArrastre(dentroRaiz && esObjetivoValido(null) ? '__ROOT__' : null);
  };

  const confirmarArrastre = (): void => {
    if (!nodoArrastrado || !objetivoArrastre) {
      if (nodoArrastrado) {
        setEstadoSoltar('invalido');
        setAvisoReubicacion('Destino inválido. Inténtalo sobre un grupo o en nivel raíz.');
      }
      setNodoArrastrado(null);
      setObjetivoArrastre(null);
      setPunteroArrastre(null);
      setTimeout(() => setEstadoSoltar(null), 700);
      return;
    }

    const idGrupoDestino = objetivoArrastre === '__ROOT__' ? null : objetivoArrastre;

    if (nodoArrastrado.tipo === 'cuenta') {
      ReubicarCuenta(nodoArrastrado.id, idGrupoDestino);
      setAvisoReubicacion(`Cuenta "${nodoArrastrado.nombre}" reubicada.`);
      setEstadoSoltar('valido');
    } else {
      const reubicado = ReubicarGrupo(nodoArrastrado.id, idGrupoDestino);
      setAvisoReubicacion(reubicado ? `Grupo "${nodoArrastrado.nombre}" reubicado.` : 'No se puede mover un grupo dentro de sí mismo o sus descendientes.');
      setEstadoSoltar(reubicado ? 'valido' : 'invalido');
    }

    setNodoArrastrado(null);
    setObjetivoArrastre(null);
    setPunteroArrastre(null);
    setTimeout(() => setEstadoSoltar(null), 700);
  };

  const RenderizarGrupoConContenido = (idGrupo: string, nivel = 0): React.JSX.Element[] => {
    const grupo = grupos.find((item) => item.id === idGrupo);

    if (!grupo) {
      return [];
    }

    const cuentasGrupo = cuentasPorGrupo[idGrupo] ?? [];
    const subgrupos = grupos.filter((item) => item.idGrupoPadre === idGrupo);
    const expandido = expansionPorGrupo[idGrupo] ?? true;
    const grupoEsObjetivo = objetivoArrastre === grupo.id;

    const contenidoExpandido = expandido
      ? [
          ...cuentasGrupo.map((cuenta) => (
            <View key={`cuenta-${cuenta.id}`} style={[styles.itemContenedor, { marginLeft: (nivel + 1) * 10 }]}> 
              <FilaDeslizableAcciones
                id={cuenta.id}
                onEditar={() => abrirDialogoRenombrar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
                onEliminar={() => setNodoEliminar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
                onDeslizamientoInsuficiente={() => setMostrarAvisoGesto(true)}
              >
                <TarjetaCuenta
                  estilo={nodoArrastrado?.id === cuenta.id && nodoArrastrado.tipo === 'cuenta' ? styles.itemArrastrandose : undefined}
                  nombre={cuenta.nombre}
                  balance={ObtenerBalanceCuenta(cuenta.id)}
                  moneda={moneda}
                  AlSostener={() => iniciarArrastre({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
                  AlPresionar={() => navigation.navigate('PantallaDetalleCuenta', { idCuenta: cuenta.id, nombreCuenta: cuenta.nombre })}
                />
              </FilaDeslizableAcciones>
            </View>
          )),
          ...subgrupos.flatMap((subgrupo) => RenderizarGrupoConContenido(subgrupo.id, nivel + 1))
        ]
      : [];

    return [
      <View
        key={`grupo-${grupo.id}`}
        style={[styles.itemContenedor, { marginLeft: nivel * 10 }]}
        onLayout={registrarZonaArrastre(`grupo-${grupo.id}`, grupo.id)}
      >
        <FilaDeslizableAcciones
          id={grupo.id}
          onEditar={() => abrirDialogoRenombrar({ id: grupo.id, nombre: grupo.nombre, tipo: 'grupo' })}
          onEliminar={() => setNodoEliminar({ id: grupo.id, nombre: grupo.nombre, tipo: 'grupo' })}
          onDeslizamientoInsuficiente={() => setMostrarAvisoGesto(true)}
        >
          <TarjetaGrupo
            estilo={[grupoEsObjetivo ? styles.destinoActivo : undefined, nodoArrastrado?.id === grupo.id && nodoArrastrado.tipo === 'grupo' ? styles.itemArrastrandose : undefined]}
            nombre={grupo.nombre}
            total={CalcularTotalesGrupoRecursivo(grupo.id, grupos, cuentas, mapaBalances)}
            moneda={moneda}
            expandido={expandido}
            AlSostener={() => iniciarArrastre({ id: grupo.id, nombre: grupo.nombre, tipo: 'grupo' })}
            AlAlternarExpansion={() => alternarExpansion(grupo.id)}
            AlPresionar={() => navigation.navigate('PantallaDetalleGrupo', { idGrupo: grupo.id, nombreGrupo: grupo.nombre })}
          />
        </FilaDeslizableAcciones>
      </View>,
      ...contenidoExpandido
    ];
  };

  const cuentasRaiz = cuentasPorGrupo[CLAVE_CUENTAS_RAIZ] ?? [];

  return (
    <View ref={vistaRaizRef} style={[styles.contenedor, estadoSoltar === 'valido' ? styles.fondoSoltarValido : undefined, estadoSoltar === 'invalido' ? styles.fondoSoltarInvalido : undefined]} onLayout={medirOffsetsPantalla}>
      <Surface style={styles.tarjetaTotal} elevation={1}>
        <Text variant="labelLarge" style={styles.textoSecundario}>Total general</Text>
        <Text variant="headlineSmall" style={totalGeneral >= 0 ? styles.montoPositivo : styles.montoNegativo}>{FormatearMoneda(totalGeneral, moneda)}</Text>
      </Surface>

      <ScrollView
        ref={scrollRef}
        onLayout={medirOffsetsPantalla}
        contentContainerStyle={[styles.listaContenedora, { paddingBottom: 100 + insets.bottom }]}
        scrollEnabled={!nodoArrastrado}
        onStartShouldSetResponder={() => {
          CerrarFilaAbierta();
          return false;
        }}
        onMoveShouldSetResponderCapture={() => Boolean(nodoArrastrado)}
        onScroll={(evento) => {
          scrollActualRef.current = evento.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        onTouchMove={actualizarObjetivoArrastre}
        onTouchEnd={confirmarArrastre}
      >
          {nodoArrastrado?.tipo ? (

            <Surface style={[styles.zonaRaiz, objetivoArrastre === '__ROOT__' ? styles.destinoActivo : undefined]} elevation={0} onLayout={(evento) => {
              const { y, height } = evento.nativeEvent.layout;
              setZonaRaiz({ y, alto: height });
            }}>
                <Text variant="labelLarge">Nivel raíz (suelta aquí para sacar fuera del grupo)</Text>
            
            </Surface>
          ) : null}
        {cuentasRaiz.map((cuenta) => (
          <View key={`cuenta-raiz-${cuenta.id}`} style={styles.itemContenedor}>
            <FilaDeslizableAcciones
              id={cuenta.id}
              onEditar={() => abrirDialogoRenombrar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
              onEliminar={() => setNodoEliminar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
              onDeslizamientoInsuficiente={() => setMostrarAvisoGesto(true)}
            >
              <TarjetaCuenta
                estilo={nodoArrastrado?.id === cuenta.id && nodoArrastrado.tipo === 'cuenta' ? styles.itemArrastrandose : undefined}
                nombre={cuenta.nombre}
                balance={ObtenerBalanceCuenta(cuenta.id)}
                moneda={moneda}
                AlSostener={() => iniciarArrastre({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
                AlPresionar={() => navigation.navigate('PantallaDetalleCuenta', { idCuenta: cuenta.id, nombreCuenta: cuenta.nombre })}
              />
            </FilaDeslizableAcciones>
          </View>
        ))}
        {grupos.filter((grupo) => grupo.idGrupoPadre === null).flatMap((grupo) => RenderizarGrupoConContenido(grupo.id))}
      </ScrollView>

      {nodoArrastrado && punteroArrastre ? (
        <Surface pointerEvents="none" style={[styles.indicadorArrastre, { left: punteroArrastre.x - 70, top: punteroArrastre.y - 56 }]} elevation={2}>
          <Text variant="labelMedium">Moviendo: {nodoArrastrado.nombre}</Text>
        </Surface>
      ) : null}

      <View style={[styles.accionesInferiores, { bottom: 12 + insets.bottom }]}>
        <Button mode="contained" style={styles.botonAccion} onPress={() => abrirDialogoCreacion('cuenta')}>
          Nueva cuenta
        </Button>
        <Button mode="outlined" style={styles.botonAccion} onPress={() => abrirDialogoCreacion('grupo')}>
          Nuevo grupo
        </Button>
      </View>

      <Portal>
        <Dialog visible={Boolean(creacionPendiente)} onDismiss={() => setCreacionPendiente(null)}>
          <Dialog.Title>{creacionPendiente?.tipo === 'cuenta' ? 'Nueva cuenta' : 'Nuevo grupo'}</Dialog.Title>
          <Dialog.Content>
            <InputConCerrarTeclado value={nombreTemporal} onChangeText={setNombreTemporal} mode="outlined" label="Nombre (opcional)" autoFocus />
            {creacionPendiente?.tipo === 'cuenta' ? (
              <InputConCerrarTeclado
                value={montoInicialTemporal}
                onChangeText={setMontoInicialTemporal}
                mode="outlined"
                keyboardType="decimal-pad"
                label="Monto inicial"
                style={styles.campoMontoInicial}
              />
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreacionPendiente(null)}>Cancelar</Button>
            <Button onPress={confirmarCreacion}>Crear</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={Boolean(nodoRenombrar)} onDismiss={() => setNodoRenombrar(null)}>
          <Dialog.Title>Renombrar {nodoRenombrar?.tipo}</Dialog.Title>
          <Dialog.Content>
            <InputConCerrarTeclado value={nombreTemporal} onChangeText={setNombreTemporal} mode="outlined" label="Nombre" autoFocus />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNodoRenombrar(null)}>Cancelar</Button>
            <Button onPress={confirmarRenombrado}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={Boolean(nodoEliminar)} onDismiss={() => setNodoEliminar(null)}>
          <Dialog.Title>Confirmar eliminación</Dialog.Title>
          <Dialog.Content>
            <Text>¿Seguro que deseas eliminar {nodoEliminar?.tipo} "{nodoEliminar?.nombre}"?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNodoEliminar(null)}>Cancelar</Button>
            <Button onPress={confirmarEliminacion}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={mostrarCoachMarks} onDismiss={cerrarCoachMarks}>
          <Dialog.Title>Guía rápida</Dialog.Title>
          <Dialog.Content>
            <Text>• Desliza una fila para editar o eliminar.</Text>
            <Text>• Mantén presionado un grupo o cuenta para arrastrarlo.</Text>
            <Text>• Suelta sobre un grupo o en "Nivel raíz" para reubicar.</Text>
            <Text style={styles.textoAyudaSecundario}>Puedes volver a abrir esta ayuda desde el menú superior.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cerrarCoachMarks}>Entendido</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={mostrarAvisoGesto} onDismiss={() => setMostrarAvisoGesto(false)} duration={1800}>
        Completa el gesto para activar la acción
      </Snackbar>
      <Snackbar visible={Boolean(avisoReubicacion)} onDismiss={() => setAvisoReubicacion(null)} duration={2200}>
        {avisoReubicacion}
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
  campoMontoInicial: {
    marginTop: 10
  },
  zonaRaiz: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B8C5D5',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FBFF'
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
  listaContenedora: {},
  itemContenedor: {
    marginBottom: 6
  },
  destinoActivo: {
    borderWidth: 2,
    borderColor: '#4A7DB8'
  },
  itemArrastrandose: {
    opacity: 0.55
  },
  indicadorArrastre: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFFEE'
  },
  fondoSoltarValido: {
    borderWidth: 2,
    borderColor: '#2D9A5C'
  },
  fondoSoltarInvalido: {
    borderWidth: 2,
    borderColor: '#D14141'
  },
  textoAyudaSecundario: {
    marginTop: 10,
    opacity: 0.7
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
