import { useState } from 'react'
import { FachadaPedidos } from '../patterns/FachadaPedidos.js'
import { AdapterPasarelaX } from '../services/pagos/AdapterPasarelaX.js'
import { AdapterPasarelaY } from '../services/pagos/AdapterPasarelaY.js'

/**
 * EJERCICIO 3 — MVVM: ViewModel
 */
export function usePedidosViewModel() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    cliente: '',
    direccion: '',
    itemsText: '',
    total: '',
    pasarela: 'X',
  })

  const setField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function enviarPedido(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const adapter = form.pasarela === 'X' ? new AdapterPasarelaX() : new AdapterPasarelaY()
      const facade = new FachadaPedidos(adapter)

      const pedido = {
        cliente: form.cliente,
        direccion: form.direccion,
        items: form.itemsText.split(',').map((s) => s.trim()).filter(Boolean),
        total: Number(form.total),
      }

      await facade.procesarPedido(pedido)

      setPedidos((prev) => [
        { ...pedido, pasarela: form.pasarela, procesadoEn: new Date().toLocaleTimeString() },
        ...prev,
      ])

      setForm({ cliente: '', direccion: '', itemsText: '', total: '', pasarela: 'X' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    pedidos,
    loading,
    error,
    form,
    setField,
    enviarPedido,
  }
}