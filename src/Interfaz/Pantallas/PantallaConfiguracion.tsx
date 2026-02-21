import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { ModoTema, TemaAplicacion } from '@/Interfaz/Tema/temaAplicacion';

export const PantallaConfiguracion = (): React.JSX.Element => {
  const tema = useTheme<TemaAplicacion>();
  const { moneda, GuardarMoneda, modoTema, GuardarModoTema } = UsarAlmacenAplicacion();
  const [monedaLocal, setMonedaLocal] = useState(moneda);

  useEffect(() => {
    setMonedaLocal(moneda);
  }, [moneda]);

  return (
    <ScrollView contentContainerStyle={[styles.contenedor, { backgroundColor: tema.colors.background }]}>
      <Text variant="titleMedium">Apariencia</Text>
      <SegmentedButtons
        value={modoTema}
        onValueChange={(valor) => GuardarModoTema(valor as ModoTema)}
        buttons={[
          { value: 'sistema', label: 'Sistema' },
          { value: 'claro', label: 'Claro' },
          { value: 'oscuro', label: 'Oscuro' }
        ]}
      />

      <View style={styles.seccion}>
        <Text variant="titleMedium">Moneda</Text>
        <TextInput label="Moneda (ISO)" value={monedaLocal} onChangeText={setMonedaLocal} />
        <Button mode="contained" onPress={() => GuardarMoneda(monedaLocal)}>
          Guardar moneda
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    padding: 16,
    gap: 12,
    flexGrow: 1
  },
  seccion: {
    gap: 10
  }
});
