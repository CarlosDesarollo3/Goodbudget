import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Avatar, Card, Text, useTheme } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsTarjetaCuenta {
  nombre: string;
  balance: number;
  moneda: string;
  AlPresionar(): void;
  AlSostener?: () => void;
  estilo?: StyleProp<ViewStyle>;
}

export const TarjetaCuenta = ({ nombre, balance, moneda, AlPresionar, AlSostener, estilo }: PropsTarjetaCuenta): React.JSX.Element => {
  const tema = useTheme();
  const colorBalance = balance >= 0 ? '#1F8F4C' : '#C4362D';

  return (
    <Card
      mode="outlined"
      onPress={AlPresionar}
      onLongPress={AlSostener}
      delayLongPress={220}
      style={[{ borderRadius: 14, borderColor: '#C4D0DD', backgroundColor: '#F8FAFC' }, estilo]}
    >
      <Card.Title
        title={nombre}
        titleVariant="titleSmall"
        left={(props) => <Avatar.Icon {...props} icon="wallet-outline" size={32} style={{ backgroundColor: '#DEE7F0' }} color={tema.colors.primary} />}
        right={() => <Text variant="titleSmall" style={{ color: colorBalance, marginRight: 12 }}>{FormatearMoneda(balance, moneda)}</Text>}
      />
    </Card>
  );
};
