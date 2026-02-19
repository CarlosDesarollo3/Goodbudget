import React from 'react';
import { ScrollView, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, SegmentedButtons, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatISO } from 'date-fns';
import { EsquemaTransaccionFormulario } from '@/Dominio/Esquemas';
import { TipoTransaccion } from '@/Dominio/Modelos';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { CLAVE_CUENTAS_RAIZ, UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { Transaccion } from '@/Dominio/Modelos';

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

  const transaccionEditar = (route.params as any)?.transaccion as Transaccion | undefined;
  const seccionesCuentas = [
    { id: CLAVE_CUENTAS_RAIZ, nombre: 'Cuentas principales' },
    ...grupos.map((grupo) => ({ id: grupo.id, nombre: grupo.nombre }))
  ].filter((seccion) => (cuentasPorGrupo[seccion.id] ?? []).length > 0);

  const { control, handleSubmit, formState: { errors } } = useForm<ValoresFormulario>({
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

  const AlEnviar = (valores: ValoresFormulario): void => {
    if (transaccionEditar) {
      const actualizado: Transaccion = { ...transaccionEditar, ...valores, monto: Number(valores.monto) } as Transaccion;
      ActualizarTransaccion(actualizado);
    } else {
      RegistrarTransaccion({ ...valores, monto: Number(valores.monto) });
    }
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Controller
        control={control}
        name="tipo"
        render={({ field: { value, onChange } }) => (
          <SegmentedButtons
            value={value}
            onValueChange={(nuevo) => onChange(nuevo as TipoTransaccion)}
            buttons={[
              { value: TipoTransaccion.AJUSTE, label: 'Ajuste' },
              { value: TipoTransaccion.TRANSFERENCIA, label: 'Transferencia' },
              { value: TipoTransaccion.GASTO, label: 'Gasto' },
              { value: TipoTransaccion.INGRESO, label: 'Ingreso' }
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
            onChangeText={(texto) => onChange(texto === '' ? undefined : Number(texto))}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.monto}>{errors.monto?.message}</HelperText>

      {cuentas.length > 0 ? (
        grupos && Object.keys(cuentasPorGrupo).length > 0 ? (
          // agrupar por grupos mostrando botones por grupo
          <>
            {seccionesCuentas.map((seccion) => (
              <React.Fragment key={seccion.id}>
                <HelperText type="info">{seccion.nombre}</HelperText>
                <Controller control={control} name="idCuentaOrigen" render={({ field: { value, onChange } }) => (
                  <React.Fragment>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {(cuentasPorGrupo[seccion.id] ?? []).map(c => (
                        <Button key={c.id} mode={value === c.id ? 'contained' : 'outlined'} onPress={() => onChange(c.id)}>{c.nombre}</Button>
                      ))}
                    </View>
                  </React.Fragment>
                )} />
              </React.Fragment>
            ))}
          </>
        ) : (
          <Controller control={control} name="idCuentaOrigen" render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={cuentas.map((c) => ({ value: c.id, label: c.nombre }))}
            />
          )} />
        )
      ) : (
        <HelperText type="info">No hay cuentas. Crea una en Configuración.</HelperText>
      )}

      {cuentas.length > 0 ? (
        grupos && Object.keys(cuentasPorGrupo).length > 0 ? (
          <>
            {seccionesCuentas.map((seccion) => (
              <React.Fragment key={seccion.id}>
                <HelperText type="info">{seccion.nombre}</HelperText>
                <Controller control={control} name="idCuentaDestino" render={({ field: { value, onChange } }) => (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(cuentasPorGrupo[seccion.id] ?? []).map(c => (
                      <Button key={c.id} mode={value === c.id ? 'contained' : 'outlined'} onPress={() => onChange(c.id)}>{c.nombre}</Button>
                    ))}
                  </View>
                )} />
              </React.Fragment>
            ))}
          </>
        ) : (
          <Controller control={control} name="idCuentaDestino" render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={cuentas.map((c) => ({ value: c.id, label: c.nombre }))}
            />
          )} />
        )
      ) : null}

      {categorias.length > 0 ? (
        categorias.length <= 5 ? (
          <Controller control={control} name="idCategoria" render={({ field: { value, onChange } }) => (
            <SegmentedButtons value={value} onValueChange={onChange} buttons={categorias.map(c => ({ value: c.id, label: c.nombre }))} />
          )} />
        ) : (
          <>
            <Controller control={control} name="idCategoria" render={({ field: { value, onChange } }) => (
              <TextInput label={`Categoría (ID) — ${categorias.length} disponibles`} placeholder="P. ej. 1234-abc" value={value} onChangeText={onChange} />
            )} />
            <HelperText type="info">Algunos IDs: {categorias.slice(0,5).map(c => `${c.id} (${c.nombre})`).join(', ')}{categorias.length>5? ', ...':''}</HelperText>
          </>
        )
      ) : (
        <HelperText type="info">No hay categorías. Crear en Configuración.</HelperText>
      )}

      <Controller control={control} name="nota" render={({ field: { value, onChange } }) => <TextInput label="Nota (opcional)" placeholder="Descripción breve" value={value} onChangeText={onChange} />} />
      <Button mode="contained" onPress={handleSubmit(AlEnviar)}>Guardar</Button>
      <HelperText type="error" visible={!!errors.root}>{errors.root?.message}</HelperText>
    </ScrollView>
  );
};
