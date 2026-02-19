import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Snackbar, Surface, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { TarjetaGrupo } from '@/Interfaz/Componentes/TarjetaGrupo';
import { TarjetaCuenta } from '@/Interfaz/Componentes/TarjetaCuenta';
import { FilaDeslizableAcciones } from '@/Interfaz/Componentes/FilaDeslizableAcciones';
import { CerrarFilaAbierta } from '@/Interfaz/Componentes/FilaDeslizableAcciones';
import { CLAVE_CUENTAS_RAIZ, UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { CalcularTotalesGrupoRecursivo } from '@/Servicios/MotorBalances';
import { FormatearMoneda } from '@/Utilidades/Formatos';

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
    EliminarGrupo,
    EliminarCuenta
  } = UsarAlmacenAplicacion();
  const [expansionPorGrupo, setExpansionPorGrupo] = React.useState<Record<string, boolean>>({});
  const [nodoRenombrar, setNodoRenombrar] = React.useState<NodoSeleccionado | null>(null);
  const [nodoEliminar, setNodoEliminar] = React.useState<NodoSeleccionado | null>(null);
  const [creacionPendiente, setCreacionPendiente] = React.useState<CreacionPendiente | null>(null);
  const [nombreTemporal, setNombreTemporal] = React.useState('');
  const [mostrarAvisoGesto, setMostrarAvisoGesto] = React.useState(false);

  React.useEffect(() => {
    InicializarDatos();
    EjecutarReglasPendientes();
  }, [InicializarDatos, EjecutarReglasPendientes]);

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
  };

  const confirmarCreacion = (): void => {
    if (!creacionPendiente) {
      return;
    }

    const nombreCapturado = nombreTemporal.trim();

    if (creacionPendiente.tipo === 'cuenta') {
      const totalCuentasRaiz = cuentasPorGrupo[CLAVE_CUENTAS_RAIZ]?.length ?? 0;
      const nombreDefecto = `Cuenta ${totalCuentasRaiz + 1}`;
      CrearCuenta(nombreCapturado || nombreDefecto, null);
    } else {
      const gruposRaiz = grupos.filter((grupo) => grupo.idGrupoPadre === null).length;
      const nombreDefecto = `Grupo ${gruposRaiz + 1}`;
      CrearGrupo(nombreCapturado || nombreDefecto, null);
    }

    setCreacionPendiente(null);
    setNombreTemporal('');
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
                <FilaDeslizableAcciones
                  id={cuenta.id}
                  onEditar={() => abrirDialogoRenombrar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
                  onEliminar={() => setNodoEliminar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
                  onDeslizamientoInsuficiente={() => setMostrarAvisoGesto(true)}
                >
                <TarjetaCuenta
                  nombre={cuenta.nombre}
                  balance={ObtenerBalanceCuenta(cuenta.id)}
                  moneda={moneda}
                  AlPresionar={() => navigation.navigate('PantallaDetalleCuenta', { idCuenta: cuenta.id, nombreCuenta: cuenta.nombre })}
                />
              </FilaDeslizableAcciones>
            </View>
          )),
          ...subgrupos.flatMap((subgrupo) => RenderizarGrupoConContenido(subgrupo.id, nivel + 1))
        ]
      : [];

    return [
      <View key={`grupo-${grupo.id}`} style={[styles.itemContenedor, { marginLeft: nivel * 10 }]}> 
        <FilaDeslizableAcciones
          id={grupo.id}
          onEditar={() => abrirDialogoRenombrar({ id: grupo.id, nombre: grupo.nombre, tipo: 'grupo' })}
          onEliminar={() => setNodoEliminar({ id: grupo.id, nombre: grupo.nombre, tipo: 'grupo' })}
          onDeslizamientoInsuficiente={() => setMostrarAvisoGesto(true)}
        >
          <TarjetaGrupo
            nombre={grupo.nombre}
            total={CalcularTotalesGrupoRecursivo(grupo.id, grupos, cuentas, mapaBalances)}
            moneda={moneda}
            expandido={expandido}
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
    <View style={styles.contenedor}>
      <Surface style={styles.tarjetaTotal} elevation={1}>
        <Text variant="labelLarge" style={styles.textoSecundario}>Total general</Text>
        <Text variant="headlineSmall" style={totalGeneral >= 0 ? styles.montoPositivo : styles.montoNegativo}>{FormatearMoneda(totalGeneral, moneda)}</Text>
      </Surface>

      <ScrollView contentContainerStyle={styles.listaContenedora} onStartShouldSetResponder={() => { CerrarFilaAbierta(); return false; }}>
        {cuentasRaiz.map((cuenta) => (
          <View key={`cuenta-raiz-${cuenta.id}`} style={styles.itemContenedor}>
            <FilaDeslizableAcciones
              onEditar={() => abrirDialogoRenombrar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
              onEliminar={() => setNodoEliminar({ id: cuenta.id, nombre: cuenta.nombre, tipo: 'cuenta' })}
              onDeslizamientoInsuficiente={() => setMostrarAvisoGesto(true)}
            >
              <TarjetaCuenta
                nombre={cuenta.nombre}
                balance={ObtenerBalanceCuenta(cuenta.id)}
                moneda={moneda}
                AlPresionar={() => navigation.navigate('PantallaDetalleCuenta', { idCuenta: cuenta.id, nombreCuenta: cuenta.nombre })}
              />
            </FilaDeslizableAcciones>
          </View>
        ))}
        {grupos.filter((grupo) => grupo.idGrupoPadre === null).flatMap((grupo) => RenderizarGrupoConContenido(grupo.id))}
      </ScrollView>

      <View style={styles.accionesInferiores}>
        <Button mode="contained" onPress={() => abrirDialogoCreacion('cuenta')}>
          Nueva cuenta
        </Button>
        <Button mode="outlined" onPress={() => abrirDialogoCreacion('grupo')}>
          Nuevo grupo
        </Button>
      </View>

      <Portal>
        <Dialog visible={Boolean(creacionPendiente)} onDismiss={() => setCreacionPendiente(null)}>
          <Dialog.Title>{creacionPendiente?.tipo === 'cuenta' ? 'Nueva cuenta' : 'Nuevo grupo'}</Dialog.Title>
          <Dialog.Content>
            <TextInput value={nombreTemporal} onChangeText={setNombreTemporal} mode="outlined" label="Nombre (opcional)" autoFocus />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreacionPendiente(null)}>Cancelar</Button>
            <Button onPress={confirmarCreacion}>Crear</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={Boolean(nodoRenombrar)} onDismiss={() => setNodoRenombrar(null)}>
          <Dialog.Title>Renombrar {nodoRenombrar?.tipo}</Dialog.Title>
          <Dialog.Content>
            <TextInput value={nombreTemporal} onChangeText={setNombreTemporal} mode="outlined" label="Nombre" autoFocus />
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
  accionesInferiores: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 8
  }
});
