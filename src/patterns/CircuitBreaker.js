/**
 * Posibles estados del Circuit Breaker
 */
export const ESTADOS = {
  CERRADO: 'CERRADO',
  ABIERTO: 'ABIERTO',
  SEMI_ABIERTO: 'SEMI-ABIERTO',
}

export class CircuitBreaker {
  /**
   * @param {Function} fn - Función asíncrona a envolver.
   * @param {Object} options
   * @param {number} [options.umbralErrores=3] - Fallos consecutivos necesarios para abrir el circuito.
   * @param {number} [options.tiempoReintentoMs=5000] - Tiempo en ms que dura abierto antes de probar la conexión.
   */
  constructor(fn, { umbralErrores = 3, tiempoReintentoMs = 5000 } = {}) {
    this.fn = fn
    this.umbralErrores = umbralErrores
    this.tiempoReintentoMs = tiempoReintentoMs

    this.estado = ESTADOS.CERRADO
    this.fallosConsecutivos = 0
    this.ultimoFalloTimestamp = null
  }

  async ejecutar(...args) {
    // Si el circuito está ABIERTO, verificamos si ya expiró el tiempo de espera
    if (this.estado === ESTADOS.ABIERTO) {
      const tiempoTranscurrido = Date.now() - this.ultimoFalloTimestamp

      if (tiempoTranscurrido >= this.tiempoReintentoMs) {
        // Pasa a SEMI-ABIERTO para permitir una llamada de prueba
        this.estado = ESTADOS.SEMI_ABIERTO
      } else {
        // Fail-Fast: rechaza de inmediato sin ejecutar la función
        throw new Error('Circuito ABIERTO: el servicio no está disponible temporalmente')
      }
    }

    try {
      const resultado = await this.fn(...args)
      this.alExito()
      return resultado
    } catch (error) {
      this.alFallo()
      throw error
    }
  }

  alExito() {
    // Si la llamada tuvo éxito (estando CERRADO o SEMI-ABIERTO), el circuito vuelve a CERRADO
    this.fallosConsecutivos = 0
    this.estado = ESTADOS.CERRADO
  }

  alFallo() {
    this.fallosConsecutivos++

    // Si falla en SEMI-ABIERTO o supera el umbral de errores en CERRADO, se ABRE el circuito
    if (this.estado === ESTADOS.SEMI_ABIERTO || this.fallosConsecutivos >= this.umbralErrores) {
      this.estado = ESTADOS.ABIERTO
      this.ultimoFalloTimestamp = Date.now()
    }
  }
}