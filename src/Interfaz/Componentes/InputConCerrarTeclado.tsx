import React from 'react';
import { Keyboard } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';

export const InputConCerrarTeclado = (props: TextInputProps): React.JSX.Element => {
  const iconoDerecho = props.right ?? <TextInput.Icon icon="keyboard-close" onPress={Keyboard.dismiss} forceTextInputFocus={false} />;

  return <TextInput {...props} right={iconoDerecho} />;
};
