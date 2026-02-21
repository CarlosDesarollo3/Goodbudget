import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Avatar, Card, ProgressBar, Text, useTheme } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';
import { TemaAplicacion } from '@/Interfaz/Tema/temaAplicacion';

interface PropsTarjetaCuenta {
  nombre: string;
  balance: number;
  moneda: string;
  AlPresionar(): void;
  AlSostener?: () => void;
  progresoObjetivo?: number;
  alertaObjetivo?: boolean;
  estilo?: StyleProp<ViewStyle>;
}

export const TarjetaCuenta = ({
  nombre,
  balance,
  moneda,
  AlPresionar,
  AlSostener,
  progresoObjetivo,
  alertaObjetivo,
  estilo
}: PropsTarjetaCuenta): React.JSX.Element => {
  const tema = useTheme();
  const colorBalance = balance >= 0 ? '#1F8F4C' : '#C4362D';

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
      {typeof progresoObjetivo === 'number' && (
        <>
          <ProgressBar
            progress={Math.max(0, Math.min(progresoObjetivo, 1))}
            color={alertaObjetivo ? '#C4362D' : tema.colors.primary}
            style={{ marginHorizontal: 14, marginBottom: 6, borderRadius: 6, height: 6 }}
          />
          <Text variant="labelSmall" style={{ marginHorizontal: 14, marginBottom: 12, color: alertaObjetivo ? '#C4362D' : '#526174' }}>
            Presupuesto usado: {Math.round(progresoObjetivo * 100)}%
          </Text>
        </>
      )}
    </Card>
  );
};
