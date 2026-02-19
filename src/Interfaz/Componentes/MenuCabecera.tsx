import React, { useState } from 'react';
import { Appbar, Menu } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParametrosNavegacion } from '@/Navegacion/TiposNavegacion';

type PropiedadesMenuCabecera = {
  navigation: NativeStackNavigationProp<ParametrosNavegacion>;
};

export const MenuCabecera = ({ navigation }: PropiedadesMenuCabecera): React.JSX.Element => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={<Appbar.Action icon="menu" iconColor="#000000" onPress={() => setMenuVisible(true)} accessibilityLabel="Abrir menú" />}
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
          navigation.navigate('PantallaConfiguracion');
        }}
        title="Configuración"
        leadingIcon="cog-outline"
      />
    </Menu>
  );
};
