import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Modal, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { formatISO } from 'date-fns';
import { ReglaRecurrente } from '@/Dominio/Modelos';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { FormatearMoneda } from '@/Utilidades/Formatos';

export const PantallaReglasRecurrentes = (): React.JSX.Element => {
  const {
    reglas,
    moneda,
    cuentasPorGrupo,
    CrearReglaRecurrente,
    ActualizarReglaRecurrente,
    EliminarReglaRecurrente
  } = UsarAlmacenAplicacion();
  const [idCuentaOrigen, setIdCuentaOrigen] = useState('');
  const [idCuentaDestino, setIdCuentaDestino] = useState('');
  const [diaDelMes, setDiaDelMes] = useState('1');
  const [monto, setMonto] = useState('0');
  const [idReglaEnEdicion, setIdReglaEnEdicion] = useState<string | null>(null);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [selectorAbierto, setSelectorAbierto] = useState<'origen' | 'destino' | null>(null);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');

  const cuentas = useMemo(() => Object.values(cuentasPorGrupo).flat(), [cuentasPorGrupo]);
  const cuentasPorId = useMemo(() => new Map(cuentas.map((cuenta) => [cuenta.id, cuenta.nombre])), [cuentas]);

  const cuentasFiltradas = useMemo(
    () => cuentas.filter((cuenta) => cuenta.nombre.toLowerCase().includes(busquedaCuenta.toLowerCase())),
    [cuentas, busquedaCuenta]
  );

  const cuentasDisponiblesSelector = useMemo(() => {
    if (selectorAbierto === 'origen') {
      return cuentasFiltradas.filter((cuenta) => cuenta.id !== idCuentaDestino);
    }

    if (selectorAbierto === 'destino') {
      return cuentasFiltradas.filter((cuenta) => cuenta.id !== idCuentaOrigen);
    }

    return cuentasFiltradas;
  }, [cuentasFiltradas, selectorAbierto, idCuentaDestino, idCuentaOrigen]);

  const LimpiarFormulario = (): void => {
    setIdCuentaOrigen('');
    setIdCuentaDestino('');
    setDiaDelMes('1');
    setMonto('0');
    setIdReglaEnEdicion(null);
    setErrorFormulario('');
  };

  const CargarReglaEnFormulario = (regla: ReglaRecurrente): void => {
    setIdReglaEnEdicion(regla.id);
    setIdCuentaOrigen(regla.idCuentaOrigen);
    setIdCuentaDestino(regla.idCuentaDestino);
    setDiaDelMes(String(regla.diaDelMes));
    setMonto(String(regla.monto));
    setErrorFormulario('');
  };

  const GuardarRegla = (): void => {
    if (!idCuentaOrigen || !idCuentaDestino) {
      setErrorFormulario('Selecciona una cuenta de origen y una de destino.');
      return;
    }

    if (idCuentaOrigen === idCuentaDestino) {
      setErrorFormulario('La cuenta origen y destino deben ser distintas.');
      return;
    }

    const dia = Number(diaDelMes);
    const montoNumerico = Number(monto);

    if (!Number.isFinite(dia) || dia < 1 || dia > 31) {
      setErrorFormulario('El día del mes debe estar entre 1 y 31.');
      return;
    }

    if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
      setErrorFormulario('Ingresa un monto válido mayor a cero.');
      return;
    }

    if (idReglaEnEdicion) {
      const reglaActual = reglas.find((regla) => regla.id === idReglaEnEdicion);
      if (!reglaActual) {
        setErrorFormulario('No se pudo actualizar la regla seleccionada.');
        return;
      }

      ActualizarReglaRecurrente({
        ...reglaActual,
        diaDelMes: dia,
        idCuentaOrigen,
        idCuentaDestino,
        monto: montoNumerico
      });
    } else {
      CrearReglaRecurrente({
        habilitada: true,
        diaDelMes: dia,
        idCuentaOrigen,
        idCuentaDestino,
        monto: montoNumerico,
        proximaEjecucionEn: formatISO(new Date())
      });
    }

    LimpiarFormulario();
  };

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <View style={styles.filaSelector}>
        <Text variant="labelLarge">Cuenta origen</Text>
        <Pressable style={styles.tarjetaCuenta} onPress={() => setSelectorAbierto('origen')}>
          <Text variant="titleMedium">{cuentasPorId.get(idCuentaOrigen) ?? 'Seleccionar cuenta'}</Text>
        </Pressable>
      </View>
      <View style={styles.filaSelector}>
        <Text variant="labelLarge">Cuenta destino</Text>
        <Pressable style={styles.tarjetaCuenta} onPress={() => setSelectorAbierto('destino')}>
          <Text variant="titleMedium">{cuentasPorId.get(idCuentaDestino) ?? 'Seleccionar cuenta'}</Text>
        </Pressable>
      </View>
      <TextInput label="Día del mes" value={diaDelMes} onChangeText={setDiaDelMes} keyboardType="number-pad" />
      <TextInput label="Monto" value={monto} onChangeText={setMonto} keyboardType="decimal-pad" />
      <Button mode="contained" onPress={GuardarRegla}>
        {idReglaEnEdicion ? 'Actualizar regla' : 'Crear regla'}
      </Button>
      {idReglaEnEdicion ? (
        <Button mode="text" onPress={LimpiarFormulario}>
          Cancelar edición
        </Button>
      ) : null}
      <HelperText type="error" visible={!!errorFormulario}>{errorFormulario}</HelperText>

      {reglas.map((regla) => (
        <Card key={regla.id} mode="outlined">
          <Card.Title title={`Regla mensual día ${regla.diaDelMes}`} />
          <Card.Content>
            <Text>{`${cuentasPorId.get(regla.idCuentaOrigen) ?? regla.idCuentaOrigen} → ${cuentasPorId.get(regla.idCuentaDestino) ?? regla.idCuentaDestino}`}</Text>
            <Text>Monto: {FormatearMoneda(regla.monto, moneda)}</Text>
            <Text>Próxima ejecución: {regla.proximaEjecucionEn.slice(0, 10)}</Text>
            <View style={styles.filaAccionesRegla}>
              <Text>Habilitada</Text>
              <Switch
                value={regla.habilitada}
                onValueChange={(habilitada) => ActualizarReglaRecurrente({ ...regla, habilitada })}
              />
            </View>
            <View style={styles.filaBotonesRegla}>
              <Button mode="text" compact onPress={() => CargarReglaEnFormulario(regla)}>Editar</Button>
              <Button mode="text" compact textColor="#C4362D" onPress={() => EliminarReglaRecurrente(regla.id)}>Eliminar</Button>
            </View>
          </Card.Content>
        </Card>
      ))}

      <Portal>
        <Modal visible={selectorAbierto !== null} onDismiss={() => setSelectorAbierto(null)} contentContainerStyle={styles.modalCuentas}>
          <Text variant="titleMedium">
            {selectorAbierto === 'origen' ? 'Seleccionar cuenta origen' : 'Seleccionar cuenta destino'}
          </Text>
          <TextInput
            mode="outlined"
            label="Buscar cuenta"
            value={busquedaCuenta}
            onChangeText={setBusquedaCuenta}
          />
          <ScrollView style={styles.listaCuentasModal} keyboardShouldPersistTaps="handled">
            {cuentasDisponiblesSelector.map((cuenta) => (
              <Pressable
                key={cuenta.id}
                style={styles.itemCuentaModal}
                onPress={() => {
                  if (selectorAbierto === 'origen') {
                    setIdCuentaOrigen(cuenta.id);
                  }
                  if (selectorAbierto === 'destino') {
                    setIdCuentaDestino(cuenta.id);
                  }
                  setSelectorAbierto(null);
                }}
              >
                <Text variant="bodyLarge">{cuenta.nombre}</Text>
              </Pressable>
            ))}
            {cuentasDisponiblesSelector.length === 0 ? <HelperText type="info">No hay cuentas disponibles</HelperText> : null}
          </ScrollView>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    padding: 16,
    gap: 8
  },
  filaSelector: {
    gap: 4
  },
  tarjetaCuenta: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#EEF3FF',
    borderWidth: 1,
    borderColor: '#CDD9FF'
  },
  filaAccionesRegla: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  filaBotonesRegla: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4
  },
  modalCuentas: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    gap: 6,
    minHeight: '65%',
    maxHeight: '94%'
  },
  listaCuentasModal: {
    flexGrow: 1
  },
  itemCuentaModal: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC'
  }
});
