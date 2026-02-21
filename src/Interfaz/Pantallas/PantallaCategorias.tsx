import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { ChipCategoria } from '@/Interfaz/Componentes/ChipCategoria';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { EstadoVacioLista } from '@/Interfaz/Componentes/EstadoVacioLista';

export const PantallaCategorias = (): React.JSX.Element => {
  const { categorias, CrearCategoria } = UsarAlmacenAplicacion();
  const [nombreCategoria, setNombreCategoria] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <TextInput label="Nueva categoría" value={nombreCategoria} onChangeText={setNombreCategoria} />
      <Button mode="contained" style={styles.boton} onPress={() => { CrearCategoria(nombreCategoria, '#D1C4E9'); setNombreCategoria(''); }}>
        Guardar categoría
      </Button>
      {categorias.length === 0 ? (
        <EstadoVacioLista
          icono="shape-outline"
          titulo="Aún no hay categorías"
          descripcion="Crea categorías para clasificar gastos e ingresos y entender mejor en qué se mueve tu dinero."
          etiquetaCta="Añadir categoría"
          onPressCta={() => {
            CrearCategoria(nombreCategoria.trim() || 'General', '#D1C4E9');
            setNombreCategoria('');
          }}
        />
      ) : (
        categorias.map((categoria) => (
          <ChipCategoria key={categoria.id} nombre={categoria.nombre} color={categoria.color} />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenido: {
    padding: 16,
    gap: 10
  },
  boton: {
    marginTop: 4
  }
});
