import type { AISettings, OllamaModel, Hexagram } from '../types'

const DEFAULT_SETTINGS: AISettings = {
  enabled: false,
  ollamaUrl: 'http://localhost:11434',
  model: '',
  temperature: 0.7,
  maxTokens: 1500
}

export function getDefaultAISettings(): AISettings {
  return { ...DEFAULT_SETTINGS }
}

export async function checkOllamaConnection(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch {
    return false
  }
}

export async function getAvailableModels(url: string): Promise<OllamaModel[]> {
  try {
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.models || []
  } catch {
    return []
  }
}

function buildPrompt(
  question: string | null,
  originalHexagram: Hexagram,
  changedHexagram: Hexagram | null,
  movingYaoPositions: number[]
): string {
  const movingYaoText = movingYaoPositions.length > 0
    ? movingYaoPositions.map(p => `第${p + 1}爻`).join('、')
    : '无'

  const changedHexagramText = changedHexagram
    ? `${changedHexagram.name}（${changedHexagram.description || ''}）`
    : '无变卦'

  return `你是一位精通六爻预测的易学大师，请用通俗易懂的语言解读以下卦象。

【用户问题】${question || '用户未提供具体问题，请给出一般性解读'}
【本卦】${originalHexagram.name}：${originalHexagram.description || ''}
【卦辞】${originalHexagram.guaci}
【彖辞】${originalHexagram.tuanci}
【象辞】${originalHexagram.xiangci}
【变卦】${changedHexagramText}
【动爻】${movingYaoText}

请从以下角度解读：
1. 这个卦象整体意味着什么？
2. 针对用户的问题，有什么具体启示？
3. 有什么建议和注意事项？

请用白话文回答，避免使用专业术语，让普通人也能理解。回答控制在500字以内。`
}

export async function generateAIInterpretation(
  settings: AISettings,
  question: string | null,
  originalHexagram: Hexagram,
  changedHexagram: Hexagram | null,
  movingYaoPositions: number[],
  onProgress?: (text: string) => void
): Promise<string> {
  const prompt = buildPrompt(question, originalHexagram, changedHexagram, movingYaoPositions)

  const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.model,
      prompt,
      stream: true,
      options: {
        temperature: settings.temperature,
        num_predict: settings.maxTokens
      }
    }),
    signal: AbortSignal.timeout(120000)
  })

  if (!response.ok) {
    throw new Error(`Ollama请求失败: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  let fullText = ''
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      try {
        const json = JSON.parse(line)
        if (json.response) {
          fullText += json.response
          if (onProgress) {
            onProgress(fullText)
          }
        }
      } catch {
        // Ignore parse errors for incomplete JSON
      }
    }
  }

  return fullText
}

export function getMovingYaoDescription(positions: number[]): string {
  if (positions.length === 0) return '无动爻'
  return positions.map(p => {
    const names = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']
    return names[p]
  }).join('、') + ' 动'
}
