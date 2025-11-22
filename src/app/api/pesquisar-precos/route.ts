import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { tipo, cardapio, listaCompras, numeroPessoas, localizacao } = await request.json()

    let prompt = ''
    let localizacaoTexto = ''

    // Adicionar informação de localização se disponível
    if (localizacao) {
      if (localizacao.cidade && localizacao.estado) {
        localizacaoTexto = `\n\nLOCALIZAÇÃO DO USUÁRIO: ${localizacao.cidade}, ${localizacao.estado}\nIMPORTANTE: Ajuste os preços considerando a região específica. Preços podem variar significativamente entre diferentes estados e cidades do Brasil.`
      } else if (localizacao.latitude && localizacao.longitude) {
        localizacaoTexto = `\n\nLOCALIZAÇÃO DO USUÁRIO: Coordenadas (${localizacao.latitude.toFixed(4)}, ${localizacao.longitude.toFixed(4)})\nIMPORTANTE: Considere a região geográfica ao estimar os preços.`
      }
    }

    if (tipo === 'cardapio') {
      // Extrair todos os ingredientes do cardápio
      const todosIngredientes = new Set<string>()
      cardapio.dias.forEach((dia: any) => {
        dia.refeicoes.forEach((refeicao: any) => {
          refeicao.ingredientes.forEach((ing: string) => {
            todosIngredientes.add(ing)
          })
        })
      })

      prompt = `Você é um especialista em precificação de alimentos no mercado brasileiro. Estime os preços médios de mercado para os seguintes ingredientes, considerando que o cardápio é para ${numeroPessoas} pessoa(s) e ${cardapio.dias.length} dias.${localizacaoTexto}

INGREDIENTES:
${Array.from(todosIngredientes).join('\n')}

INSTRUÇÕES IMPORTANTES:
- Forneça preços realistas baseados no mercado brasileiro
- Considere quantidades necessárias para ${numeroPessoas} pessoa(s) durante ${cardapio.dias.length} dias
- Agrupe os itens por categoria (Proteínas, Vegetais, Grãos, Laticínios, etc.)
- Forneça quantidade estimada e preço para cada item
- Calcule o total geral
${localizacao ? '- AJUSTE OS PREÇOS de acordo com a região informada (custos de vida variam entre estados e cidades)' : '- Use preços médios nacionais'}

Retorne APENAS um JSON válido no seguinte formato:
{
  "categorias": [
    {
      "categoria": "Proteínas",
      "itens": [
        {
          "item": "Frango",
          "quantidade": "2kg",
          "preco": "28.00"
        }
      ]
    }
  ],
  "total": "250.00"
}`
    } else {
      // Pesquisar preços da lista de compras
      prompt = `Você é um especialista em precificação de alimentos no mercado brasileiro. Estime os preços médios de mercado para a seguinte lista de compras, considerando ${numeroPessoas} pessoa(s).${localizacaoTexto}

LISTA DE COMPRAS:
${listaCompras.categorias.map((cat: any) => 
  `${cat.categoria}:\n${cat.itens.map((item: any) => `- ${item.item} (${item.quantidade})`).join('\n')}`
).join('\n\n')}

INSTRUÇÕES IMPORTANTES:
- Forneça preços realistas baseados no mercado brasileiro
- Mantenha as mesmas categorias e quantidades da lista
- Forneça preço para cada item
- Calcule o total geral
${localizacao ? '- AJUSTE OS PREÇOS de acordo com a região informada (custos de vida variam significativamente entre estados e cidades brasileiras)' : '- Use preços médios nacionais'}
- Considere que preços em capitais e grandes centros urbanos tendem a ser mais altos
- Preços em regiões Norte e Nordeste podem variar para produtos específicos
- Sul e Sudeste geralmente têm preços mais uniformes mas podem ser mais altos em capitais

Retorne APENAS um JSON válido no seguinte formato:
{
  "categorias": [
    {
      "categoria": "Proteínas",
      "itens": [
        {
          "item": "Frango",
          "quantidade": "2kg",
          "preco": "28.00"
        }
      ]
    }
  ],
  "total": "250.00"
}`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em precificação de alimentos no mercado brasileiro com conhecimento profundo sobre variações regionais de preços. Sempre retorne respostas em JSON válido com preços realistas ajustados por região quando informado.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const resultado = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({
      success: true,
      precos: resultado,
    })
  } catch (error) {
    console.error('Erro ao pesquisar preços:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao pesquisar preços. Tente novamente.',
      },
      { status: 500 }
    )
  }
}
