
import { Resultado } from './IPago'; // Asegúrate de tener esta importación correcta según tu proyecto

export class AdapterPasarelaY {
  constructor(sdk) {
    this.sdk = sdk; // Asumiendo que el SDK se inyecta o se instancia aquí
  }

  async procesar(monto) {
    try {
      // 1. Convertir el monto (unidades) a centavos
      const centavos = Math.round(monto * 100);

      // 2. Llamar al sdk con los centavos y la moneda especificada
      const resultado = await this.sdk.charge(centavos, { currency: 'COP' });

      // 4. Si tiene éxito, devolver Resultado true con el ID de transacción
      return new Resultado(true, resultado.txId);
      
    } catch (error) {
      // 3. Si la llamada falla o se rechaza, devolver Resultado(false, null)
      return new Resultado(false, null);
    }
  }
}