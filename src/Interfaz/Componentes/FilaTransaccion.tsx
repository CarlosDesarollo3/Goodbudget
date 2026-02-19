import React from 'react';
import { List } from 'react-native-paper';
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

export const FilaTransaccion = ({ transaccion, moneda, onEdit, onDelete, onPress }: PropsFilaTransaccion): React.JSX.Element => (
  <List.Item
    title={`${transaccion.tipo} · ${FormatearMoneda(transaccion.monto, moneda)}`}
    description={`${format(new Date(transaccion.fecha), 'dd MMM yyyy', { locale: es })}${transaccion.nota ? ` · ${transaccion.nota}` : ''}`}
    left={(props) => <List.Icon {...props} icon="swap-horizontal" />}
    right={(props) => (
      <>
        {onEdit && <List.Icon {...props} icon="pencil" onPress={onEdit} />}
        {onDelete && <List.Icon {...props} icon="delete" onPress={onDelete} />}
      </>
    )}
    onPress={onPress}
  />
);
