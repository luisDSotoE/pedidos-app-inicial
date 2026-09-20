function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Reintenta la ejecución de una función asíncrona ante fallas,
 * aplicando un tiempo de espera creciente (backoff) entre cada intento.
 *
 * @param {Function} fn - Función asíncrona a ejecutar.
 * @param {Object} options - Opciones de configuración.
 * @param {number} [options.intentos=3] - Número máximo de intentos.
 * @param {number} [options.esperaMs=300] - Tiempo base de espera en ms.
 * @returns {Promise<any>} Resultado de la función ejecutada con éxito.
 */
export async function retry(fn, { intentos = 3, esperaMs = 300 } = {}) {
  let ultimoError

  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await fn()
    } catch (error) {
      ultimoError = error

      // Si ya alcanzamos el número máximo de intentos, no esperamos más
      if (intento === intentos) {
        break
      }

      // Backoff creciente: incrementa la espera en cada reintento
      // (Intento 1 falla -> espera base * 1; Intento 2 falla -> espera base * 2, etc.)
      const tiempoEspera = esperaMs * intento
      await delay(tiempoEspera)
    }
  }

  throw ultimoError
}