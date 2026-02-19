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
  const cuentas = Object.values(cuentasPorGrupo).flat();

  const transaccionEditar = (route.params as { transaccion?: Transaccion } | undefined)?.transaccion;
  const seccionesCuentas = [
    { id: CLAVE_CUENTAS_RAIZ, nombre: 'Cuentas principales' },
    ...grupos.map((grupo) => ({ id: grupo.id, nombre: grupo.nombre }))
  ].filter((seccion) => (cuentasPorGrupo[seccion.id] ?? []).length > 0);

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
      setValue('idCuentaOrigen', origenSugerido, { shouldValidate: true });

      if (!cuentaDestinoSeleccionada || cuentaDestinoSeleccionada === origenSugerido) {
        const destinoSugerido = cuentas.find((cuenta) => cuenta.id !== origenSugerido)?.id;
        setValue('idCuentaDestino', destinoSugerido, { shouldValidate: true });
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

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text variant="titleMedium">{transaccionEditar ? 'Editar transacción' : 'Nueva transacción'}</Text>
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
            placeholder="0.00"
            value={value === undefined ? '' : String(value)}
            keyboardType="decimal-pad"
            onChangeText={(texto) => onChange(texto === '' ? undefined : Number(texto.replace(',', '.')))}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.monto}>{errors.monto?.message}</HelperText>

      {requiereCuentaOrigen ? (
        <View style={styles.bloqueCampo}>
          <Text variant="labelLarge">Cuenta origen</Text>
          {seccionesCuentas.map((seccion) => (
            <React.Fragment key={`origen-${seccion.id}`}>
              <HelperText type="info">{seccion.nombre}</HelperText>
              <Controller
                control={control}
                name="idCuentaOrigen"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.grupoChips}>
                    {(cuentasPorGrupo[seccion.id] ?? []).map((cuenta) => (
                      <Chip key={cuenta.id} selected={value === cuenta.id} onPress={() => onChange(cuenta.id)}>{cuenta.nombre}</Chip>
                    ))}
                  </View>
                )}
              />
            </React.Fragment>
          ))}
        </View>
      ) : null}

      {requiereCuentaDestino ? (
        <View style={styles.bloqueCampo}>
          <Text variant="labelLarge">Cuenta destino</Text>
          {seccionesCuentas.map((seccion) => (
            <React.Fragment key={`destino-${seccion.id}`}>
              <HelperText type="info">{seccion.nombre}</HelperText>
              <Controller
                control={control}
                name="idCuentaDestino"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.grupoChips}>
                    {(cuentasPorGrupo[seccion.id] ?? []).map((cuenta) => (
                      <Chip key={cuenta.id} selected={value === cuenta.id} onPress={() => onChange(cuenta.id)}>{cuenta.nombre}</Chip>
                    ))}
                  </View>
                )}
              />
            </React.Fragment>
          ))}
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
                    <Chip key={categoria.id} selected={value === categoria.id} onPress={() => onChange(categoria.id)}>{categoria.nombre}</Chip>
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
            placeholder="Descripción breve"
            value={value}
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
    gap: 10
  },
  bloqueCampo: {
    gap: 4
  },
  grupoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  }
});
