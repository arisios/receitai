import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // Validar API Key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chave da API OpenAI não configurada. Configure OPENAI_API_KEY nas variáveis de ambiente.',
        },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const { cardapio } = await request.json()

    // Validar entrada
    if (!cardapio || !cardapio.dias) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cardápio inválido fornecido',
        },
        { status: 400 }
      )
    }

    const prompt = `Com base no cardápio fornecido, crie uma lista de compras organizada por categorias.

CARDÁPIO:
${JSON.stringify(cardapio, null, 2)}

INSTRUÇÕES:
1. Agrupe todos os ingredientes por categoria (Frutas, Verduras, Proteínas, Grãos, Laticínios, etc.)
2. Consolide quantidades de ingredientes repetidos
3. Estime quantidades realistas para o período do cardápio
4. Organize de forma prática para compras no supermercado

Retorne APENAS um JSON válido no seguinte formato:
{
  "categorias": [
    {
      "categoria": "Frutas e Verduras",
      "itens": [
        {
          "item": "Tomate",
          "quantidade": "1kg"
        }
      ]
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em criar listas de compras organizadas. Sempre retorne JSON válido sem markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const responseText = completion.choices[0].message.content || '{}'
    
    // Limpar possíveis caracteres problemáticos
    const cleanedResponse = responseText
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .trim()

    let listaCompras
    try {
      listaCompras = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      
      // Tentar corrigir JSON
      const fixedResponse = cleanedResponse
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
      
      try {
        listaCompras = JSON.parse(fixedResponse)
      } catch (secondError) {
        throw new Error('Erro ao processar lista de compras. Tente novamente.')
      }
    }

    // Validar estrutura
    if (!listaCompras.categorias || !Array.isArray(listaCompras.categorias)) {
      throw new Error('Formato de lista de compras inválido')
    }

    return NextResponse.json({
      success: true,
      listaCompras,
    })

  } catch (error) {
    console.error('Erro ao gerar lista de compras:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar lista de compras. Tente novamente.',
      },
      { status: 500 }
    )
  }
}
