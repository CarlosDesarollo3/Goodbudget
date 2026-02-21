import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Avatar, Card, Text, useTheme } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';
import { TemaAplicacion } from '@/Interfaz/Tema/temaAplicacion';

interface PropsTarjetaCuenta {
  nombre: string;
  balance: number;
  moneda: string;
  AlPresionar(): void;
  AlSostener?: () => void;
  estilo?: StyleProp<ViewStyle>;
}

export const TarjetaCuenta = ({ nombre, balance, moneda, AlPresionar, AlSostener, estilo }: PropsTarjetaCuenta): React.JSX.Element => {
  const tema = useTheme<TemaAplicacion>();
  const colorBalance = balance >= 0 ? tema.colors.exito : tema.colors.error;

  return (
    <Card
      mode="outlined"
      onPress={AlPresionar}
      onLongPress={AlSostener}
      delayLongPress={220}
      style={[{ borderRadius: 14, borderColor: tema.colors.outline, backgroundColor: tema.colors.surface }, estilo]}
    >
      <Card.Title
        title={nombre}
        titleVariant="titleSmall"
        left={(props) => <Avatar.Icon {...props} icon="wallet-outline" size={32} style={{ backgroundColor: tema.colors.surfaceVariant }} color={tema.colors.primary} />}
        right={() => <Text variant="titleSmall" style={{ color: colorBalance, marginRight: 12 }}>{FormatearMoneda(balance, moneda)}</Text>}
      />
    </Card>
  );
};
