import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, IconButton, List, Portal, Text, TextInput } from 'react-native-paper';
import { Categoria } from '@/Dominio/Modelos';
import { EsquemaCategoria } from '@/Dominio/Esquemas';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';

type ModoFormulario = 'crear' | 'editar';

interface FormularioCategoria {
  nombre: string;
  color: string;
  icono: string;
}

const COLOR_CATEGORIA_DEFAULT = '#D1C4E9';
const ICONO_CATEGORIA_DEFAULT = 'tag';

const ObtenerFormularioVacio = (): FormularioCategoria => ({
  nombre: '',
  color: COLOR_CATEGORIA_DEFAULT,
  icono: ICONO_CATEGORIA_DEFAULT
});

export const PantallaCategorias = (): React.JSX.Element => {
  const { categorias, CrearCategoria, ActualizarCategoria, EliminarCategoria } = UsarAlmacenAplicacion();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoFormulario, setModoFormulario] = useState<ModoFormulario>('crear');
  const [categoriaEditar, setCategoriaEditar] = useState<Categoria | null>(null);
  const [errores, setErrores] = useState<Partial<Record<keyof FormularioCategoria, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioCategoria>(ObtenerFormularioVacio());

  const nombreNormalizado = useMemo(() => formulario.nombre.trim().toLowerCase(), [formulario.nombre]);

  const limpiarYCerrarModal = (): void => {
    setMostrarModal(false);
    setModoFormulario('crear');
    setCategoriaEditar(null);
    setErrores({});
    setErrorGeneral(null);
    setFormulario(ObtenerFormularioVacio());
  };

  const abrirCrear = (): void => {
    setModoFormulario('crear');
    setCategoriaEditar(null);
    setErrores({});
    setErrorGeneral(null);
    setFormulario(ObtenerFormularioVacio());
    setMostrarModal(true);
  };

  const abrirEditar = (categoria: Categoria): void => {
    setModoFormulario('editar');
    setCategoriaEditar(categoria);
    setErrores({});
    setErrorGeneral(null);
    setFormulario({
      nombre: categoria.nombre,
      color: categoria.color ?? COLOR_CATEGORIA_DEFAULT,
      icono: categoria.icono ?? ICONO_CATEGORIA_DEFAULT
    });
    setMostrarModal(true);
  };

  const guardarCategoria = (): void => {
    const resultado = EsquemaCategoria.safeParse({
      nombre: formulario.nombre.trim(),
      color: formulario.color.trim() || undefined,
      icono: formulario.icono.trim() || undefined
    });

    if (!resultado.success) {
      const erroresNuevos: Partial<Record<keyof FormularioCategoria, string>> = {};
      resultado.error.issues.forEach((issue) => {
        const campo = issue.path[0] as keyof FormularioCategoria | undefined;
        if (campo) {
          erroresNuevos[campo] = issue.message;
        }
      });
      setErrores(erroresNuevos);
      return;
    }

    const hayDuplicado = categorias.some(
      (categoria) =>
        categoria.nombre.trim().toLowerCase() === nombreNormalizado && categoria.id !== (categoriaEditar?.id ?? '')
    );

    if (hayDuplicado) {
      setErrores((previo) => ({ ...previo, nombre: 'Ya existe una categoría con ese nombre' }));
      return;
    }

    try {
      if (modoFormulario === 'crear') {
        CrearCategoria(resultado.data.nombre, resultado.data.color, resultado.data.icono);
      } else if (categoriaEditar) {
        ActualizarCategoria(categoriaEditar.id, resultado.data.nombre, resultado.data.color, resultado.data.icono);
      }
      limpiarYCerrarModal();
    } catch (error) {
      const mensajeError = error instanceof Error ? error.message : 'No se pudo guardar la categoría';
      setErrorGeneral(mensajeError);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.contenedor}>
        <Button mode="contained" onPress={abrirCrear} style={styles.botonNuevaCategoria}>
          Nueva categoría
        </Button>

        {categorias.map((categoria) => (
          <List.Item
            key={categoria.id}
            title={categoria.nombre}
            description={`Icono: ${categoria.icono ?? ICONO_CATEGORIA_DEFAULT}`}
            left={() => (
              <View style={[styles.indicadorColor, { backgroundColor: categoria.color ?? COLOR_CATEGORIA_DEFAULT }]}>
                <List.Icon icon={categoria.icono ?? ICONO_CATEGORIA_DEFAULT} color="#1D1B20" />
              </View>
            )}
            right={() => (
              <View style={styles.accionesItem}>
                <IconButton icon="pencil" onPress={() => abrirEditar(categoria)} accessibilityLabel="Editar categoría" />
                <IconButton icon="delete" onPress={() => EliminarCategoria(categoria.id)} accessibilityLabel="Eliminar categoría" />
              </View>
            )}
            style={styles.itemCategoria}
          />
        ))}
      </ScrollView>

      <Portal>
        <Dialog visible={mostrarModal} onDismiss={limpiarYCerrarModal}>
          <Dialog.Title>{modoFormulario === 'crear' ? 'Nueva categoría' : 'Editar categoría'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre"
              value={formulario.nombre}
              onChangeText={(valor) => setFormulario((previo) => ({ ...previo, nombre: valor }))}
            />
            <HelperText type="error" visible={Boolean(errores.nombre)}>
              {errores.nombre}
            </HelperText>

            <TextInput
              label="Color"
              placeholder="#D1C4E9"
              value={formulario.color}
              onChangeText={(valor) => setFormulario((previo) => ({ ...previo, color: valor }))}
            />
            <HelperText type="error" visible={Boolean(errores.color)}>
              {errores.color}
            </HelperText>

            <TextInput
              label="Ícono"
              placeholder="tag"
              value={formulario.icono}
              onChangeText={(valor) => setFormulario((previo) => ({ ...previo, icono: valor }))}
            />
            <HelperText type="error" visible={Boolean(errores.icono)}>
              {errores.icono}
            </HelperText>

            {errorGeneral ? <Text style={styles.errorGeneral}>{errorGeneral}</Text> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={limpiarYCerrarModal}>Cancelar</Button>
            <Button mode="contained" onPress={guardarCategoria}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    padding: 16,
    gap: 12
  },
  botonNuevaCategoria: {
    marginBottom: 8
  },
  itemCategoria: {
    borderRadius: 12,
    backgroundColor: '#F7F2FA'
  },
  accionesItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  indicadorColor: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 8
  },
  errorGeneral: {
    color: '#B3261E',
    marginTop: 8
  }
});
