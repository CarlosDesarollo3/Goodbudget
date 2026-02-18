import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Card, Switch, Text, TextInput } from 'react-native-paper';
import { formatISO } from 'date-fns';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

export const PantallaReglasRecurrentes = (): React.JSX.Element => {
  const { reglas, CrearReglaRecurrente } = UsarAlmacenAplicacion();
  const [idCuentaOrigen, setIdCuentaOrigen] = useState('');
  const [idCuentaDestino, setIdCuentaDestino] = useState('');
  const [diaDelMes, setDiaDelMes] = useState('1');
  const [monto, setMonto] = useState('0');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <TextInput label="Cuenta origen" value={idCuentaOrigen} onChangeText={setIdCuentaOrigen} />
      <TextInput label="Cuenta destino" value={idCuentaDestino} onChangeText={setIdCuentaDestino} />
      <TextInput label="Día del mes" value={diaDelMes} onChangeText={setDiaDelMes} keyboardType="number-pad" />
      <TextInput label="Monto" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
      <Button
        mode="contained"
        onPress={() =>
          CrearReglaRecurrente({
            habilitada: true,
            diaDelMes: Number(diaDelMes),
            idCuentaOrigen,
            idCuentaDestino,
            monto: Number(monto),
            proximaEjecucionEn: formatISO(new Date())
          })
        }
      >
        Crear regla
      </Button>

      {reglas.map((regla) => (
        <Card key={regla.id} mode="outlined">
          <Card.Title title={`Regla mensual día ${regla.diaDelMes}`} />
          <Card.Content>
            <Text>{`${regla.idCuentaOrigen} → ${regla.idCuentaDestino}`}</Text>
            <Text>Monto: {regla.monto}</Text>
            <Text>Próxima ejecución: {regla.proximaEjecucionEn.slice(0, 10)}</Text>
            <Switch value={regla.habilitada} />
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};
