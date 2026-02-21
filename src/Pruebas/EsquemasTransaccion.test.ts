import { EsquemaTransaccionFormulario } from '@/Dominio/Esquemas';
import { TipoTransaccion } from '@/Dominio/Modelos';

describe('EsquemaTransaccionFormulario', () => {
  const fecha = '2024-01-01T00:00:00.000Z';

  it('rechaza gasto sin categoría', () => {
    const resultado = EsquemaTransaccionFormulario.safeParse({
      tipo: TipoTransaccion.GASTO,
      monto: 100,
      idCuentaOrigen: 'cuenta-1',
      fecha
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.flatten().fieldErrors.idCategoria?.[0]).toBe('Debe seleccionar una categoría');
    }
  });

  it('acepta ingreso con categoría', () => {
    const resultado = EsquemaTransaccionFormulario.safeParse({
      tipo: TipoTransaccion.INGRESO,
      monto: 100,
      idCuentaOrigen: 'cuenta-1',
      idCategoria: 'categoria-1',
      fecha
    });

    expect(resultado.success).toBe(true);
  });
});
