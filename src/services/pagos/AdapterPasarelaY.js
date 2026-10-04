import { Resultado } from './IPago.js'
import { SdkPasarelaY } from './SdkPasarelaY.js'

export class AdapterPasarelaY {
  constructor(sdk = new SdkPasarelaY()) {
    this.sdk = sdk
  }

  async procesar(monto) {
    try {
      // 1 y 2. Convertir a centavos y llamar a charge(amountCents, opts)
      const centavos = Math.round(monto * 100)
      const respuesta = await this.sdk.charge(centavos, { currency: 'COP' })
      
      // 4. Si tiene éxito, devolver Resultado(true, txId)
      return new Resultado(true, respuesta.txId)
    } catch (error) {
      // 3. Si la llamada falla / rechaza la promesa, devolver Resultado(false, null)
      return new Resultado(false, null)
    }
  }
}