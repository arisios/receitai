"use client"

import { useState } from "react"
import { Upload, Camera, Loader2, Clock, Flame, ChefHat, Filter, X, Lock, Play, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Recipe {
  nome: string
  calorias: number
  tempo_preparo_minutos: number
  video_tutorial: string
  ingredientes: string[]
  instrucoes: string
  proteinas?: number
  carboidratos?: number
  gorduras?: number
  dificuldade?: string
  porcoes?: number
}

interface Filters {
  vegetariano: boolean
  vegano: boolean
  semGluten: boolean
  semLactose: boolean
  lowCarb: boolean
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([])
  const [filters, setFilters] = useState<Filters>({
    vegetariano: false,
    vegano: false,
    semGluten: false,
    semLactose: false,
    lowCarb: false
  })
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem válido.')
        return
      }

      // Validar tamanho (máx 4MB)
      const maxSize = 4 * 1024 * 1024 // 4MB
      if (file.size > maxSize) {
        setError('Imagem muito grande. Por favor, use uma imagem menor que 4MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
        analyzeImage(reader.result as string)
      }
      reader.onerror = () => {
        setError('Erro ao ler o arquivo. Tente novamente.')
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      // 1. Analisar imagem com OpenAI Vision
      const analyzeResponse = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      })
      
      const analyzeData = await analyzeResponse.json()
      
      if (!analyzeResponse.ok || !analyzeData.success) {
        throw new Error(analyzeData.error || 'Erro ao analisar imagem. Tente novamente.')
      }
      
      const ingredients = analyzeData.ingredientes
      setDetectedIngredients(ingredients)
      
      // 2. Gerar receitas com base nos ingredientes detectados
      const recipesResponse = await fetch('/api/generate-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ingredientes: ingredients,
          filtros: filters 
        }),
      })
      
      const recipesData = await recipesResponse.json()
      
      if (!recipesResponse.ok || !recipesData.success) {
        throw new Error(recipesData.error || 'Erro ao gerar receitas. Tente novamente.')
      }
      
      // Ordenar receitas: primeiras 5 aleatórias, depois ordenar por calorias e tempo
      const allRecipes = recipesData.receitas_sugeridas
      const freeRecipes = allRecipes.slice(0, 5)
      const premiumRecipes = allRecipes.slice(5).sort((a: Recipe, b: Recipe) => {
        // Ordenar por calorias primeiro, depois por tempo
        if (a.calorias !== b.calorias) {
          return a.calorias - b.calorias
        }
        return a.tempo_preparo_minutos - b.tempo_preparo_minutos
      })
      
      setRecipes([...freeRecipes, ...premiumRecipes])
      
    } catch (err) {
      console.error('Erro:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar imagem. Tente novamente.'
      setError(errorMessage)
      setDetectedIngredients([])
      setRecipes([])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const applyFilters = async () => {
    setShowFilters(false)
    
    // Se já temos ingredientes detectados, regenerar receitas com novos filtros
    if (detectedIngredients.length > 0) {
      setIsAnalyzing(true)
      setError(null)
      
      try {
        const recipesResponse = await fetch('/api/generate-recipes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            ingredientes: detectedIngredients,
            filtros: filters 
          }),
        })
        
        const recipesData = await recipesResponse.json()
        
        if (!recipesResponse.ok || !recipesData.success) {
          throw new Error(recipesData.error || 'Erro ao aplicar filtros. Tente novamente.')
        }
        
        // Ordenar receitas: primeiras 5 aleatórias, depois ordenar por calorias e tempo
        const allRecipes = recipesData.receitas_sugeridas
        const freeRecipes = allRecipes.slice(0, 5)
        const premiumRecipes = allRecipes.slice(5).sort((a: Recipe, b: Recipe) => {
          if (a.calorias !== b.calorias) {
            return a.calorias - b.calorias
          }
          return a.tempo_preparo_minutos - b.tempo_preparo_minutos
        })
        
        setRecipes([...freeRecipes, ...premiumRecipes])
        
      } catch (err) {
        console.error('Erro:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro ao aplicar filtros. Tente novamente.'
        setError(errorMessage)
      } finally {
        setIsAnalyzing(false)
      }
    }
  }

  const resetFilters = () => {
    setFilters({
      vegetariano: false,
      vegano: false,
      semGluten: false,
      semLactose: false,
      lowCarb: false
    })
  }

  const handleUpgrade = () => {
    alert('🎉 Funcionalidade de pagamento em desenvolvimento! Em breve você poderá desbloquear todas as receitas premium.')
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-6">
            {/* Logo Centralizado */}
            <div className="flex flex-col items-center gap-2">
              <img 
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/07eaf223-575f-46ff-93e7-470e0681d915.webp" 
                alt="ReceitAI Logo" 
                className="w-16 h-16 object-contain"
              />
              <h1 className="text-2xl font-bold text-gray-900">
                ReceitAI
              </h1>
            </div>
            
            {/* Botões de Navegação */}
            <div className="flex items-center gap-3">
              <Link href="/cardapio">
                <Button variant="outline" size="default" className="gap-2 rounded-full border-gray-300 hover:bg-gray-50">
                  <Calendar className="w-4 h-4" />
                  Gerar Cardápio
                </Button>
              </Link>

              <Dialog open={showFilters} onOpenChange={setShowFilters}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="default" className="gap-2 rounded-full border-gray-300 hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    Filtros
                    {Object.values(filters).some(v => v) && (
                      <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                        {Object.values(filters).filter(v => v).length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Preferências Alimentares</DialogTitle>
                    <DialogDescription>
                      Personalize as receitas de acordo com suas restrições
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="vegetariano" 
                        checked={filters.vegetariano}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ ...prev, vegetariano: checked as boolean }))
                        }
                      />
                      <Label htmlFor="vegetariano" className="cursor-pointer">Vegetariano</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="vegano" 
                        checked={filters.vegano}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ ...prev, vegano: checked as boolean }))
                        }
                      />
                      <Label htmlFor="vegano" className="cursor-pointer">Vegano</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="semGluten" 
                        checked={filters.semGluten}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ ...prev, semGluten: checked as boolean }))
                        }
                      />
                      <Label htmlFor="semGluten" className="cursor-pointer">Sem Glúten</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="semLactose" 
                        checked={filters.semLactose}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ ...prev, semLactose: checked as boolean }))
                        }
                      />
                      <Label htmlFor="semLactose" className="cursor-pointer">Sem Lactose</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="lowCarb" 
                        checked={filters.lowCarb}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ ...prev, lowCarb: checked as boolean }))
                        }
                      />
                      <Label htmlFor="lowCarb" className="cursor-pointer">Low Carb</Label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetFilters} className="flex-1">
                      Limpar
                    </Button>
                    <Button onClick={applyFilters} className="flex-1 bg-gradient-to-r from-[#FF6F00] to-[#FF3D00] hover:from-[#FF8A00] hover:to-[#FF5722]">
                      Aplicar Filtros
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 gap-2 rounded-full"
                size="default"
              >
                <Lock className="w-4 h-4" />
                Premium
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <X className="w-5 h-5" />
                <p className="font-semibold">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        {!selectedImage && (
          <div className="flex flex-col items-center justify-center text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Descubra receitas incríveis
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Tire uma foto dos seus ingredientes e nossa IA vai sugerir receitas deliciosas que você pode fazer agora mesmo
              </p>
            </div>

            {/* Ícone de Câmera Centralizado */}
            <div className="mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-[#FFE5CC] to-[#FFD4B8] rounded-3xl flex items-center justify-center shadow-lg">
                <Camera className="w-16 h-16 text-[#FF6F00]" />
              </div>
            </div>
            
            {/* Botão Principal */}
            <label htmlFor="image-upload" className="cursor-pointer mb-16">
              <div className="px-8 py-4 bg-gradient-to-r from-[#FF6F00] to-[#FF3D00] hover:from-[#FF8A00] hover:to-[#FF5722] text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3">
                <Upload className="w-6 h-6" />
                Enviar Foto dos Ingredientes
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {/* 3 Passos em Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#FFE5CC] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <div className="text-3xl font-bold text-[#FF6F00]">1</div>
                  </div>
                  <div className="mb-4">
                    <Camera className="w-8 h-8 text-[#FF6F00] mx-auto" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Tire uma foto</h3>
                  <p className="text-sm text-gray-600">
                    Fotografe os ingredientes que você tem em casa
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#FFE5CC] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <div className="text-3xl font-bold text-[#FF6F00]">2</div>
                  </div>
                  <div className="mb-4">
                    <ChefHat className="w-8 h-8 text-[#FF6F00] mx-auto" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">IA analisa</h3>
                  <p className="text-sm text-gray-600">
                    Nossa inteligência artificial identifica os ingredientes
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#FFE5CC] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <div className="text-3xl font-bold text-[#FF6F00]">3</div>
                  </div>
                  <div className="mb-4">
                    <Flame className="w-8 h-8 text-[#FF6F00] mx-auto" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Cozinhe!</h3>
                  <p className="text-sm text-gray-600">
                    Receba receitas personalizadas e comece a cozinhar
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Analysis Loading */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-16 h-16 text-[#FF6F00] animate-spin mb-4" />
            <h3 className="text-2xl font-semibold mb-2 text-gray-900">
              Analisando seus ingredientes...
            </h3>
            <p className="text-gray-600">
              Nossa IA está identificando o que você tem disponível
            </p>
          </div>
        )}

        {/* Results */}
        {selectedImage && !isAnalyzing && recipes.length > 0 && (
          <div className="space-y-8">
            {/* Detected Ingredients */}
            <Card className="border-2 border-[#FF6F00]/30 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[#FF6F00]" />
                  Ingredientes Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {detectedIngredients.map((ingredient, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="px-3 py-1.5 text-sm bg-[#FFE5CC] text-[#FF6F00] border-[#FF6F00]/20"
                    >
                      {ingredient}
                    </Badge>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => {
                    setSelectedImage(null)
                    setRecipes([])
                    setDetectedIngredients([])
                    setError(null)
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Nova Análise
                </Button>
              </CardContent>
            </Card>

            {/* Recipes Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Receitas Sugeridas ({recipes.length})
                </h2>
                <Badge variant="secondary" className="text-sm">
                  5 gratuitas • {recipes.length - 5} premium
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recipes.map((recipe, index) => {
                  const isPremium = index >= 5
                  
                  return (
                    <Card 
                      key={index} 
                      className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 ${
                        isPremium 
                          ? 'border-purple-200 relative' 
                          : 'hover:border-[#FF6F00]/30'
                      }`}
                    >
                      {isPremium && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white gap-1">
                            <Lock className="w-3 h-3" />
                            Premium
                          </Badge>
                        </div>
                      )}
                      
                      <div className={`h-48 bg-gradient-to-br from-[#FF6F00] to-[#FF3D00] relative overflow-hidden ${isPremium ? 'opacity-60' : ''}`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {recipe.nome}
                          </h3>
                          <div className="flex gap-2">
                            <Badge className="bg-white/90 text-gray-900 hover:bg-white">
                              {recipe.dificuldade}
                            </Badge>
                            <Badge className="bg-white/90 text-gray-900 hover:bg-white">
                              {recipe.porcoes} porções
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-6 space-y-4">
                        {/* Quick Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-[#FFE5CC] rounded-xl flex items-center justify-center">
                              <Clock className="w-5 h-5 text-[#FF6F00]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Tempo</p>
                              <p className="font-semibold text-gray-900">
                                {recipe.tempo_preparo_minutos} min
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                              <Flame className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Calorias</p>
                              <p className="font-semibold text-gray-900">
                                {recipe.calorias} kcal
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Content - Blurred for Premium */}
                        <div className={isPremium ? 'relative' : ''}>
                          {isPremium && (
                            <div className="absolute inset-0 backdrop-blur-sm bg-white/50 z-10 flex items-center justify-center">
                              <Button 
                                onClick={handleUpgrade}
                                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 gap-2"
                              >
                                <Lock className="w-4 h-4" />
                                Desbloquear Receita
                              </Button>
                            </div>
                          )}
                          
                          <Tabs defaultValue="ingredientes" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="ingredientes">Ingredientes</TabsTrigger>
                              <TabsTrigger value="preparo">Preparo</TabsTrigger>
                              <TabsTrigger value="nutricao">Nutrição</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="ingredientes" className="space-y-2">
                              <ul className="space-y-1">
                                {recipe.ingredientes.slice(0, isPremium ? 3 : undefined).map((ing, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-[#FF6F00] rounded-full" />
                                    {ing}
                                  </li>
                                ))}
                                {isPremium && recipe.ingredientes.length > 3 && (
                                  <li className="text-sm text-gray-500 italic">
                                    + {recipe.ingredientes.length - 3} ingredientes...
                                  </li>
                                )}
                              </ul>
                            </TabsContent>
                            
                            <TabsContent value="preparo">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {isPremium ? recipe.instrucoes.slice(0, 100) + '...' : recipe.instrucoes}
                              </p>
                            </TabsContent>
                            
                            <TabsContent value="nutricao">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-blue-50 rounded-xl">
                                  <p className="text-xs text-gray-600 mb-1">Proteínas</p>
                                  <p className="text-lg font-bold text-blue-600">
                                    {recipe.proteinas}g
                                  </p>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded-xl">
                                  <p className="text-xs text-gray-600 mb-1">Carboidratos</p>
                                  <p className="text-lg font-bold text-yellow-600">
                                    {recipe.carboidratos}g
                                  </p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-xl">
                                  <p className="text-xs text-gray-600 mb-1">Gorduras</p>
                                  <p className="text-lg font-bold text-green-600">
                                    {recipe.gorduras}g
                                  </p>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>

                        {/* Action Button */}
                        {!isPremium ? (
                          <Button 
                            className="w-full bg-gradient-to-r from-[#FF6F00] to-[#FF3D00] hover:from-[#FF8A00] hover:to-[#FF5722]"
                            onClick={() => window.open(recipe.video_tutorial, '_blank')}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Assistir Vídeo Tutorial
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            className="w-full border-purple-200"
                            onClick={handleUpgrade}
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Desbloquear para Ver Vídeo
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Premium CTA */}
              {recipes.length > 5 && (
                <Card className="mt-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">
                      Desbloqueie {recipes.length - 5} Receitas Premium
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                      Tenha acesso ilimitado a todas as receitas, vídeos tutoriais e filtros avançados. 
                      As receitas premium são ordenadas por menor caloria e menor tempo de preparo!
                    </p>
                    <Button 
                      onClick={handleUpgrade}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 gap-2"
                    >
                      <Lock className="w-5 h-5" />
                      Assinar Premium Agora
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>ReceitAI - Receitas inteligentes com IA • Desenvolvido com tecnologia de ponta</p>
        </div>
      </footer>
    </div>
  )
}
