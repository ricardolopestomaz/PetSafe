import {
  atualizarPet,
  criarPet,
  CriarPetPayload,
  deletarPet,
  listarMeusPets,
  Pet,
} from '@/services/pets'
import { useCallback, useEffect, useState } from 'react'

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarMeusPets()
      setPets(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    Promise.resolve().then(() => {
      if (mounted) carregar()
    })
    return () => { mounted = false }
  }, [carregar])

  const adicionar = async (pet: CriarPetPayload) => {
    const novo = await criarPet(pet)
    setPets((prev) => [...prev, novo])
    return novo
  }

  const atualizar = async (id: string, campos: Partial<Pet>) => {
    const atualizado = await atualizarPet(id, campos)
    setPets((prev) => prev.map((p) => (p.id === id ? atualizado : p)))
    return atualizado
  }

  const remover = async (id: string) => {
    await deletarPet(id)
    setPets((prev) => prev.filter((p) => p.id !== id))
  }

  return { pets, loading, error, recarregar: carregar, adicionar, atualizar, remover }
}