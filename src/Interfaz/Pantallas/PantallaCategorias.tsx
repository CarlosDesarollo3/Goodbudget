import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { InputConCerrarTeclado } from '@/Interfaz/Componentes/InputConCerrarTeclado';
import { ChipCategoria } from '@/Interfaz/Componentes/ChipCategoria';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

export const PantallaCategorias = (): React.JSX.Element => {
  const { categorias, CrearCategoria } = UsarAlmacenAplicacion();
  const [nombreCategoria, setNombreCategoria] = useState('');

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <InputConCerrarTeclado label="Nueva categoría" value={nombreCategoria} onChangeText={setNombreCategoria} />
      <Button mode="contained" onPress={() => { CrearCategoria(nombreCategoria, '#D1C4E9'); setNombreCategoria(''); }}>
        Guardar categoría
      </Button>
      {categorias.map((categoria) => (
        <ChipCategoria key={categoria.id} nombre={categoria.nombre} color={categoria.color} />
      ))}
    </ScrollView>
  );
};
