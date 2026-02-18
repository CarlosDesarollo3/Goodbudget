import React from 'react';
import { ScrollView } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, SegmentedButtons, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatISO } from 'date-fns';
import { EsquemaTransaccionFormulario } from '@/Dominio/Esquemas';
import { TipoTransaccion } from '@/Dominio/Modelos';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

type ValoresFormulario = {
  tipo: TipoTransaccion;
  monto: number;
  idCuentaOrigen?: string;
  idCuentaDestino?: string;
  idCategoria?: string;
  nota?: string;
  fecha: string;
};

export const PantallaFormularioTransaccion = ({ route, navigation }: NativeStackScreenProps<ParametrosNavegacion, 'PantallaFormularioTransaccion'>): React.JSX.Element => {
  const idCuentaPredeterminada = route.params?.idCuentaPredeterminada;
  const { categorias, RegistrarTransaccion } = UsarAlmacenAplicacion();

  const { control, handleSubmit, formState: { errors } } = useForm<ValoresFormulario>({
    resolver: zodResolver(EsquemaTransaccionFormulario),
    defaultValues: {
      tipo: TipoTransaccion.GASTO,
      monto: 0,
      idCuentaOrigen: idCuentaPredeterminada,
      fecha: formatISO(new Date())
    }
  });

  const AlEnviar = (valores: ValoresFormulario): void => {
    RegistrarTransaccion({ ...valores, monto: Number(valores.monto) });
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
          <TextInput label="Monto" value={String(value)} keyboardType="decimal-pad" onChangeText={(texto) => onChange(Number(texto))} />
        )}
      />
      <HelperText type="error" visible={!!errors.monto}>{errors.monto?.message}</HelperText>
      <Controller control={control} name="idCuentaOrigen" render={({ field: { value, onChange } }) => <TextInput label="ID cuenta origen" value={value} onChangeText={onChange} />} />
      <Controller control={control} name="idCuentaDestino" render={({ field: { value, onChange } }) => <TextInput label="ID cuenta destino" value={value} onChangeText={onChange} />} />
      <Controller control={control} name="idCategoria" render={({ field: { value, onChange } }) => <TextInput label={`ID categoría (${categorias.length} disponibles)`} value={value} onChangeText={onChange} />} />
      <Controller control={control} name="nota" render={({ field: { value, onChange } }) => <TextInput label="Nota" value={value} onChangeText={onChange} />} />
      <Button mode="contained" onPress={handleSubmit(AlEnviar)}>Guardar transacción</Button>
      <HelperText type="error" visible={!!errors.root}>{errors.root?.message}</HelperText>
    </ScrollView>
  );
};
