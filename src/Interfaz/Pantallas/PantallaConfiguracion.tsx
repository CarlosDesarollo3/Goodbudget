import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

export const PantallaConfiguracion = (): React.JSX.Element => {
  const { moneda, GuardarMoneda } = UsarAlmacenAplicacion();
  const [monedaLocal, setMonedaLocal] = useState(moneda);

  const ExportarJson = (): void => {
    Alert.alert('Exportación', 'La exportación JSON se puede conectar con FileSystem para backup local.');
  };

  const ImportarJson = (): void => {
    Alert.alert('Importación', 'La importación JSON se puede conectar con FileSystem para restaurar backups.');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <TextInput label="Moneda (ISO)" value={monedaLocal} onChangeText={setMonedaLocal} />
      <Button mode="contained" onPress={() => GuardarMoneda(monedaLocal)}>Guardar moneda</Button>
      <Button mode="outlined" onPress={ExportarJson}>Exportar JSON</Button>
      <Button mode="outlined" onPress={ImportarJson}>Importar JSON</Button>
    </ScrollView>
  );
};
