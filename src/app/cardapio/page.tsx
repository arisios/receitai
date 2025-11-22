"use client"

import { useState, useEffect } from "react"
import { Calendar, ChefHat, ShoppingCart, Loader2, Check, X, Plus, Trash2, ArrowLeft, ArrowRight, Users, Droplet, Printer, DollarSign, RefreshCw, MapPin, Target, Activity, Ruler, Weight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"

interface Refeicao {
  tipo: string
  nome: string
  ingredientes: string[]
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

interface DiaCardapio {
  dia: string
  refeicoes: Refeicao[]
}

interface Cardapio {
  periodo: string
  dias: DiaCardapio[]
}

interface ListaCompras {
  categorias: {
    categoria: string
    itens: {
      item: string
      quantidade: string
    }[]
  }[]
}

interface PratoAlternativo {
  nome: string
  ingredientes: string[]
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

interface Localizacao {
  latitude: number
  longitude: number
  cidade?: string
  estado?: string
}

export default function CardapioPage() {
  const [quizStep, setQuizStep] = useState(1)
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [cardapio, setCardapio] = useState<Cardapio | null>(null)
  const [listaCompras, setListaCompras] = useState<ListaCompras | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Estados para alteração de pratos
  const [pratoSelecionado, setPratoSelecionado] = useState<{ diaIndex: number; refIndex: number } | null>(null)
  const [pratosAlternativos, setPratosAlternativos] = useState<PratoAlternativo[]>([])
  const [isLoadingAlternativas, setIsLoadingAlternativas] = useState(false)
  const [showAlternativasDialog, setShowAlternativasDialog] = useState(false)

  // Estados para pesquisa de preços
  const [showPrecosDialog, setShowPrecosDialog] = useState(false)
  const [precosData, setPrecosData] = useState<any>(null)
  const [isLoadingPrecos, setIsLoadingPrecos] = useState(false)

  // Estados para localização
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Form data - Quiz format
  const [numeroPessoas, setNumeroPessoas] = useState(1)
  const [periodo, setPeriodo] = useState(7)
  
  // NOVAS PERGUNTAS - Objetivo e Dados Físicos
  const [objetivo, setObjetivo] = useState("")
  const [altura, setAltura] = useState("")
  const [peso, setPeso] = useState("")
  const [idade, setIdade] = useState("")
  const [sexo, setSexo] = useState("")
  const [nivelAtividade, setNivelAtividade] = useState("")
  
  const [restricoes, setRestricoes] = useState({
    gorduraFigado: false,
    intoleranciaLactose: false,
    diabetes: false,
    hipertensao: false,
    doencaCeliaca: false,
    colesterolAlto: false,
  })
  const [alergias, setAlergias] = useState<string[]>([])
  const [novaAlergia, setNovaAlergia] = useState("")
  const [preferencias, setPreferencias] = useState("")
  const [outrasRestricoes, setOutrasRestricoes] = useState("")
  
  // Novas opções de bebidas
  const [incluirSucosFrutas, setIncluirSucosFrutas] = useState(false)
  const [incluirSucosDetox, setIncluirSucosDetox] = useState(false)
  const [sucosFrutasPreferidos, setSucosFrutasPreferidos] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState("")

  const sucosFrutasOpcoes = [
    "Laranja", "Limão", "Abacaxi", "Melancia", "Morango", 
    "Maracujá", "Manga", "Uva", "Acerola", "Goiaba"
  ]

  const objetivosOpcoes = [
    { id: "perder-peso", label: "Perder Peso", icon: "📉", desc: "Reduzir gordura corporal de forma saudável" },
    { id: "ganhar-massa", label: "Ganhar Massa Muscular", icon: "💪", desc: "Aumentar músculos com alimentação adequada" },
    { id: "manter-peso", label: "Manter o Peso", icon: "⚖️", desc: "Manter peso atual com alimentação equilibrada" },
    { id: "saude-geral", label: "Melhorar Saúde Geral", icon: "❤️", desc: "Alimentação saudável e nutritiva" },
    { id: "performance", label: "Melhorar Performance", icon: "🏃", desc: "Otimizar energia e desempenho físico" },
    { id: "controle-doenca", label: "Controlar Condição de Saúde", icon: "🏥", desc: "Dieta específica para condições médicas" }
  ]

  const nivelAtividadeOpcoes = [
    { id: "sedentario", label: "Sedentário", icon: "🛋️", desc: "Pouca ou nenhuma atividade física" },
    { id: "leve", label: "Levemente Ativo", icon: "🚶", desc: "Exercício leve 1-3 dias/semana" },
    { id: "moderado", label: "Moderadamente Ativo", icon: "🏃", desc: "Exercício moderado 3-5 dias/semana" },
    { id: "intenso", label: "Muito Ativo", icon: "🏋️", desc: "Exercício intenso 6-7 dias/semana" },
    { id: "atleta", label: "Atleta", icon: "🏆", desc: "Treino intenso diário + trabalho físico" }
  ]

  // Calcular IMC
  const calcularIMC = () => {
    const alturaMetros = parseFloat(altura) / 100
    const pesoNum = parseFloat(peso)
    if (alturaMetros > 0 && pesoNum > 0) {
      const imc = pesoNum / (alturaMetros * alturaMetros)
      return imc.toFixed(1)
    }
    return null
  }

  const getIMCCategoria = (imc: number) => {
    if (imc < 18.5) return { label: "Abaixo do peso", color: "text-blue-600" }
    if (imc < 25) return { label: "Peso normal", color: "text-green-600" }
    if (imc < 30) return { label: "Sobrepeso", color: "text-yellow-600" }
    if (imc < 35) return { label: "Obesidade Grau I", color: "text-orange-600" }
    if (imc < 40) return { label: "Obesidade Grau II", color: "text-red-600" }
    return { label: "Obesidade Grau III", color: "text-red-700" }
  }

  // Função para obter localização do usuário
  const obterLocalizacao = async () => {
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocalização não é suportada pelo seu navegador")
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`,
            { 
              signal: controller.signal,
              headers: {
                'User-Agent': 'ReceitAI/1.0'
              }
            }
          )
          
          clearTimeout(timeoutId)
          
          if (response.ok) {
            const data = await response.json()
            
            setLocalizacao({
              latitude,
              longitude,
              cidade: data.address?.city || data.address?.town || data.address?.village || "Não identificada",
              estado: data.address?.state || "Não identificado"
            })
          } else {
            setLocalizacao({
              latitude,
              longitude
            })
          }
        } catch (error) {
          console.log('Geocodificação falhou, usando apenas coordenadas')
          setLocalizacao({
            latitude,
            longitude
          })
        }
        
        setIsLoadingLocation(false)
      },
      (error) => {
        let errorMessage = "Erro ao obter localização"
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permissão de localização negada. Você pode continuar sem localização."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informação de localização indisponível"
            break
          case error.TIMEOUT:
            errorMessage = "Tempo esgotado ao tentar obter localização"
            break
        }
        
        setLocationError(errorMessage)
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  const handleAddAlergia = () => {
    if (novaAlergia.trim()) {
      setAlergias([...alergias, novaAlergia.trim()])
      setNovaAlergia("")
    }
  }

  const handleRemoveAlergia = (index: number) => {
    setAlergias(alergias.filter((_, i) => i !== index))
  }

  const toggleSucoFruta = (suco: string) => {
    if (sucosFrutasPreferidos.includes(suco)) {
      setSucosFrutasPreferidos(sucosFrutasPreferidos.filter(s => s !== suco))
    } else {
      setSucosFrutasPreferidos([...sucosFrutasPreferidos, suco])
    }
  }

  const handleNextQuizStep = () => {
    setQuizStep(quizStep + 1)
  }

  const handlePrevQuizStep = () => {
    setQuizStep(quizStep - 1)
  }

  const handleGenerateCardapio = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const imc = calcularIMC()
      
      const response = await fetch('/api/generate-cardapio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numeroPessoas,
          periodo,
          objetivo,
          altura,
          peso,
          idade,
          sexo,
          nivelAtividade,
          imc,
          restricoes,
          alergias,
          preferencias,
          outrasRestricoes,
          incluirSucosFrutas,
          incluirSucosDetox,
          sucosFrutasPreferidos,
          observacoes,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar cardápio')
      }

      setCardapio(data.cardapio)
      setStep(2)
    } catch (err) {
      console.error('Erro:', err)
      setError(err instanceof Error ? err.message : 'Erro ao gerar cardápio. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApproveCardapio = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-lista-compras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardapio, numeroPessoas }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar lista de compras')
      }

      setListaCompras(data.listaCompras)
      setStep(3)
    } catch (err) {
      console.error('Erro:', err)
      setError(err instanceof Error ? err.message : 'Erro ao gerar lista de compras. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSolicitarAlternativas = async (diaIndex: number, refIndex: number) => {
    if (!cardapio) return

    setPratoSelecionado({ diaIndex, refIndex })
    setIsLoadingAlternativas(true)
    setShowAlternativasDialog(true)
    setPratosAlternativos([])

    try {
      const pratoAtual = cardapio.dias[diaIndex].refeicoes[refIndex]
      
      const response = await fetch('/api/generate-alternativas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pratoAtual,
          restricoes,
          alergias,
          preferencias,
          numeroPessoas,
          objetivo,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar alternativas')
      }

      setPratosAlternativos(data.alternativas)
    } catch (err) {
      console.error('Erro:', err)
      setError(err instanceof Error ? err.message : 'Erro ao gerar alternativas. Tente novamente.')
    } finally {
      setIsLoadingAlternativas(false)
    }
  }

  const handleSubstituirPrato = (alternativa: PratoAlternativo) => {
    if (!cardapio || !pratoSelecionado) return

    const novoCardapio = { ...cardapio }
    novoCardapio.dias[pratoSelecionado.diaIndex].refeicoes[pratoSelecionado.refIndex] = {
      tipo: novoCardapio.dias[pratoSelecionado.diaIndex].refeicoes[pratoSelecionado.refIndex].tipo,
      ...alternativa
    }

    setCardapio(novoCardapio)
    setShowAlternativasDialog(false)
    setPratoSelecionado(null)
  }

  const handleImprimirCardapio = () => {
    window.print()
  }

  const handlePesquisarPrecosLista = async () => {
    if (!listaCompras) return

    setIsLoadingPrecos(true)
    setShowPrecosDialog(true)
    setPrecosData(null)

    if (!localizacao && !isLoadingLocation) {
      obterLocalizacao().catch(() => {
        console.log('Continuando sem localização')
      })
    }

    try {
      const response = await fetch('/api/pesquisar-precos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'lista',
          listaCompras,
          numeroPessoas,
          localizacao: localizacao || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao pesquisar preços')
      }

      setPrecosData(data.precos)
    } catch (err) {
      console.error('Erro:', err)
      setError(err instanceof Error ? err.message : 'Erro ao pesquisar preços. Tente novamente.')
    } finally {
      setIsLoadingPrecos(false)
    }
  }

  const handleReset = () => {
    setQuizStep(1)
    setStep(1)
    setCardapio(null)
    setListaCompras(null)
    setError(null)
    setLocalizacao(null)
    setLocationError(null)
  }

  const totalQuizSteps = 10

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Cardápio Personalizado
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Planejamento alimentar inteligente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 print:hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <X className="w-5 h-5" />
                <p className="font-semibold">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Quiz de Preferências */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Pergunta {quizStep} de {totalQuizSteps}</span>
                    <span>{Math.round((quizStep / totalQuizSteps) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(quizStep / totalQuizSteps) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Step 1: Objetivo */}
            {quizStep === 1 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Target className="w-6 h-6 text-green-600" />
                    Qual é o seu objetivo com este cardápio?
                  </CardTitle>
                  <CardDescription>
                    Isso nos ajudará a personalizar as receitas e quantidades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {objetivosOpcoes.map((obj) => (
                      <button
                        key={obj.id}
                        onClick={() => setObjetivo(obj.id)}
                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                          objetivo === obj.id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{obj.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-base mb-1">{obj.label}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{obj.desc}</div>
                          </div>
                          {objetivo === obj.id && (
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Step 2: Dados Físicos - Altura e Peso */}
            {quizStep === 2 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Ruler className="w-6 h-6 text-green-600" />
                    Qual sua altura e peso?
                  </CardTitle>
                  <CardDescription>
                    Essas informações nos ajudam a calcular suas necessidades calóricas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="altura" className="text-base">Altura (cm)</Label>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="altura"
                          type="number"
                          placeholder="Ex: 170"
                          value={altura}
                          onChange={(e) => setAltura(e.target.value)}
                          className="pl-11 text-lg h-14"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="peso" className="text-base">Peso (kg)</Label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="peso"
                          type="number"
                          placeholder="Ex: 70"
                          value={peso}
                          onChange={(e) => setPeso(e.target.value)}
                          className="pl-11 text-lg h-14"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cálculo IMC */}
                  {altura && peso && calcularIMC() && (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-900/50">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Seu IMC</p>
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {calcularIMC()}
                        </p>
                        <p className={`text-base font-semibold ${getIMCCategoria(parseFloat(calcularIMC()!)).color}`}>
                          {getIMCCategoria(parseFloat(calcularIMC()!)).label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                          Usaremos isso para personalizar seu cardápio
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quiz Step 3: Idade e Sexo */}
            {quizStep === 3 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Users className="w-6 h-6 text-green-600" />
                    Informações pessoais
                  </CardTitle>
                  <CardDescription>
                    Idade e sexo influenciam nas necessidades nutricionais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="idade" className="text-base">Idade (anos)</Label>
                    <Input
                      id="idade"
                      type="number"
                      placeholder="Ex: 30"
                      value={idade}
                      onChange={(e) => setIdade(e.target.value)}
                      className="text-lg h-14"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">Sexo</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSexo("masculino")}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          sexo === "masculino"
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-center">
                          <span className="text-4xl mb-2 block">👨</span>
                          <span className="font-semibold">Masculino</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setSexo("feminino")}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          sexo === "feminino"
                            ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
                        }`}
                      >
                        <div className="text-center">
                          <span className="text-4xl mb-2 block">👩</span>
                          <span className="font-semibold">Feminino</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Step 4: Nível de Atividade Física */}
            {quizStep === 4 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Activity className="w-6 h-6 text-green-600" />
                    Qual seu nível de atividade física?
                  </CardTitle>
                  <CardDescription>
                    Isso afeta suas necessidades calóricas diárias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {nivelAtividadeOpcoes.map((nivel) => (
                      <button
                        key={nivel.id}
                        onClick={() => setNivelAtividade(nivel.id)}
                        className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                          nivelAtividade === nivel.id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{nivel.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-base">{nivel.label}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{nivel.desc}</div>
                          </div>
                          {nivelAtividade === nivel.id && (
                            <Check className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Step 5: Número de Pessoas */}
            {quizStep === 5 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Users className="w-6 h-6 text-green-600" />
                    Para quantas pessoas será o cardápio?
                  </CardTitle>
                  <CardDescription>
                    Isso nos ajudará a calcular as quantidades corretas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setNumeroPessoas(Math.max(1, numeroPessoas - 1))}
                      className="h-16 w-16 text-2xl"
                    >
                      -
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-5xl font-bold text-green-600 dark:text-green-400">
                        {numeroPessoas}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {numeroPessoas === 1 ? 'pessoa' : 'pessoas'}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setNumeroPessoas(numeroPessoas + 1)}
                      className="h-16 w-16 text-2xl"
                    >
                      +
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <Button
                        key={num}
                        variant={numeroPessoas === num ? "default" : "outline"}
                        onClick={() => setNumeroPessoas(num)}
                        className="w-16"
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Step 6: Período */}
            {quizStep === 6 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Calendar className="w-6 h-6 text-green-600" />
                    Por quantos dias você quer planejar?
                  </CardTitle>
                  <CardDescription>
                    Escolha o período do seu cardápio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setPeriodo(7)}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        periodo === 7
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                      }`}
                    >
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">7</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">dias</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">1 semana</div>
                    </button>
                    <button
                      onClick={() => setPeriodo(14)}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        periodo === 14
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                      }`}
                    >
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">14</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">dias</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">2 semanas</div>
                    </button>
                    <button
                      onClick={() => setPeriodo(30)}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        periodo === 30
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                      }`}
                    >
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">30</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">dias</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">1 mês</div>
                    </button>
                  </div>
                  <div className="pt-4">
                    <Label htmlFor="periodo-custom">Ou escolha um período personalizado:</Label>
                    <Input
                      id="periodo-custom"
                      type="number"
                      min="1"
                      max="90"
                      value={periodo}
                      onChange={(e) => setPeriodo(parseInt(e.target.value) || 7)}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Step 7: Restrições de Saúde */}
            {quizStep === 7 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <ChefHat className="w-6 h-6 text-green-600" />
                    Você tem alguma condição de saúde?
                  </CardTitle>
                  <CardDescription>
                    Selecione todas que se aplicam (opcional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'gorduraFigado', label: 'Gordura no Fígado', icon: '🫀' },
                      { id: 'intoleranciaLactose', label: 'Intolerância à Lactose', icon: '🥛' },
                      { id: 'diabetes', label: 'Diabetes', icon: '🩸' },
                      { id: 'hipertensao', label: 'Hipertensão', icon: '💓' },
                      { id: 'doencaCeliaca', label: 'Doença Celíaca', icon: '🌾' },
                      { id: 'colesterolAlto', label: 'Colesterol Alto', icon: '🧈' },
                    ].map((restricao) => (
                      <button
                        key={restricao.id}
                        onClick={() => setRestricoes({ 
                          ...restricoes, 
                          [restricao.id]: !restricoes[restricao.id as keyof typeof restricoes] 
                        })}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          restricoes[restricao.id as keyof typeof restricoes]
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{restricao.icon}</span>
                          <span className="font-medium">{restricao.label}</span>
                          {restricoes[restricao.id as keyof typeof restricoes] && (
                            <Check className="w-5 h-5 text-green-600 ml-auto" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="pt-4">
                    <Label>Outras condições de saúde:</Label>
                    <Textarea
                      placeholder="Ex: Gastrite, refluxo, insuficiência renal, etc."
                      value={outrasRestricoes}
                      onChange={(e) => setOutrasRestricoes(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Step 8: Alergias */}
            {quizStep === 8 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Você tem alergia a algum alimento?
                  </CardTitle>
                  <CardDescription>
                    Adicione todos os alimentos que causam alergia (opcional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Amendoim, camarão, ovo..."
                      value={novaAlergia}
                      onChange={(e) => setNovaAlergia(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddAlergia()}
                    />
                    <Button onClick={handleAddAlergia} size="lg">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {alergias.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      {alergias.map((alergia, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-100"
                        >
                          {alergia}
                          <button
                            onClick={() => handleRemoveAlergia(index)}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {alergias.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Nenhuma alergia adicionada</p>
                      <p className="text-sm mt-1">Você pode pular esta etapa se não tiver alergias</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quiz Step 9: Preferências */}
            {quizStep === 9 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Quais são suas preferências alimentares?
                  </CardTitle>
                  <CardDescription>
                    Conte-nos sobre os alimentos que você gosta ou não gosta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Ex: Gosto de comida brasileira, frango, peixes, massas, saladas. Não gosto de fígado e miúdos. Prefiro refeições leves no jantar..."
                    value={preferencias}
                    onChange={(e) => setPreferencias(e.target.value)}
                    rows={6}
                    className="text-base"
                  />
                </CardContent>
              </Card>
            )}

            {/* Quiz Step 10: Observações Finais */}
            {quizStep === 10 && (
              <Card className="border-2 border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    Alguma observação adicional?
                  </CardTitle>
                  <CardDescription>
                    Informações extras que podem ajudar a personalizar seu cardápio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Ex: Preciso de refeições rápidas para o almoço pois trabalho fora. Gostaria de opções vegetarianas pelo menos 2x na semana. Prefiro evitar frituras..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={6}
                    className="text-base"
                  />

                  {/* Resumo das escolhas */}
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-900/50">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                      <Check className="w-5 h-5 text-blue-600" />
                      Resumo do seu perfil:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {objetivo && (
                        <p>🎯 <strong>Objetivo:</strong> {objetivosOpcoes.find(o => o.id === objetivo)?.label}</p>
                      )}
                      {altura && peso && (
                        <p>📏 <strong>IMC:</strong> {calcularIMC()} ({getIMCCategoria(parseFloat(calcularIMC()!)).label})</p>
                      )}
                      {idade && (
                        <p>🎂 <strong>Idade:</strong> {idade} anos</p>
                      )}
                      {sexo && (
                        <p>👤 <strong>Sexo:</strong> {sexo === 'masculino' ? 'Masculino' : 'Feminino'}</p>
                      )}
                      {nivelAtividade && (
                        <p>🏃 <strong>Atividade:</strong> {nivelAtividadeOpcoes.find(n => n.id === nivelAtividade)?.label}</p>
                      )}
                      <p>👥 <strong>Pessoas:</strong> {numeroPessoas}</p>
                      <p>📅 <strong>Período:</strong> {periodo} dias</p>
                      {Object.values(restricoes).some(v => v) && (
                        <p>🏥 <strong>Restrições:</strong> {Object.entries(restricoes).filter(([_, v]) => v).length} selecionadas</p>
                      )}
                      {alergias.length > 0 && (
                        <p className="col-span-2">⚠️ <strong>Alergias:</strong> {alergias.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              {quizStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevQuizStep}
                  className="flex-1"
                  size="lg"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
              )}
              
              {quizStep < totalQuizSteps ? (
                <Button
                  onClick={handleNextQuizStep}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                  size="lg"
                >
                  Próxima
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerateCardapio}
                  disabled={isGenerating}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando Cardápio...
                    </>
                  ) : (
                    <>
                      <ChefHat className="w-5 h-5 mr-2" />
                      Gerar Cardápio Personalizado
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Visualização do Cardápio */}
        {step === 2 && cardapio && (
          <div className="space-y-6">
            <Card className="border-2 border-green-200 dark:border-green-900/50 print:border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Seu Cardápio Personalizado - {cardapio.periodo}
                </CardTitle>
                <CardDescription>
                  Cardápio para {numeroPessoas} {numeroPessoas === 1 ? 'pessoa' : 'pessoas'} • Revise e aprove para gerar a lista de compras
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {cardapio.dias && Array.isArray(cardapio.dias) && cardapio.dias.length > 0 ? (
                cardapio.dias.map((dia, diaIndex) => (
                <Card key={diaIndex}>
                  <CardHeader>
                    <CardTitle className="text-lg">{dia.dia}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dia.refeicoes && Array.isArray(dia.refeicoes) && dia.refeicoes.map((refeicao, refIndex) => (
                      <div
                        key={refIndex}
                        className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {refeicao.tipo}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{refeicao.calorias} kcal</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSolicitarAlternativas(diaIndex, refIndex)}
                              className="print:hidden"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Alterar
                            </Button>
                          </div>
                        </div>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                          {refeicao.nome}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {refeicao.ingredientes && refeicao.ingredientes.slice(0, 5).map((ing, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {ing}
                            </Badge>
                          ))}
                          {refeicao.ingredientes && refeicao.ingredientes.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{refeicao.ingredientes.length - 5} mais
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <p className="text-gray-600 dark:text-gray-400">Proteínas</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              {refeicao.proteinas}g
                            </p>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                            <p className="text-gray-600 dark:text-gray-400">Carboidratos</p>
                            <p className="font-bold text-yellow-600 dark:text-yellow-400">
                              {refeicao.carboidratos}g
                            </p>
                          </div>
                          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <p className="text-gray-600 dark:text-gray-400">Gorduras</p>
                            <p className="font-bold text-green-600 dark:text-green-400">
                              {refeicao.gorduras}g
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">
                        Não foi possível carregar os dias do cardápio. Tente gerar novamente.
                      </p>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="mt-4"
                      >
                        Gerar Novo Cardápio
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {cardapio.dias && Array.isArray(cardapio.dias) && cardapio.dias.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                <Button
                  variant="outline"
                  onClick={handleImprimirCardapio}
                  className="w-full"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Imprimir
                </Button>
                <Button
                  onClick={handleApproveCardapio}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando Lista...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Gerar Lista de Compras
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Lista de Compras */}
        {step === 3 && listaCompras && (
          <div className="space-y-6">
            <Card className="border-2 border-blue-200 dark:border-blue-900/50 print:border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Lista de Compras Gerada
                </CardTitle>
                <CardDescription>
                  Quantidades calculadas para {numeroPessoas} {numeroPessoas === 1 ? 'pessoa' : 'pessoas'}
                </CardDescription>
              </CardHeader>
            </Card>

            {localizacao && (
              <Card className="border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 print:hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">Localização detectada</p>
                      <p className="text-sm">
                        {localizacao.cidade && localizacao.estado 
                          ? `${localizacao.cidade}, ${localizacao.estado}`
                          : 'Coordenadas obtidas'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {locationError && (
              <Card className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20 print:hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <MapPin className="w-5 h-5" />
                    <p className="text-sm">{locationError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listaCompras.categorias.map((categoria, catIndex) => (
                <Card key={catIndex}>
                  <CardHeader>
                    <CardTitle className="text-lg">{categoria.categoria}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {categoria.itens.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                        >
                          <span className="text-gray-700 dark:text-gray-300">{item.item}</span>
                          <Badge variant="outline">{item.quantidade}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="w-full"
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimir Lista
              </Button>
              <Button
                variant="outline"
                onClick={handlePesquisarPrecosLista}
                disabled={isLoadingPrecos}
                className="w-full"
              >
                {isLoadingPrecos ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Pesquisando...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pesquisar Preços
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full print:hidden"
            >
              Criar Novo Cardápio
            </Button>
          </div>
        )}

        {/* Dialog de Alternativas */}
        <Dialog open={showAlternativasDialog} onOpenChange={setShowAlternativasDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Escolha uma alternativa</DialogTitle>
              <DialogDescription>
                Selecione um prato para substituir o atual
              </DialogDescription>
            </DialogHeader>

            {isLoadingAlternativas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Gerando alternativas...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {pratosAlternativos.map((alternativa, index) => (
                  <button
                    key={index}
                    onClick={() => handleSubstituirPrato(alternativa)}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{alternativa.nome}</h4>
                      <Badge variant="secondary">{alternativa.calorias} kcal</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {alternativa.ingredientes.slice(0, 5).map((ing, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {ing}
                        </Badge>
                      ))}
                      {alternativa.ingredientes.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{alternativa.ingredientes.length - 5} mais
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <p className="text-gray-600 dark:text-gray-400">Proteínas</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {alternativa.proteinas}g
                        </p>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <p className="text-gray-600 dark:text-gray-400">Carboidratos</p>
                        <p className="font-bold text-yellow-600 dark:text-yellow-400">
                          {alternativa.carboidratos}g
                        </p>
                      </div>
                      <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <p className="text-gray-600 dark:text-gray-400">Gorduras</p>
                        <p className="font-bold text-green-600 dark:text-green-400">
                          {alternativa.gorduras}g
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Preços */}
        <Dialog open={showPrecosDialog} onOpenChange={setShowPrecosDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Estimativa de Preços</DialogTitle>
              <DialogDescription>
                Valores aproximados baseados em preços médios de mercado
                {localizacao && localizacao.cidade && localizacao.estado && (
                  <span className="block mt-1 text-green-600 dark:text-green-400">
                    📍 {localizacao.cidade}, {localizacao.estado}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {isLoadingPrecos ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">Pesquisando preços...</p>
                  {isLoadingLocation && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Obtendo sua localização para preços mais precisos...
                    </p>
                  )}
                </div>
              </div>
            ) : precosData ? (
              <div className="space-y-4">
                {precosData.categorias && precosData.categorias.map((categoria: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">{categoria.categoria}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {categoria.itens.map((item: any, itemIndex: number) => (
                          <li
                            key={itemIndex}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {item.item} ({item.quantidade})
                            </span>
                            <Badge variant="outline" className="text-green-600 dark:text-green-400">
                              R$ {item.preco}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}

                {precosData.total && (
                  <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Total Estimado:</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          R$ {precosData.total}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        * Valores aproximados. Preços podem variar conforme região e estabelecimento.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Nenhum dado de preço disponível
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* Estilos de impressão */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
