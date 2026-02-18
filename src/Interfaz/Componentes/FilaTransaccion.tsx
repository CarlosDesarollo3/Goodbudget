import React from 'react';
import { List } from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaccion } from '@/Dominio/Modelos';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsFilaTransaccion {
  transaccion: Transaccion;
  moneda: string;
}

export const FilaTransaccion = ({ transaccion, moneda }: PropsFilaTransaccion): React.JSX.Element => (
  <List.Item
    title={`${transaccion.tipo} · ${FormatearMoneda(transaccion.monto, moneda)}`}
    description={`${format(new Date(transaccion.fecha), 'dd MMM yyyy', { locale: es })}${transaccion.nota ? ` · ${transaccion.nota}` : ''}`}
    left={(props) => <List.Icon {...props} icon="swap-horizontal" />}
  />
);
