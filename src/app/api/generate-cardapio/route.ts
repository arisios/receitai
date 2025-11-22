import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // Obter a chave da API do ambiente
    const apiKey = process.env.OPENAI_API_KEY

    // Validar API Key
    if (!apiKey || apiKey.includes('Sandbox')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chave da API OpenAI não configurada corretamente. Por favor, configure OPENAI_API_KEY nas variáveis de ambiente com uma chave válida.',
        },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const { 
      numeroPessoas,
      periodo, 
      restricoes, 
      alergias, 
      preferencias, 
      outrasRestricoes,
      incluirSucosFrutas,
      incluirSucosDetox,
      sucosFrutasPreferidos,
      observacoes
    } = await request.json()

    // Construir prompt detalhado
    let restricoesTexto = []
    if (restricoes.gorduraFigado) restricoesTexto.push('gordura no fígado (evitar alimentos gordurosos e frituras)')
    if (restricoes.intoleranciaLactose) restricoesTexto.push('intolerância à lactose (sem leite e derivados)')
    if (restricoes.diabetes) restricoesTexto.push('diabetes (controle de açúcar e carboidratos)')
    if (restricoes.hipertensao) restricoesTexto.push('hipertensão (baixo teor de sódio)')
    if (restricoes.doencaCeliaca) restricoesTexto.push('doença celíaca (sem glúten)')
    if (restricoes.colesterolAlto) restricoesTexto.push('colesterol alto (evitar gorduras saturadas)')

    // Construir informações sobre bebidas
    let bebidasTexto = ''
    if (incluirSucosFrutas || incluirSucosDetox) {
      bebidasTexto = '\n\nBEBIDAS NO CARDÁPIO:\n'
      if (incluirSucosFrutas) {
        bebidasTexto += `- Incluir sucos de frutas naturais nas refeições (café da manhã e lanches)`
        if (sucosFrutasPreferidos.length > 0) {
          bebidasTexto += `\n  Frutas preferidas: ${sucosFrutasPreferidos.join(', ')}`
        }
      }
      if (incluirSucosDetox) {
        bebidasTexto += `\n- Incluir sucos detox (combinações de vegetais e frutas) especialmente no café da manhã e lanches`
      }
    }

    const prompt = `Você é um nutricionista especializado. Crie um cardápio completo e balanceado para ${periodo} dias, para ${numeroPessoas} ${numeroPessoas === 1 ? 'pessoa' : 'pessoas'}.

RESTRIÇÕES ALIMENTARES E CONDIÇÕES DE SAÚDE:
${restricoesTexto.length > 0 ? restricoesTexto.join(', ') : 'Nenhuma restrição específica'}

${alergias.length > 0 ? `ALERGIAS: ${alergias.join(', ')}` : ''}

${outrasRestricoes ? `OUTRAS RESTRIÇÕES: ${outrasRestricoes}` : ''}

${preferencias ? `PREFERÊNCIAS ALIMENTARES: ${preferencias}` : ''}

${bebidasTexto}

${observacoes ? `OBSERVAÇÕES ADICIONAIS: ${observacoes}` : ''}

INSTRUÇÕES:
1. Crie um cardápio com café da manhã, almoço, lanche e jantar para cada dia
2. Respeite RIGOROSAMENTE todas as restrições e alergias mencionadas
3. Varie os alimentos para garantir uma dieta equilibrada
4. Inclua informações nutricionais (calorias, proteínas, carboidratos, gorduras)
5. Liste os ingredientes de cada refeição
6. Considere as preferências alimentares do usuário
7. ${incluirSucosFrutas ? 'Inclua sucos de frutas naturais nas refeições apropriadas' : ''}
8. ${incluirSucosDetox ? 'Inclua sucos detox saudáveis nas refeições apropriadas' : ''}
9. As quantidades devem ser adequadas para ${numeroPessoas} ${numeroPessoas === 1 ? 'pessoa' : 'pessoas'}

Retorne APENAS um JSON válido no seguinte formato:
{
  "periodo": "${periodo} dias",
  "dias": [
    {
      "dia": "Dia 1",
      "refeicoes": [
        {
          "tipo": "Café da Manhã",
          "nome": "Nome da refeição",
          "ingredientes": ["ingrediente1", "ingrediente2"],
          "calorias": 300,
          "proteinas": 15,
          "carboidratos": 40,
          "gorduras": 10
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
          content: 'Você é um nutricionista especializado em criar cardápios personalizados. Sempre retorne JSON válido sem markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const responseText = completion.choices[0].message.content || '{}'
    
    // Limpar possíveis caracteres problemáticos
    const cleanedResponse = responseText
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
      .replace(/\n/g, ' ') // Remove quebras de linha
      .replace(/\r/g, '') // Remove carriage returns
      .trim()

    let cardapio
    try {
      cardapio = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      console.error('Resposta recebida:', cleanedResponse.substring(0, 200))
      
      // Tentar corrigir JSON comum
      const fixedResponse = cleanedResponse
        .replace(/,(\s*[}\]])/g, '$1') // Remove vírgulas antes de } ou ]
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Adiciona aspas em chaves
      
      try {
        cardapio = JSON.parse(fixedResponse)
      } catch (secondError) {
        throw new Error('Erro ao processar resposta da IA. Tente novamente.')
      }
    }

    // Validar estrutura do cardápio
    if (!cardapio.dias || !Array.isArray(cardapio.dias)) {
      throw new Error('Formato de cardápio inválido')
    }

    return NextResponse.json({
      success: true,
      cardapio,
    })

  } catch (error) {
    console.error('Erro ao gerar cardápio:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar cardápio. Tente novamente.',
      },
      { status: 500 }
    )
  }
}
