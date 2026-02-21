import React from 'react';
import { View } from 'react-native';
import { IconButton, List, Text, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TipoTransaccion, Transaccion } from '@/Dominio/Modelos';
import { FormatearMoneda } from '@/Utilidades/Formatos';
import { TemaAplicacion } from '@/Interfaz/Tema/temaAplicacion';

interface PropsFilaTransaccion {
  transaccion: Transaccion;
  idCuentaContexto: string;
  moneda: string;
  onPress?: () => void;
  onDuplicar?: () => void;
}

export const FilaTransaccion = ({ transaccion, idCuentaContexto, moneda, onPress }: PropsFilaTransaccion): React.JSX.Element => {
  const tema = useTheme<TemaAplicacion>();
  const esTransferencia = transaccion.tipo === TipoTransaccion.TRANSFERENCIA;
  const esIngreso = transaccion.tipo === TipoTransaccion.INGRESO || (esTransferencia && transaccion.idCuentaDestino === idCuentaContexto);
  const esGasto = transaccion.tipo === TipoTransaccion.GASTO || (esTransferencia && transaccion.idCuentaOrigen === idCuentaContexto);

  const colorMonto = esIngreso ? tema.colors.exito : esGasto ? tema.colors.error : transaccion.monto >= 0 ? tema.colors.exito : tema.colors.error;
  const iconoTransaccion = esIngreso ? 'arrow-up-bold-circle' : esGasto ? 'arrow-down-bold-circle' : 'swap-horizontal';
  const colorIcono = esIngreso ? tema.colors.exito : esGasto ? tema.colors.error : tema.colors.onSurfaceVariant;

  return (
    <List.Item
      title={transaccion.tipo}
      description={`${format(new Date(transaccion.fecha), 'dd MMM yyyy', { locale: es })}${transaccion.nota ? ` · ${transaccion.nota}` : ''}`}
      left={(props) => <List.Icon {...props} icon={iconoTransaccion} color={colorIcono} />}
      right={() => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onDuplicar ? <IconButton icon="content-copy" size={18} onPress={onDuplicar} /> : null}
          <Text variant="titleSmall" style={{ color: colorMonto }}>
            {FormatearMoneda(transaccion.monto, moneda)}
          </Text>
        </View>
      )}
      onPress={onPress}
    />
  );
};
