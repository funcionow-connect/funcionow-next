import { describe, it, expect } from 'vitest'

describe('Testes Básicos', () => {
  it('deve somar dois números corretamente', () => {
    expect(1 + 1).toBe(2)
  })

  it('deve validar email básico', () => {
    const validarEmail = (email: string) => {
      return email.includes('@')
    }
    expect(validarEmail('teste@example.com')).toBe(true)
    expect(validarEmail('teste')).toBe(false)
  })

  it('deve fazer parse de JSON', () => {
    const json = '{"nome": "Usuario", "ativo": true}'
    const obj = JSON.parse(json)
    expect(obj.nome).toBe('Usuario')
    expect(obj.ativo).toBe(true)
  })
})
