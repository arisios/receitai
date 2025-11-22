import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { cardapio } = await request.json();

    if (!cardapio || !cardapio.dias) {
      return NextResponse.json(
        { error: 'Cardápio inválido' },
        { status: 400 }
      );
    }

    const prompt = `Com base no seguinte cardápio, crie uma lista de compras organizada por categorias:

${JSON.stringify(cardapio, null, 2)}

Analise todas as refeições e crie uma lista de compras consolidada, agrupando ingredientes por categoria (Frutas, Verduras, Proteínas, Grãos, Laticínios, etc.).

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem texto adicional, seguindo EXATAMENTE esta estrutura:

{
  "listaCompras": {
    "categorias": [
      {
        "nome": "Frutas",
        "itens": [
          { "item": "Banana", "quantidade": "1 kg" },
          { "item": "Maçã", "quantidade": "6 unidades" }
        ]
      },
      {
        "nome": "Verduras e Legumes",
        "itens": [
          { "item": "Alface", "quantidade": "2 pés" }
        ]
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
          content: 'Você é um assistente que retorna APENAS objetos JSON válidos, sem texto adicional. Nunca use quebras de linha dentro de strings JSON.',
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
    cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleanedContent = cleanedContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1');
      parsedData = JSON.parse(cleanedContent);
    }

    // Validar estrutura
    if (!parsedData.listaCompras || !parsedData.listaCompras.categorias) {
      throw new Error('Estrutura de lista de compras inválida');
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Erro ao gerar lista de compras:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao gerar lista de compras',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
