import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { ModoTema, TemaAplicacion } from '@/Interfaz/Tema/temaAplicacion';

export const PantallaConfiguracion = (): React.JSX.Element => {
  const tema = useTheme<TemaAplicacion>();
  const { moneda, GuardarMoneda, modoTema, GuardarModoTema } = UsarAlmacenAplicacion();
  const [monedaLocal, setMonedaLocal] = useState(moneda);
  const [procesandoArchivo, setProcesandoArchivo] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; esError: boolean } | null>(null);

  useEffect(() => {
    setMonedaLocal(moneda);
  }, [moneda]);



  const ExportarJson = async (): Promise<void> => {
    try {
      setProcesandoArchivo(true);
      const json = ExportarDatos();
      const uri = `${FileSystem.cacheDirectory}goodbudget-respaldo-${Date.now()}.json`;

      await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });

      const sePuedeCompartir = await Sharing.isAvailableAsync();

      if (!sePuedeCompartir) {
        throw new Error('No es posible compartir archivos en este dispositivo.');
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar respaldo de Goodbudget',
        UTI: 'public.json'
      });
      MostrarMensaje('Respaldo exportado correctamente.');
    } catch (error) {
      MostrarMensaje(error instanceof Error ? error.message : 'No se pudo exportar el respaldo.', true);
    } finally {
      setProcesandoArchivo(false);
    }
  };

  const ConfirmarImportacion = (): void => {
    Alert.alert(
      'Importar respaldo',
      'Se sobrescribirán todos los datos actuales. Esta acción no se puede deshacer. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sobrescribir',
          style: 'destructive',
          onPress: () => {
            void ImportarJson();
          }
        }
      ]
    );
  };

  const ImportarJson = async (): Promise<void> => {
    try {
      setProcesandoArchivo(true);
      if (Platform.OS !== 'android') {
        throw new Error('La importación directa de archivos solo está disponible en Android para este build.');
      }

      const permiso = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permiso.granted) {
        MostrarMensaje('No se otorgaron permisos para leer respaldos.', true);
        return;
      }

      const uris = await FileSystem.StorageAccessFramework.readDirectoryAsync(permiso.directoryUri);
      const uriJson = uris.find((uri) => uri.toLowerCase().endswith('.json'));

      if (!uriJson) {
        throw new Error('No se encontró ningún archivo JSON en la carpeta seleccionada.');
      }

      const contenido = await FileSystem.readAsStringAsync(uriJson, { encoding: FileSystem.EncodingType.UTF8 });
      ImportarDatos(contenido);
      MostrarMensaje('Respaldo importado correctamente.');
    } catch (error) {
      MostrarMensaje(error instanceof Error ? error.message : 'No se pudo importar el respaldo.', true);
    } finally {
      setProcesandoArchivo(false);
    }
  };

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
        <Button mode="contained" onPress={() => GuardarMoneda(monedaLocal)}>Guardar moneda</Button>
      </View>

      <View style={styles.seccion}>
        <Button mode="outlined" onPress={ExportarJson}>Exportar JSON</Button>
        <Button mode="outlined" onPress={ImportarJson}>Importar JSON</Button>
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
