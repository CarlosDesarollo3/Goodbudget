import React from 'react';
import { Avatar, Card, Text } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsTarjetaGrupo {
  nombre: string;
  total: number;
  moneda: string;
  AlPresionar(): void;
}

export const TarjetaGrupo = ({ nombre, total, moneda, AlPresionar }: PropsTarjetaGrupo): React.JSX.Element => (
  <Card mode="contained" onPress={AlPresionar} style={{ borderRadius: 12 }}>
    <Card.Title
      title={nombre}
      subtitle="Grupo"
      titleVariant="titleMedium"
      subtitleVariant="bodySmall"
      left={(props) => <Avatar.Icon {...props} icon="folder-outline" size={36} />}
      right={() => <Text variant="titleSmall">{FormatearMoneda(total, moneda)}</Text>}
    />
  </Card>
);
