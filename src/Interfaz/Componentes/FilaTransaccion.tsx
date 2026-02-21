import React from 'react';
import { List, Text } from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TipoTransaccion, Transaccion } from '@/Dominio/Modelos';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsFilaTransaccion {
  transaccion: Transaccion;
  idCuentaContexto: string;
  moneda: string;
  onPress?: () => void;
}

export const FilaTransaccion = ({ transaccion, idCuentaContexto, moneda, onPress }: PropsFilaTransaccion): React.JSX.Element => {
  const esTransferencia = transaccion.tipo === TipoTransaccion.TRANSFERENCIA;
  const esIngreso = transaccion.tipo === TipoTransaccion.INGRESO || (esTransferencia && transaccion.idCuentaDestino === idCuentaContexto);
  const esGasto = transaccion.tipo === TipoTransaccion.GASTO || (esTransferencia && transaccion.idCuentaOrigen === idCuentaContexto);

  const colorMonto = esIngreso ? '#1F8F4C' : esGasto ? '#C4362D' : transaccion.monto >= 0 ? '#1F8F4C' : '#C4362D';

  return (
    <List.Item
      title={transaccion.tipo}
      description={`${format(new Date(transaccion.fecha), 'dd MMM yyyy', { locale: es })}${transaccion.nota ? ` · ${transaccion.nota}` : ''}`}
      left={(props) => <List.Icon {...props} icon="swap-horizontal" />}
      right={() => (
        <Text variant="titleSmall" style={{ color: colorMonto }}>
          {FormatearMoneda(transaccion.monto, moneda)}
        </Text>
      )}
      onPress={onPress}
    />
  );
};
