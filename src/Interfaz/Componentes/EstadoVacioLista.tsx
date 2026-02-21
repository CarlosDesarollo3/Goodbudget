import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Surface, Text } from 'react-native-paper';

interface PropsEstadoVacioLista {
  icono: string;
  titulo: string;
  descripcion: string;
  etiquetaCta: string;
  onPressCta(): void;
}

export const EstadoVacioLista = ({ icono, titulo, descripcion, etiquetaCta, onPressCta }: PropsEstadoVacioLista): React.JSX.Element => {
  return (
    <Surface style={styles.tarjeta} elevation={0}>
      <Avatar.Icon icon={icono} size={52} style={styles.icono} />
      <Text variant="titleMedium" style={styles.titulo}>{titulo}</Text>
      <Text variant="bodyMedium" style={styles.descripcion}>{descripcion}</Text>
      <Button mode="contained" onPress={onPressCta} style={styles.boton}>
        {etiquetaCta}
      </Button>
      <View style={styles.espaciador} />
    </Surface>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7E1EC'
  },
  icono: {
    backgroundColor: '#E6EDF6',
    marginBottom: 12
  },
  titulo: {
    marginBottom: 6,
    textAlign: 'center'
  },
  descripcion: {
    opacity: 0.75,
    textAlign: 'center',
    marginBottom: 14
  },
  boton: {
    minWidth: 210
  },
  espaciador: {
    height: 4
  }
});
