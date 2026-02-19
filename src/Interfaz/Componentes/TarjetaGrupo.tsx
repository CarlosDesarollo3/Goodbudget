import React from 'react';
import { Avatar, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { FormatearMoneda } from '@/Utilidades/Formatos';

interface PropsTarjetaGrupo {
  nombre: string;
  total: number;
  moneda: string;
  expandido?: boolean;
  AlPresionar(): void;
  AlAlternarExpansion?(): void;
}

export const TarjetaGrupo = ({ nombre, total, moneda, expandido, AlPresionar, AlAlternarExpansion }: PropsTarjetaGrupo): React.JSX.Element => {
  const tema = useTheme();
  const colorTotal = total >= 0 ? '#1F8F4C' : '#C4362D';
  const iconoExpansion = expandido ? 'chevron-up' : 'chevron-down';
  const etiquetaExpansion = expandido ? 'Minimizar grupo' : 'Expandir grupo';

  return (
    <Card mode="contained" onPress={AlPresionar} style={{ borderRadius: 14, backgroundColor: '#E8EEF5' }}>
      <Card.Title
        title={nombre}
        titleVariant="titleMedium"
        left={(props) => (
          <>
            {AlAlternarExpansion ? (
              <IconButton icon={iconoExpansion} onPress={AlAlternarExpansion} accessibilityLabel={etiquetaExpansion} />
            ) : null}
          </>
        )}
        right={() => (
          <>
            <Text variant="titleSmall" style={{ color: colorTotal, marginRight: 4 }}>{FormatearMoneda(total, moneda)}</Text>
          </>
        )}
      />
    </Card>
  );
};
