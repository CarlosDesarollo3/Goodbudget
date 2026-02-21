import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { ChipCategoria } from '@/Interfaz/Componentes/ChipCategoria';
import { UsarAlmacenAplicacion } from '@/Estado/AlmacenAplicacion';
import { EstadoVacioLista } from '@/Interfaz/Componentes/EstadoVacioLista';

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
    <ScrollView contentContainerStyle={styles.contenido}>
      <TextInput label="Nueva categoría" value={nombreCategoria} onChangeText={setNombreCategoria} />
      <Button mode="contained" style={styles.boton} onPress={() => { CrearCategoria(nombreCategoria, '#D1C4E9'); setNombreCategoria(''); }}>
        Guardar categoría
      </Button>
      {categorias.length === 0 ? (
        <EstadoVacioLista
          icono="shape-outline"
          titulo="Aún no hay categorías"
          descripcion="Crea categorías para clasificar gastos e ingresos y entender mejor en qué se mueve tu dinero."
          etiquetaCta="Añadir categoría"
          onPressCta={() => {
            CrearCategoria(nombreCategoria.trim() || 'General', '#D1C4E9');
            setNombreCategoria('');
          }}
        />
      ) : (
        categorias.map((categoria) => (
          <ChipCategoria key={categoria.id} nombre={categoria.nombre} color={categoria.color} />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenido: {
    padding: 16,
    gap: 10
  },
  boton: {
    marginTop: 4
  }
});
