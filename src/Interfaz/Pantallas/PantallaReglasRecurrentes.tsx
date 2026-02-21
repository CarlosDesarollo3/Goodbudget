import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Switch, Text, TextInput } from 'react-native-paper';
import { formatISO } from 'date-fns';
import { ReglaRecurrente } from '@/Dominio/Modelos';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { FormatearMoneda } from '@/Utilidades/Formatos';
import { EstadoVacioLista } from '@/Interfaz/Componentes/EstadoVacioLista';

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
    <ScrollView contentContainerStyle={styles.contenido}>
      <TextInput label="Cuenta origen" value={idCuentaOrigen} onChangeText={setIdCuentaOrigen} />
      <TextInput label="Cuenta destino" value={idCuentaDestino} onChangeText={setIdCuentaDestino} />
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

      {reglas.length === 0 ? (
        <EstadoVacioLista
          icono="calendar-sync"
          titulo="No tienes reglas recurrentes"
          descripcion="Automatiza transferencias mensuales para ahorrar tiempo y mantener tus cuentas al día."
          etiquetaCta="Crear primera regla"
          onPressCta={() =>
            CrearReglaRecurrente({
              habilitada: true,
              diaDelMes: Number(diaDelMes),
              idCuentaOrigen,
              idCuentaDestino,
              monto: Number(monto),
              proximaEjecucionEn: formatISO(new Date())
            })
          }
        />
      ) : (
        reglas.map((regla) => (
          <Card key={regla.id} mode="outlined">
            <Card.Title title={`Regla mensual día ${regla.diaDelMes}`} />
            <Card.Content>
              <Text>{`${regla.idCuentaOrigen} → ${regla.idCuentaDestino}`}</Text>
              <Text>Monto: {FormatearMoneda(regla.monto, moneda)}</Text>
              <Text>Próxima ejecución: {regla.proximaEjecucionEn.slice(0, 10)}</Text>
              <Switch value={regla.habilitada} />
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenido: {
    padding: 16,
    gap: 10
  }
});
