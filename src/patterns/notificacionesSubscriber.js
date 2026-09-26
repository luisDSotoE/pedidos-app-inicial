import * as notificaciones from '../services/notificaciones.js'

const EVENTO_PEDIDO_ENVIADO = 'pedido-enviado'

export function registrarNotificacionesSubscriber() {

  window.addEventListener(EVENTO_PEDIDO_ENVIADO, async (event) => {

    const { cliente } = event.detail

    try {

      await notificaciones.confirmar(cliente)

    } catch (error) {

      console.error(
        'Error al enviar la notificación:',
        error
      )

    }

  })

}