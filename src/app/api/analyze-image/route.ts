import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Imagem não fornecida' },
        { status: 400 }
      )
    }

    // Validar formato da imagem
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Formato de imagem inválido. Use uma imagem em base64.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Chave da API OpenAI não configurada. Configure OPENAI_API_KEY nas variáveis de ambiente.' 
        },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    console.log('Iniciando análise de imagem com OpenAI Vision...')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em identificar ingredientes em imagens de alimentos. Analise a imagem e liste APENAS os ingredientes visíveis de forma clara e objetiva. Retorne sempre um JSON válido com a lista de ingredientes em português.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Identifique todos os ingredientes alimentícios visíveis nesta imagem. Liste apenas os nomes dos ingredientes em português, sem quantidades, sem descrições extras. Se não houver ingredientes visíveis, retorne uma lista vazia. Retorne no formato JSON: {"ingredientes": ["ingrediente1", "ingrediente2", ...]}'
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'low' // Usar 'low' para processar mais rápido e economizar tokens
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    console.log('Resposta recebida da OpenAI')

    const content = response.choices[0]?.message?.content || '{}'
    
    let data: { ingredientes?: string[] }
    try {
      data = JSON.parse(content)
      console.log('Ingredientes detectados:', data.ingredientes)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      console.error('Conteúdo recebido:', content)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao processar a análise da imagem. Tente novamente.' 
        },
        { status: 500 }
      )
    }

    if (!data.ingredientes || !Array.isArray(data.ingredientes) || data.ingredientes.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não foi possível identificar ingredientes na imagem. Certifique-se de que a foto contém alimentos visíveis e tente novamente com melhor iluminação.' 
        },
        { status: 400 }
      )
    }

    // Limpar e validar ingredientes
    const ingredientesLimpos = data.ingredientes
      .filter(ing => ing && typeof ing === 'string' && ing.trim().length > 0)
      .map(ing => ing.trim())
      .slice(0, 20) // Limitar a 20 ingredientes para evitar listas muito longas

    if (ingredientesLimpos.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não foi possível identificar ingredientes válidos na imagem.' 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      ingredientes: ingredientesLimpos,
    })

  } catch (error: any) {
    console.error('Erro ao analisar imagem:', error)
    
    // Tratamento específico de erros da OpenAI
    if (error?.status === 401) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Chave da API OpenAI inválida. Verifique suas credenciais.' 
        },
        { status: 500 }
      )
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Limite de requisições atingido. Aguarde alguns instantes e tente novamente.' 
        },
        { status: 429 }
      )
    }

    if (error?.code === 'invalid_image_url') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Imagem inválida ou muito grande. Tente com uma imagem menor (máx 4MB).' 
        },
        { status: 400 }
      )
    }
    
    const errorMessage = error?.message || 'Erro ao analisar imagem. Tente novamente.'
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
