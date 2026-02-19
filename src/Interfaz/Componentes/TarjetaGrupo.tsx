import React from 'react';
import { Avatar, Card, Text, useTheme } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsTarjetaGrupo {
  nombre: string;
  total: number;
  moneda: string;
  AlPresionar(): void;
}

export const TarjetaGrupo = ({ nombre, total, moneda, AlPresionar }: PropsTarjetaGrupo): React.JSX.Element => {
  const tema = useTheme();
  const colorTotal = total >= 0 ? '#1F8F4C' : '#C4362D';

  return (
    <Card mode="contained" onPress={AlPresionar} style={{ borderRadius: 14, backgroundColor: '#EAF4FF' }}>
      <Card.Title
        title={nombre}
        subtitle="Grupo"
        titleVariant="titleMedium"
        subtitleVariant="bodySmall"
        left={(props) => <Avatar.Icon {...props} icon="folder-outline" size={36} style={{ backgroundColor: '#D4E8FF' }} color={tema.colors.primary} />}
        right={() => <Text variant="titleSmall" style={{ color: colorTotal, marginRight: 12 }}>{FormatearMoneda(total, moneda)}</Text>}
      />
    </Card>
  );
};
