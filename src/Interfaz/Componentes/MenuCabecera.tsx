import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Menu } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

type PropiedadesMenuCabecera = {
  navigation: NativeStackNavigationProp<ParametrosNavegacion>;
};

export const MenuCabecera = ({ navigation }: PropiedadesMenuCabecera): React.JSX.Element => {
  const [menuVisible, setMenuVisible] = useState(false);
  const SolicitarAyudaRapida = UsarAlmacenAplicacion((estado) => estado.SolicitarAyudaRapida);

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <View style={styles.anclaMenu}>
          <Appbar.Action icon="menu" iconColor="#000000" style={styles.botonMenu} onPress={() => setMenuVisible(true)} accessibilityLabel="Abrir menú" />
        </View>
      }
    >
      <Menu.Item
        onPress={() => {
          setMenuVisible(false);
          navigation.navigate('PantallaCategorias');
        }}
        title="Categorías"
        leadingIcon="shape-outline"
      />
      <Menu.Item
        onPress={() => {
          setMenuVisible(false);
          navigation.navigate('PantallaReglasRecurrentes');
        }}
        title="Reglas recurrentes"
        leadingIcon="calendar-sync"
      />
      <Menu.Item
        onPress={() => {
          setMenuVisible(false);
          SolicitarAyudaRapida();
        }}
        title="Ayuda rápida"
        leadingIcon="lightbulb-on-outline"
      />
      <Menu.Item
        onPress={() => {
          setMenuVisible(false);
          navigation.navigate('PantallaConfiguracion');
        }}
        title="Configuración"
        leadingIcon="cog-outline"
      />
    </Menu>
  );
};

const styles = StyleSheet.create({
  anclaMenu: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44
  },
  botonMenu: {
    margin: 0
  }
});
