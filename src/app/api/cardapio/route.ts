import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Obter a chave da API do ambiente
    const apiKey = process.env.OPENAI_API_KEY;

    // Validar API Key
    if (!apiKey || apiKey.includes('Sandbox')) {
      return NextResponse.json(
        { 
          error: 'Chave da API OpenAI não configurada corretamente. Por favor, configure OPENAI_API_KEY nas variáveis de ambiente com uma chave válida.',
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const { periodo, restricoes, preferencias } = await request.json();

    if (!periodo || !restricoes || !preferencias) {
      return NextResponse.json(
        { error: 'Período, restrições e preferências são obrigatórios' },
        { status: 400 }
      );
    }

    const prompt = `Você é um nutricionista especializado. Crie um cardápio personalizado com as seguintes especificações:

**Período:** ${periodo} dias
**Restrições Alimentares:** ${restricoes}
**Preferências:** ${preferencias}

Crie um cardápio completo e balanceado para ${periodo} dias, considerando todas as restrições e preferências mencionadas.

Para cada dia, forneça:
- Café da manhã
- Almoço
- Jantar
- 2 lanches (meio da manhã e tarde)

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem texto adicional, seguindo EXATAMENTE esta estrutura:

{
  "cardapio": {
    "periodo": "${periodo} dias",
    "restricoes": "${restricoes}",
    "preferencias": "${preferencias}",
    "dias": [
      {
        "dia": "Dia 1",
        "refeicoes": {
          "cafe": "Descrição do café da manhã",
          "lanche_manha": "Descrição do lanche da manhã",
          "almoco": "Descrição do almoço",
          "lanche_tarde": "Descrição do lanche da tarde",
          "jantar": "Descrição do jantar"
        }
      }
    ]
  }
}

Certifique-se de que o JSON seja válido e não contenha quebras de linha dentro das strings.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um nutricionista especializado que retorna APENAS objetos JSON válidos, sem texto adicional antes ou depois. Nunca use quebras de linha dentro de strings JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error('Resposta vazia da OpenAI');
    }

    // Limpar e validar JSON
    let cleanedContent = content.trim();
    
    // Remover possíveis marcadores de código
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remover caracteres de controle problemáticos
    cleanedContent = cleanedContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
    
    // Tentar parsear o JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      console.error('Conteúdo recebido:', cleanedContent);
      
      // Tentar corrigir JSON quebrado
      try {
        // Remover vírgulas extras antes de fechar objetos/arrays
        cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1');
        parsedData = JSON.parse(cleanedContent);
      } catch (secondError) {
        throw new Error('Não foi possível processar a resposta da IA');
      }
    }

    // Validar estrutura do cardápio
    if (!parsedData.cardapio || !parsedData.cardapio.dias || !Array.isArray(parsedData.cardapio.dias)) {
      throw new Error('Estrutura de cardápio inválida');
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Erro ao gerar cardápio:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao gerar cardápio',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
