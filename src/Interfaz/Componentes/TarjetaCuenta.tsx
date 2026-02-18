import React from 'react';
import { Card, Text } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsTarjetaCuenta {
  nombre: string;
  balance: number;
  moneda: string;
  AlPresionar(): void;
}

export const TarjetaCuenta = ({ nombre, balance, moneda, AlPresionar }: PropsTarjetaCuenta): React.JSX.Element => (
  <Card mode="outlined" onPress={AlPresionar} style={{ marginVertical: 8 }}>
    <Card.Title title={nombre} subtitle="Cuenta/Sobre" />
    <Card.Content>
      <Text variant="titleMedium">{FormatearMoneda(balance, moneda)}</Text>
    </Card.Content>
  </Card>
);
