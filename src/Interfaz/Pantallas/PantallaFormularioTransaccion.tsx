import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button, Chip, HelperText, Modal, Portal, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatISO } from 'date-fns';
import { EsquemaTransaccionFormulario } from '@/Dominio/Esquemas';
import { TipoTransaccion, Transaccion } from '@/Dominio/Modelos';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

type ValoresFormulario = {
  tipo: TipoTransaccion;
  monto?: number;
  idCuentaOrigen?: string;
  idCuentaDestino?: string;
  idCategoria?: string;
  nota?: string;
  fecha: string;
};

export const PantallaFormularioTransaccion = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaFormularioTransaccion'>): React.JSX.Element => {
  const idCuentaPredeterminada = route.params?.idCuentaPredeterminada;
  const { categorias, cuentasPorGrupo, RegistrarTransaccion, ActualizarTransaccion } = UsarAlmacenAplicacion();
  const cuentas = React.useMemo(() => Object.values(cuentasPorGrupo).flat(), [cuentasPorGrupo]);

  const transaccionEditar = (route.params as { transaccion?: Transaccion } | undefined)?.transaccion;
  const [selectorAbierto, setSelectorAbierto] = React.useState<'idCuentaOrigen' | 'idCuentaDestino' | null>(null);
  const [busquedaCuenta, setBusquedaCuenta] = React.useState('');
  const cuentasFiltradas = React.useMemo(
    () => cuentas.filter((cuenta) => cuenta.nombre.toLowerCase().includes(busquedaCuenta.toLowerCase())),
    [busquedaCuenta, cuentas]
  );

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ValoresFormulario>({
    resolver: zodResolver(EsquemaTransaccionFormulario),
    defaultValues: transaccionEditar
      ? {
          tipo: transaccionEditar.tipo === TipoTransaccion.AJUSTE ? TipoTransaccion.GASTO : transaccionEditar.tipo,
          monto: transaccionEditar.monto,
          idCuentaOrigen: transaccionEditar.idCuentaOrigen,
          idCuentaDestino: transaccionEditar.idCuentaDestino,
          idCategoria: transaccionEditar.idCategoria,
          nota: transaccionEditar.nota,
          fecha: transaccionEditar.fecha
        }
      : {
          tipo: TipoTransaccion.GASTO,
          monto: undefined,
          idCuentaOrigen: idCuentaPredeterminada,
          fecha: formatISO(new Date())
        }
  });

  const tipoSeleccionado = useWatch({ control, name: 'tipo' });
  const cuentaOrigenSeleccionada = useWatch({ control, name: 'idCuentaOrigen' });
  const cuentaDestinoSeleccionada = useWatch({ control, name: 'idCuentaDestino' });
  const montoCapturado = useWatch({ control, name: 'monto' });
  const cuentaOrigen = React.useMemo(() => cuentas.find((cuenta) => cuenta.id === cuentaOrigenSeleccionada), [cuentas, cuentaOrigenSeleccionada]);
  const cuentaDestino = React.useMemo(() => cuentas.find((cuenta) => cuenta.id === cuentaDestinoSeleccionada), [cuentas, cuentaDestinoSeleccionada]);

  React.useEffect(() => {
    if (!tipoSeleccionado) {
      return;
    }

    if ((tipoSeleccionado === TipoTransaccion.GASTO || tipoSeleccionado === TipoTransaccion.INGRESO) && !cuentaOrigenSeleccionada) {
      setValue('idCuentaOrigen', idCuentaPredeterminada ?? cuentas[0]?.id, { shouldValidate: true });
    }

    if (tipoSeleccionado === TipoTransaccion.TRANSFERENCIA) {
      const origenSugerido = cuentaOrigenSeleccionada ?? idCuentaPredeterminada ?? cuentas[0]?.id;
      if (cuentaOrigenSeleccionada !== origenSugerido) {
        setValue('idCuentaOrigen', origenSugerido, { shouldValidate: true });
      }

      if (!cuentaDestinoSeleccionada || cuentaDestinoSeleccionada === origenSugerido) {
        const destinoSugerido = cuentas.find((cuenta) => cuenta.id !== origenSugerido)?.id;
        if (cuentaDestinoSeleccionada !== destinoSugerido) {
          setValue('idCuentaDestino', destinoSugerido, { shouldValidate: true });
        }
      }
      return;
    }

    if (tipoSeleccionado !== TipoTransaccion.TRANSFERENCIA) {
      setValue('idCuentaDestino', undefined, { shouldValidate: false });
    }

    if (tipoSeleccionado === TipoTransaccion.TRANSFERENCIA) {
      setValue('idCategoria', undefined, { shouldValidate: false });
    }
  }, [tipoSeleccionado, cuentaOrigenSeleccionada, cuentaDestinoSeleccionada, setValue, cuentas, idCuentaPredeterminada]);

  const AlEnviar = (valores: ValoresFormulario): void => {
    const carga = { ...valores, monto: Number(valores.monto) };

    if (transaccionEditar) {
      ActualizarTransaccion({ ...transaccionEditar, ...carga });
    } else {
      RegistrarTransaccion(carga);
    }

    navigation.goBack();
  };

  const requiereCategoria = tipoSeleccionado === TipoTransaccion.GASTO || tipoSeleccionado === TipoTransaccion.INGRESO;
  const requiereCuentaOrigen = tipoSeleccionado === TipoTransaccion.GASTO || tipoSeleccionado === TipoTransaccion.INGRESO || tipoSeleccionado === TipoTransaccion.TRANSFERENCIA;
  const requiereCuentaDestino = tipoSeleccionado === TipoTransaccion.TRANSFERENCIA;
  const montoMostrado = montoCapturado ?? 0;
  const montoConSigno = tipoSeleccionado === TipoTransaccion.GASTO ? -Math.abs(montoMostrado) : Math.abs(montoMostrado);

  const colorMonto = montoConSigno === 0
    ? styles.montoNeutro
    : montoConSigno > 0
      ? styles.montoPositivo
      : styles.montoNegativo;

  const abrirSelectorCuentas = (campo: 'idCuentaOrigen' | 'idCuentaDestino'): void => {
    setBusquedaCuenta('');
    setSelectorAbierto(campo);
  };

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text variant="titleMedium">{transaccionEditar ? 'Editar transacción' : 'Nueva transacción'}</Text>

      <View style={styles.resumenMonto}>
        <Text variant="labelLarge">Monto</Text>
        <Controller
          control={control}
          name="monto"
          render={({ field: { value, onChange } }) => (
            <TextInput
              mode="flat"
              dense
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              keyboardType="decimal-pad"
              value={value === undefined ? '0' : String(value)}
              onChangeText={(texto) => onChange(texto === '' ? undefined : Number(texto.replace(',', '.')))}
              style={[styles.inputMontoSuperior, colorMonto]}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="tipo"
        render={({ field: { value, onChange } }) => (
          <SegmentedButtons
            value={value}
            onValueChange={(nuevo) => onChange(nuevo as TipoTransaccion)}
            buttons={[
              { value: TipoTransaccion.GASTO, label: 'Gasto' },
              { value: TipoTransaccion.INGRESO, label: 'Ingreso' },
              { value: TipoTransaccion.TRANSFERENCIA, label: 'Transferencia' }
            ]}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.monto}>{errors.monto?.message}</HelperText>

      {requiereCuentaOrigen ? (
        <View style={styles.bloqueCampo}>
          <Text variant="labelLarge">Cuenta origen</Text>
          <Pressable style={styles.tarjetaCuenta} onPress={() => abrirSelectorCuentas('idCuentaOrigen')}>
            <Text variant="titleMedium">{cuentaOrigen?.nombre ?? 'Seleccionar cuenta'}</Text>
            <Text variant="bodySmall">Toca para cambiar</Text>
          </Pressable>
        </View>
      ) : null}

      {tipoSeleccionado === TipoTransaccion.TRANSFERENCIA ? (
        <View style={styles.tarjetaTransferencia}>
          <Text variant="titleSmall">{cuentaOrigen?.nombre ?? 'Origen'}</Text>
          <Text variant="headlineSmall">→</Text>
          <Text variant="titleSmall">{cuentaDestino?.nombre ?? 'Destino'}</Text>
        </View>
      ) : null}

      {requiereCuentaDestino ? (
        <View style={styles.bloqueCampo}>
          <Text variant="labelLarge">Cuenta destino</Text>
          <Pressable style={styles.tarjetaCuenta} onPress={() => abrirSelectorCuentas('idCuentaDestino')}>
            <Text variant="titleMedium">{cuentaDestino?.nombre ?? 'Seleccionar cuenta'}</Text>
            <Text variant="bodySmall">Toca para cambiar</Text>
          </Pressable>
        </View>
      ) : null}

      {requiereCategoria ? (
        categorias.length > 0 ? (
          <View style={styles.bloqueCampo}>
            <Text variant="labelLarge">Categoría</Text>
            <Controller
              control={control}
              name="idCategoria"
              render={({ field: { value, onChange } }) => (
                <View style={styles.grupoChips}>
                  {categorias.map((categoria) => (
                    <Chip key={categoria.id} selected={value === categoria.id} compact style={styles.chipEtiquetas} onPress={() => onChange(categoria.id)}>{categoria.nombre}</Chip>
                  ))}
                </View>
              )}
            />
          </View>
        ) : <HelperText type="info">No hay categorías. Crea una en Configuración.</HelperText>
      ) : null}

      <Controller
        control={control}
        name="nota"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="Nota (opcional)"
            mode="outlined"
            placeholder="Descripción breve"
            value={value}
            style={styles.inputMejorado}
            onChangeText={onChange}
          />
        )}
      />

      <Button mode="contained" onPress={handleSubmit(AlEnviar)}>Guardar</Button>
      <HelperText type="error" visible={!!errors.root}>{errors.root?.message}</HelperText>

      <Portal>
        <Modal visible={selectorAbierto !== null} onDismiss={() => setSelectorAbierto(null)} contentContainerStyle={styles.modalCuentas}>
          <Text variant="titleMedium">Seleccionar cuenta</Text>
          <TextInput
            mode="outlined"
            label="Buscar cuenta"
            value={busquedaCuenta}
            onChangeText={setBusquedaCuenta}
            style={styles.inputMejorado}
          />
          <ScrollView style={styles.listaCuentasModal}>
            {cuentasFiltradas.map((cuenta) => (
              <Pressable
                key={`modal-${cuenta.id}`}
                style={styles.itemCuentaModal}
                onPress={() => {
                  if (selectorAbierto) {
                    setValue(selectorAbierto, cuenta.id, { shouldValidate: true });
                  }
                  setSelectorAbierto(null);
                }}
              >
                <Text variant="bodyLarge">{cuenta.nombre}</Text>
              </Pressable>
            ))}
            {cuentasFiltradas.length === 0 ? <HelperText type="info">No hay cuentas con ese nombre</HelperText> : null}
          </ScrollView>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    padding: 16,
    gap: 10,
    paddingBottom: 32
  },
  resumenMonto: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F4F5F7',
    gap: 4,
    alignItems: 'center'
  },
  inputMontoSuperior: {
    fontSize: 42,
    fontWeight: '700',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#F4F5F7'
  },
  bloqueCampo: {
    gap: 4
  },
  montoPositivo: {
    color: '#1F8F4C'
  },
  montoNegativo: {
    color: '#C4362D'
  },
  montoNeutro: {
    color: '#7A7A7A'
  },
  inputMejorado: {
    backgroundColor: '#FFFFFF'
  },
  tarjetaCuenta: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#EEF3FF',
    borderWidth: 1,
    borderColor: '#CDD9FF',
    gap: 2
  },
  tarjetaTransferencia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F4F5F7'
  },
  grupoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chipEtiquetas: {
    borderRadius: 18
  },
  modalCuentas: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    gap: 10,
    maxHeight: '75%'
  },
  listaCuentasModal: {
    maxHeight: 260
  },
  itemCuentaModal: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC'
  }
});
