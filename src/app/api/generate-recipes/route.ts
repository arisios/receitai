import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface Filters {
  vegetariano?: boolean
  vegano?: boolean
  semGluten?: boolean
  semLactose?: boolean
  lowCarb?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { ingredientes, filtros } = await request.json()

    if (!ingredientes || ingredientes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ingredientes não fornecidos' },
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

    // Construir restrições baseadas nos filtros
    const restricoes: string[] = []
    if (filtros?.vegetariano) restricoes.push('vegetariana')
    if (filtros?.vegano) restricoes.push('vegana')
    if (filtros?.semGluten) restricoes.push('sem glúten')
    if (filtros?.semLactose) restricoes.push('sem lactose')
    if (filtros?.lowCarb) restricoes.push('low carb')

    const restricoesTexto = restricoes.length > 0 
      ? `\n\nRESTRIÇÕES ALIMENTARES: As receitas DEVEM ser ${restricoes.join(', ')}.`
      : ''

    const prompt = `Você é um chef especialista. Com base nos seguintes ingredientes: ${ingredientes.join(', ')}, sugira EXATAMENTE 25 receitas deliciosas, variadas e práticas.${restricoesTexto}

Para cada receita, forneça:
- nome: nome atrativo e único da receita
- calorias: valor aproximado em kcal (número inteiro, varie entre 200-800)
- tempo_preparo_minutos: tempo total em minutos (número inteiro, varie entre 15-120)
- video_tutorial: URL real do YouTube no formato "https://www.youtube.com/watch?v=CODIGO" (use códigos variados e reais de receitas brasileiras)
- ingredientes: lista com os ingredientes e quantidades específicas
- instrucoes: passo a passo detalhado e claro do preparo
- proteinas: gramas de proteína (número inteiro)
- carboidratos: gramas de carboidratos (número inteiro)
- gorduras: gramas de gordura (número inteiro)
- dificuldade: "Fácil", "Média" ou "Difícil"
- porcoes: número de porções (número inteiro entre 2-6)

IMPORTANTE: 
- Crie EXATAMENTE 25 receitas diferentes e criativas
- Use TODOS os ingredientes fornecidos nas receitas
- Varie os tipos de pratos: entradas, pratos principais, sobremesas, lanches, saladas
- Varie calorias e tempo de preparo para dar opções diversas
- Para video_tutorial, use URLs reais do YouTube (pesquise mentalmente por receitas brasileiras populares)
- Retorne APENAS um JSON válido no formato abaixo, sem texto adicional:

{
  "receitas_sugeridas": [
    {
      "nome": "Nome da Receita",
      "calorias": 450,
      "tempo_preparo_minutos": 30,
      "video_tutorial": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "ingredientes": ["ingrediente 1 - 200g", "ingrediente 2 - 1 xícara"],
      "instrucoes": "Passo a passo detalhado...",
      "proteinas": 25,
      "carboidratos": 45,
      "gorduras": 15,
      "dificuldade": "Média",
      "porcoes": 4
    }
  ]
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um chef especialista brasileiro que cria receitas deliciosas e práticas. Sempre retorne respostas em formato JSON válido com exatamente 25 receitas variadas.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content || '{}'
    
    let receitasData
    try {
      receitasData = JSON.parse(content)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao processar as receitas geradas' 
        },
        { status: 500 }
      )
    }

    if (!receitasData.receitas_sugeridas || receitasData.receitas_sugeridas.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não foi possível gerar receitas com os ingredientes fornecidos' 
        },
        { status: 400 }
      )
    }

    // Garantir que temos pelo menos 25 receitas
    const receitas = receitasData.receitas_sugeridas

    return NextResponse.json({
      success: true,
      receitas_sugeridas: receitas,
      total: receitas.length,
    })

  } catch (error: any) {
    console.error('Erro ao gerar receitas:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao gerar receitas' 
      },
      { status: 500 }
    )
  }
}
