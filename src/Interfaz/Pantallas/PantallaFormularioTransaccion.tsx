import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button, Chip, HelperText, Modal, Portal, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatISO } from 'date-fns';
import { EsquemaTransaccionFormulario } from '@/Dominio/Esquemas';
import { TipoTransaccion, Transaccion } from '@/Dominio/Modelos';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { categorias, cuentasPorGrupo, moneda, RegistrarTransaccion, ActualizarTransaccion } = UsarAlmacenAplicacion();
  const insets = useSafeAreaInsets();
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
  const cuentasDisponiblesSelector = React.useMemo(() => {
    if (tipoSeleccionado !== TipoTransaccion.TRANSFERENCIA || !selectorAbierto) {
      return cuentasFiltradas;
    }

    if (selectorAbierto === 'idCuentaOrigen') {
      return cuentasFiltradas.filter((cuenta) => cuenta.id !== cuentaDestinoSeleccionada);
    }

    return cuentasFiltradas.filter((cuenta) => cuenta.id !== cuentaOrigenSeleccionada);
  }, [tipoSeleccionado, selectorAbierto, cuentasFiltradas, cuentaDestinoSeleccionada, cuentaOrigenSeleccionada]);
  const cuentaOrigen = React.useMemo(() => cuentas.find((cuenta) => cuenta.id === cuentaOrigenSeleccionada), [cuentas, cuentaOrigenSeleccionada]);
  const cuentaDestino = React.useMemo(() => cuentas.find((cuenta) => cuenta.id === cuentaDestinoSeleccionada), [cuentas, cuentaDestinoSeleccionada]);
  const cuentasDisponiblesOrigenTransferencia = React.useMemo(
    () => cuentas.filter((cuenta) => cuenta.id !== cuentaDestinoSeleccionada),
    [cuentas, cuentaDestinoSeleccionada]
  );
  const cuentasDisponiblesDestinoTransferencia = React.useMemo(
    () => cuentas.filter((cuenta) => cuenta.id !== cuentaOrigenSeleccionada),
    [cuentas, cuentaOrigenSeleccionada]
  );
  const transferenciaSinCuentasSuficientes = tipoSeleccionado === TipoTransaccion.TRANSFERENCIA
    && cuentasDisponiblesOrigenTransferencia.length === 0
    && cuentasDisponiblesDestinoTransferencia.length === 0;

  React.useEffect(() => {
    if (!tipoSeleccionado) {
      return;
    }

    if (tipoSeleccionado === TipoTransaccion.GASTO || tipoSeleccionado === TipoTransaccion.INGRESO) {
      if (!cuentaOrigenSeleccionada) {
        setValue('idCuentaOrigen', idCuentaPredeterminada ?? cuentas[0]?.id, { shouldValidate: true });
      }
      setValue('idCuentaDestino', undefined, { shouldValidate: false });
      return;
    }

    if (tipoSeleccionado === TipoTransaccion.TRANSFERENCIA) {
      const origenSugerido = cuentaOrigenSeleccionada ?? idCuentaPredeterminada ?? cuentas[0]?.id;
      if (cuentaOrigenSeleccionada !== origenSugerido) {
        setValue('idCuentaOrigen', origenSugerido, { shouldValidate: true });
      }

      if (!cuentaDestinoSeleccionada || cuentaDestinoSeleccionada === origenSugerido) {
        const destinoAlterno = cuentas.find((cuenta) => cuenta.id !== origenSugerido)?.id;
        if (cuentaDestinoSeleccionada !== destinoAlterno) {
          setValue('idCuentaDestino', destinoAlterno, { shouldValidate: true });
        }
      }

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
  const colorMonto = tipoSeleccionado === TipoTransaccion.GASTO
    ? styles.montoNegativo
    : tipoSeleccionado === TipoTransaccion.INGRESO
      ? styles.montoPositivo
      : styles.montoNeutro;
  const colorMontoTexto = tipoSeleccionado === TipoTransaccion.GASTO
    ? '#C4362D'
    : tipoSeleccionado === TipoTransaccion.INGRESO
      ? '#1F8F4C'
      : '#7A7A7A';
  const simboloMoneda = React.useMemo(() => {
    try {
      if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
        const nf = new Intl.NumberFormat('es', { style: 'currency', currency: moneda });
        if (typeof (nf as any).formatToParts === 'function') {
          const partes = (nf as any).formatToParts(0);
          return partes.find((parte: any) => parte.type === 'currency')?.value ?? moneda;
        }
      }
    } catch (e) {
      // fall through to fallback
    }

    const symbols: Record<string, string> = { MXN: '$', USD: '$', EUR: '€' };
    return symbols[moneda] ?? moneda;
  }, [moneda]);

  const abrirSelectorCuentas = (campo: 'idCuentaOrigen' | 'idCuentaDestino'): void => {
    setBusquedaCuenta('');
    setSelectorAbierto(campo);
  };

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={88}
    >
      <ScrollView contentContainerStyle={[styles.contenedor, { paddingBottom: 24 + insets.bottom }]} keyboardShouldPersistTaps="handled">

      <View style={styles.resumenMonto}>
        <Text variant="labelLarge">Monto ({simboloMoneda})</Text>
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
              value={value === undefined ? '' : String(value)}
              onChangeText={(texto) => onChange(texto === '' ? undefined : Number(texto.replace(',', '.')))}
              textColor={colorMontoTexto}
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

      {requiereCuentaOrigen && tipoSeleccionado !== TipoTransaccion.TRANSFERENCIA ? (
        <View style={styles.bloqueCampo}>
          <Text variant="labelLarge">Cuenta origen</Text>
          <Pressable style={styles.tarjetaCuenta} onPress={() => abrirSelectorCuentas('idCuentaOrigen')}>
            <Text variant="titleMedium">{cuentaOrigen?.nombre ?? 'Seleccionar cuenta'}</Text>
            <Text variant="bodySmall">Toca para cambiar</Text>
          </Pressable>
        </View>
      ) : null}
      <HelperText type="error" visible={!!errors.idCategoria}>{errors.idCategoria?.message}</HelperText>

      {tipoSeleccionado === TipoTransaccion.TRANSFERENCIA ? (
        <View style={styles.tarjetaTransferencia}>
          <Pressable style={styles.ladoTransferencia} onPress={() => abrirSelectorCuentas('idCuentaOrigen')}>
            <Text variant="titleSmall">{cuentaOrigen?.nombre ?? 'Origen'}</Text>
            <Text variant="bodySmall">Toca para cambiar</Text>
          </Pressable>
          <Text variant="headlineSmall">→</Text>
          <Pressable style={styles.ladoTransferencia} onPress={() => abrirSelectorCuentas('idCuentaDestino')}>
            <Text variant="titleSmall">{cuentaDestino?.nombre ?? 'Destino'}</Text>
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

      {tipoSeleccionado === TipoTransaccion.TRANSFERENCIA ? (
        <HelperText type="info" visible={transferenciaSinCuentasSuficientes}>
          Necesitas al menos dos cuentas distintas para registrar una transferencia.
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={handleSubmit(AlEnviar)} disabled={transferenciaSinCuentasSuficientes}>Guardar</Button>
      <HelperText type="error" visible={!!errors.root}>{errors.root?.message}</HelperText>

      <Portal>
        <Modal visible={selectorAbierto !== null} onDismiss={() => setSelectorAbierto(null)} contentContainerStyle={styles.modalCuentas}>
          <Text variant="titleMedium">
            {selectorAbierto === 'idCuentaOrigen' ? 'Seleccionar cuenta origen' : 'Seleccionar cuenta destino'}
          </Text>
          <TextInput
            mode="outlined"
            label="Buscar cuenta"
            value={busquedaCuenta}
            onChangeText={setBusquedaCuenta}
            style={styles.inputMejorado}
          />
          <ScrollView
            style={styles.listaCuentasModal}
            contentContainerStyle={styles.contenidoListaCuentasModal}
            keyboardShouldPersistTaps="handled"
          >
            {cuentasDisponiblesSelector.map((cuenta) => (
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
            {cuentasDisponiblesSelector.length === 0 ? (
              <HelperText type="info">
                {tipoSeleccionado === TipoTransaccion.TRANSFERENCIA
                  ? 'No hay cuentas disponibles para esta selección'
                  : 'No hay cuentas con ese nombre'}
              </HelperText>
            ) : null}
          </ScrollView>
        </Modal>
      </Portal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  pantalla: {
    flex: 1
  },
  contenedor: {
    padding: 16,
    gap: 10
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
  ladoTransferencia: {
    alignItems: 'center',
    gap: 2,
    flexShrink: 1
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
    minHeight: '65%',
    maxHeight: '94%'
  },
  listaCuentasModal: {
    flexGrow: 1
  },
  contenidoListaCuentasModal: {
    paddingBottom: 8
  },
  itemCuentaModal: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC'
  }
});
