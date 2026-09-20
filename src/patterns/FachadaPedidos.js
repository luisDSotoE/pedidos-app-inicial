import { inventario } from '../services/inventario.js'
import { envios } from '../services/envios.js'
import { notificaciones } from '../services/notificaciones.js'
import { retry } from './retry.js'
import { CircuitBreaker } from './CircuitBreaker.js'

// Instancia global del CircuitBreaker para conservar el estado (CERRADO, ABIERTO, SEMI-ABIERTO)
// a lo largo de múltiples pedidos.
const breakerInventario = new CircuitBreaker(
  async (items) => {
    // Retry reintentará reservar hasta 3 veces con backoff creciente antes de dar por fallada la operación
    return await retry(() => inventario.reservar(items), {
      intentos: 3,
      esperaMs: 300,
    })
  },
  {
    umbralErrores: 3,        // Tras 3 fallos consecutivos desprotegidos por retry, abre el circuito
    tiempoReintentoMs: 5000, // Duración del estado ABIERTO (5s) antes de pasar a SEMI-ABIERTO
  }
)

export class FachadaPedidos {
  constructor(pagoAdapter) {
    // Se inyecta el Adapter (Pasarela X o Y) que cumple con la interfaz IPago
    this.pago = pagoAdapter
  }

  async procesarPedido(pedido) {
    // 1. Reservar inventario protegido con Circuit Breaker + Retry
    try {
      await breakerInventario.ejecutar(pedido.items)
    } catch (err) {
      // Si el circuito está ABIERTO o fallaron todos los reintentos
      if (breakerInventario.estado === 'ABIERTO') {
        throw new Error('Inventario no disponible, intenta más tarde.')
      }
      throw err
    }

    // 2. Procesar el pago con el Adapter inyectado
    const resultado = await this.pago.procesar(pedido.total)

    // 3. Si el pago no tuvo éxito, lanzar Error y NO continuar
    if (resultado.exito === false) {
      throw new Error('El pago fue rechazado. No se puede continuar con el pedido.')
    }

    // 4. Si el pago tuvo éxito, programar envío y confirmar notificación
    await envios.programar(pedido)
    await notificaciones.confirmar(pedido.cliente)

    return true
  }
}