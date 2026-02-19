import React from 'react';
import { Avatar, Card, Text } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsTarjetaCuenta {
  nombre: string;
  balance: number;
  moneda: string;
  AlPresionar(): void;
}

export const TarjetaCuenta = ({ nombre, balance, moneda, AlPresionar }: PropsTarjetaCuenta): React.JSX.Element => (
  <Card mode="outlined" onPress={AlPresionar} style={{ borderRadius: 12 }}>
    <Card.Title
      title={nombre}
      subtitle="Cuenta/Sobre"
      titleVariant="titleSmall"
      subtitleVariant="bodySmall"
      left={(props) => <Avatar.Icon {...props} icon="wallet-outline" size={32} />}
      right={() => <Text variant="titleSmall">{FormatearMoneda(balance, moneda)}</Text>}
    />
  </Card>
);
