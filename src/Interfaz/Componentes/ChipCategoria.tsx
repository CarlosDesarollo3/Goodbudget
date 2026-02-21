import React from 'react';
import { Chip, useTheme } from 'react-native-paper';
import { TemaAplicacion } from '@/Interfaz/Tema/temaAplicacion';

interface PropsChipCategoria {
  nombre: string;
  color?: string;
}

export const ChipCategoria = ({ nombre, color }: PropsChipCategoria): React.JSX.Element => {
  const tema = useTheme<TemaAplicacion>();

  return (
    <Chip
      style={{ marginVertical: 4, backgroundColor: color ?? tema.colors.surfaceVariant }}
      textStyle={{ color: tema.colors.onSurfaceVariant }}
    >
      {nombre}
    </Chip>
  );
};
