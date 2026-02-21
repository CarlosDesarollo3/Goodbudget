import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button, Chip, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatISO } from 'date-fns';
import { EsquemaTransaccionFormulario } from '@/Dominio/Esquemas';
import { TipoTransaccion, Transaccion } from '@/Dominio/Modelos';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { CLAVE_CUENTAS_RAIZ, UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

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
  const { categorias, cuentasPorGrupo, grupos, RegistrarTransaccion, ActualizarTransaccion } = UsarAlmacenAplicacion();
  const cuentas = React.useMemo(() => Object.values(cuentasPorGrupo).flat(), [cuentasPorGrupo]);

  const transaccionEditar = (route.params as { transaccion?: Transaccion } | undefined)?.transaccion;
  const seccionesCuentas = React.useMemo(() => ([
    { id: CLAVE_CUENTAS_RAIZ, nombre: 'Cuentas principales' },
    ...grupos.map((grupo) => ({ id: grupo.id, nombre: grupo.nombre }))
  ].filter((seccion) => (cuentasPorGrupo[seccion.id] ?? []).length > 0)), [cuentasPorGrupo, grupos]);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ValoresFormulario>({
    resolver: zodResolver(EsquemaTransaccionFormulario),
    defaultValues: transaccionEditar
      ? {
          tipo: transaccionEditar.tipo,
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

  React.useEffect(() => {
    if (!tipoSeleccionado) {
      return;
    }

    if ((tipoSeleccionado === TipoTransaccion.GASTO || tipoSeleccionado === TipoTransaccion.INGRESO) && !cuentaOrigenSeleccionada) {
      setValue('idCuentaOrigen', idCuentaPredeterminada ?? cuentas[0]?.id, { shouldValidate: true });
    }

    if (tipoSeleccionado === TipoTransaccion.AJUSTE && !cuentaDestinoSeleccionada) {
      setValue('idCuentaDestino', idCuentaPredeterminada ?? cuentaOrigenSeleccionada ?? cuentas[0]?.id, { shouldValidate: true });
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
      setValue('idCuentaDestino', tipoSeleccionado === TipoTransaccion.AJUSTE ? cuentaDestinoSeleccionada : undefined, { shouldValidate: false });
    }

    if (tipoSeleccionado === TipoTransaccion.AJUSTE) {
      setValue('idCuentaOrigen', undefined, { shouldValidate: false });
      setValue('idCategoria', undefined, { shouldValidate: false });
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
  const requiereCuentaDestino = tipoSeleccionado === TipoTransaccion.AJUSTE || tipoSeleccionado === TipoTransaccion.TRANSFERENCIA;
  const montoMostrado = montoCapturado ?? 0;
  const montoConSigno = tipoSeleccionado === TipoTransaccion.GASTO ? -Math.abs(montoMostrado) : Math.abs(montoMostrado);

  const colorMonto = montoConSigno === 0
    ? styles.montoNeutro
    : montoConSigno > 0
      ? styles.montoPositivo
      : styles.montoNegativo;

  const selectorCuentas = (campo: 'idCuentaOrigen' | 'idCuentaDestino', sinSecciones = false): React.JSX.Element => (
    <Controller
      control={control}
      name={campo}
      render={({ field: { value, onChange } }) => (
        sinSecciones ? (
          <View style={styles.grupoChips}>
            {cuentas.map((cuenta) => (
              <Chip
                key={`${campo}-${cuenta.id}`}
                selected={value === cuenta.id}
                compact
                style={styles.chipEtiquetas}
                onPress={() => onChange(cuenta.id)}
              >
                {cuenta.nombre}
              </Chip>
            ))}
          </View>
        ) : (
          seccionesCuentas.map((seccion) => (
            <React.Fragment key={`${campo}-${seccion.id}`}>
              <HelperText type="info">{seccion.nombre}</HelperText>
              <View style={styles.grupoChips}>
                {(cuentasPorGrupo[seccion.id] ?? []).map((cuenta) => (
                  <Chip
                    key={`${campo}-${cuenta.id}`}
                    selected={value === cuenta.id}
                    compact
                    style={styles.chipEtiquetas}
                    onPress={() => onChange(cuenta.id)}
                  >
                    {cuenta.nombre}
                  </Chip>
                ))}
              </View>
            </React.Fragment>
          ))
        )
      )}
    />
  );

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text variant="titleMedium">{transaccionEditar ? 'Editar transacción' : 'Nueva transacción'}</Text>

      <View style={styles.resumenMonto}>
        <Text variant="labelLarge">Monto</Text>
        <Text variant="displaySmall" style={colorMonto}>{montoConSigno.toFixed(2)}</Text>
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
              { value: TipoTransaccion.TRANSFERENCIA, label: 'Transferencia' },
              { value: TipoTransaccion.AJUSTE, label: 'Ajuste' }
            ]}
          />
        )}
      />

      <Controller
        control={control}
        name="monto"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="Monto"
            mode="outlined"
            value={value === undefined ? '0' : String(value)}
            keyboardType="decimal-pad"
            style={styles.inputMejorado}
            onChangeText={(texto) => onChange(texto === '' ? undefined : Number(texto.replace(',', '.')))}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.monto}>{errors.monto?.message}</HelperText>

      {requiereCuentaOrigen ? (
        <View style={styles.bloqueCampo}>
          <Text variant="labelLarge">Cuenta origen</Text>
          {selectorCuentas('idCuentaOrigen', tipoSeleccionado === TipoTransaccion.TRANSFERENCIA)}
        </View>
      ) : null}

      {tipoSeleccionado === TipoTransaccion.TRANSFERENCIA ? (
        <View style={styles.flechasTransferencia}>
          <Text variant="headlineSmall">⬇︎</Text>
          <Text variant="labelMedium">se transfiere</Text>
          <Text variant="headlineSmall">⬇︎</Text>
        </View>
      ) : null}

      {requiereCuentaDestino ? (
        <View style={styles.bloqueCampo}>
          <Text variant="labelLarge">Cuenta destino</Text>
          {selectorCuentas('idCuentaDestino', tipoSeleccionado === TipoTransaccion.TRANSFERENCIA)}
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
  grupoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chipEtiquetas: {
    borderRadius: 18
  },
  flechasTransferencia: {
    alignItems: 'center',
    gap: 2,
    marginVertical: -2
  }
});
