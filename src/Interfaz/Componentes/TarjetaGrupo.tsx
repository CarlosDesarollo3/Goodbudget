import React from 'react';
import { Card, Text } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsTarjetaGrupo {
  nombre: string;
  total: number;
  moneda: string;
  AlPresionar(): void;
}

export const TarjetaGrupo = ({ nombre, total, moneda, AlPresionar }: PropsTarjetaGrupo): React.JSX.Element => (
  <Card mode="contained" onPress={AlPresionar} style={{ marginVertical: 8 }}>
    <Card.Title title={nombre} subtitle="Grupo" />
    <Card.Content>
      <Text variant="titleMedium">{FormatearMoneda(total, moneda)}</Text>
    </Card.Content>
  </Card>
);
