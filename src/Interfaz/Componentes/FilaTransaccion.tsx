import React from 'react';
import { View } from 'react-native';
import { IconButton, List, Text } from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaccion } from '@/Dominio/Modelos';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsFilaTransaccion {
  transaccion: Transaccion;
  moneda: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
}

export const FilaTransaccion = ({ transaccion, moneda, onEdit, onDelete, onPress }: PropsFilaTransaccion): React.JSX.Element => {
  const colorMonto = transaccion.monto >= 0 ? '#1F8F4C' : '#C4362D';

  return (
    <List.Item
      title={transaccion.tipo}
      description={`${format(new Date(transaccion.fecha), 'dd MMM yyyy', { locale: es })}${transaccion.nota ? ` · ${transaccion.nota}` : ''}`}
      left={(props) => <List.Icon {...props} icon="swap-horizontal" />}
      right={() => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="titleSmall" style={{ color: colorMonto, marginRight: 4 }}>
            {FormatearMoneda(transaccion.monto, moneda)}
          </Text>
          {onEdit && <IconButton icon="pencil" size={18} onPress={onEdit} />}
          {onDelete && <IconButton icon="delete" size={18} onPress={onDelete} />}
        </View>
      )}
      onPress={onPress}
    />
  );
};
