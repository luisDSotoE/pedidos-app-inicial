// src/patterns/FachadaPedidos.js

import { inventario } from '../services/inventario.js';
import { envios } from '../services/envios.js';
import { notificaciones } from '../services/notificaciones.js';

export class FachadaPedidos {
  constructor(pagoAdapter) {
    // Se inyecta el Adapter (Pasarela X o Y) que cumple con la interfaz IPago
    this.pago = pagoAdapter;
  }

  async procesarPedido(pedido) {
    // 1. Reserve inventario
    await inventario.reservar(pedido.items);

    // 2. Procese el pago con el Adapter inyectado
    const resultado = await this.pago.procesar(pedido.total);

    // 3. Si el pago no tuvo éxito, lance un Error y NO continúe
    if (resultado.exito === false) {
      throw new Error('El pago fue rechazado. No se puede continuar con el pedido.');
    }

    // 4. Si el pago tuvo éxito, programe el envío y confirme la notificación
    await envios.programar(pedido);
    await notificaciones.confirmar(pedido.cliente); 
    
    return true; // Indicamos que todo el proceso finalizó con éxito
  }
}