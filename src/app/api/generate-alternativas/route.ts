import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { pratoAtual, restricoes, alergias, preferencias, numeroPessoas } = await request.json()

    // Construir contexto de restrições
    const restricoesAtivas = Object.entries(restricoes)
      .filter(([_, value]) => value)
      .map(([key]) => {
        const nomes: Record<string, string> = {
          gorduraFigado: 'Gordura no Fígado',
          intoleranciaLactose: 'Intolerância à Lactose',
          diabetes: 'Diabetes',
          hipertensao: 'Hipertensão',
          doencaCeliaca: 'Doença Celíaca',
          colesterolAlto: 'Colesterol Alto',
        }
        return nomes[key]
      })

    const prompt = `Você é um nutricionista especializado. Gere 3 ALTERNATIVAS DIFERENTES para substituir o seguinte prato:

PRATO ATUAL:
- Nome: ${pratoAtual.nome}
- Tipo de refeição: ${pratoAtual.tipo}
- Ingredientes: ${pratoAtual.ingredientes.join(', ')}

RESTRIÇÕES E PREFERÊNCIAS:
${restricoesAtivas.length > 0 ? `- Condições de saúde: ${restricoesAtivas.join(', ')}` : ''}
${alergias.length > 0 ? `- Alergias: ${alergias.join(', ')}` : ''}
${preferencias ? `- Preferências: ${preferencias}` : ''}
- Número de pessoas: ${numeroPessoas}

IMPORTANTE:
- Gere 3 pratos COMPLETAMENTE DIFERENTES entre si
- Mantenha o mesmo tipo de refeição (${pratoAtual.tipo})
- Respeite TODAS as restrições e alergias
- Considere as preferências do usuário
- Cada prato deve ser nutritivo e balanceado
- Ajuste as quantidades para ${numeroPessoas} pessoa(s)

Retorne APENAS um JSON válido no seguinte formato:
{
  "alternativas": [
    {
      "nome": "Nome do prato",
      "ingredientes": ["ingrediente1", "ingrediente2", "ingrediente3"],
      "calorias": 450,
      "proteinas": 30,
      "carboidratos": 45,
      "gorduras": 12
    }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um nutricionista especializado em criar cardápios personalizados. Sempre retorne respostas em JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const resultado = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({
      success: true,
      alternativas: resultado.alternativas || [],
    })
  } catch (error) {
    console.error('Erro ao gerar alternativas:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar alternativas. Tente novamente.',
      },
      { status: 500 }
    )
  }
}
