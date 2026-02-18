import React from 'react';
import { Chip } from 'react-native-paper';

interface PropsChipCategoria {
  nombre: string;
  color?: string;
}

export const ChipCategoria = ({ nombre, color }: PropsChipCategoria): React.JSX.Element => (
  <Chip style={{ marginVertical: 4, backgroundColor: color ?? '#E8EAF6' }}>{nombre}</Chip>
);
