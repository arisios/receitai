import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verificar se a API Key está configurada
    const hasApiKey = !!process.env.OPENAI_API_KEY
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        hasOpenAIKey: hasApiKey,
        nodeEnv: process.env.NODE_ENV,
      },
      apis: {
        analyzeImage: '/api/analyze-image',
        generateRecipes: '/api/generate-recipes',
        generateCardapio: '/api/generate-cardapio',
        generateListaCompras: '/api/generate-lista-compras',
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
