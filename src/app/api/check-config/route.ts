import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verificar se a chave da API OpenAI está configurada
    const apiKey = process.env.OPENAI_API_KEY
    
    const configured = !!(apiKey && apiKey.trim() !== '')
    
    return NextResponse.json({
      configured,
      message: configured 
        ? 'API configurada corretamente' 
        : 'Chave da API OpenAI não encontrada'
    })
    
  } catch (error) {
    console.error('Erro ao verificar configuração:', error)
    
    return NextResponse.json(
      { 
        configured: false,
        message: 'Erro ao verificar configuração'
      },
      { status: 500 }
    )
  }
}
