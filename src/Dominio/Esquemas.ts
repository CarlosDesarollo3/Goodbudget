import { z } from 'zod';
import { TipoTransaccion } from './Modelos';

export const EsquemaMonto = z.number().positive('El monto debe ser mayor a cero');

export const EsquemaTransaccionFormulario = z
  .object({
    tipo: z.nativeEnum(TipoTransaccion),
    monto: EsquemaMonto,
    idCuentaOrigen: z.string().optional(),
    idCuentaDestino: z.string().optional(),
    idCategoria: z.string().optional(),
    nota: z.string().max(200).optional(),
    fecha: z.string().min(1, 'La fecha es obligatoria')
  })
  .superRefine((valor, contexto) => {
    if ((valor.tipo === TipoTransaccion.GASTO || valor.tipo === TipoTransaccion.INGRESO) && !valor.idCuentaOrigen) {
      contexto.addIssue({ code: z.ZodIssueCode.custom, message: 'Debe indicar la cuenta origen' });
    }

    if (valor.tipo === TipoTransaccion.AJUSTE && !valor.idCuentaDestino) {
      contexto.addIssue({ code: z.ZodIssueCode.custom, message: 'Debe indicar la cuenta destino del ajuste' });
    }

    if (valor.tipo === TipoTransaccion.TRANSFERENCIA) {
      if (!valor.idCuentaOrigen || !valor.idCuentaDestino) {
        contexto.addIssue({ code: z.ZodIssueCode.custom, message: 'Debe indicar cuenta origen y destino' });
      }
      if (valor.idCuentaOrigen && valor.idCuentaOrigen === valor.idCuentaDestino) {
        contexto.addIssue({ code: z.ZodIssueCode.custom, message: 'Las cuentas deben ser diferentes' });
      }
    }

    if ((valor.tipo === TipoTransaccion.GASTO || valor.tipo === TipoTransaccion.INGRESO) && !valor.idCategoria) {
      contexto.addIssue({ code: z.ZodIssueCode.custom, message: 'Debe seleccionar una categoría' });
    }
  });

export const EsquemaCategoria = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio'),
  color: z.string().optional(),
  icono: z.string().optional()
});

export const EsquemaReglaRecurrente = z.object({
  diaDelMes: z.number().min(1).max(31),
  idCuentaOrigen: z.string().min(1),
  idCuentaDestino: z.string().min(1),
  monto: EsquemaMonto
});
