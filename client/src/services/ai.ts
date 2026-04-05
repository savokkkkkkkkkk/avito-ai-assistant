// client/src/services/ai.ts

// Типы для параметров товара
type Category = 'auto' | 'electronics' | 'real_estate'

interface ItemParams {
  brand?: string
  model?: string
  yearOfManufacture?: number
  transmission?: 'automatic' | 'manual'
  mileage?: number
  enginePower?: number
  type?: 'phone' | 'laptop' | 'misc'
  condition?: 'new' | 'used'
  color?: string
  address?: string
  area?: number
  floor?: number
}

interface ItemForAI {
  category: Category
  title: string
  price: number | null
  params?: ItemParams
}

const OLLAMA_URL = '/ollama/api/generate'
const MODEL = 'qwen2.5:3b'

// Генерация описания
export const generateDescription = async (item: ItemForAI): Promise<string> => {
  const prompt = `Напиши описание для товара: ${item.title}. Цена: ${item.price} руб. 100-500 слов. Не пиши лишнего, только текст описания.`

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: MODEL, 
        prompt: prompt, 
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 200
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json() as { response: string }
    return data.response
  } catch (error) {
    console.error('Ошибка генерации описания:', error)
    return 'Не удалось сгенерировать описание.'
  }
}

// Определение рыночной цены
export const generatePrice = async (item: ItemForAI): Promise<string> => {
  const prompt = `
Ты эксперт по оценке товаров на Avito. Проанализируй товар и дай рекомендацию по цене.

Товар:
Категория: ${item.category}
Название: ${item.title}
${item.params ? `Характеристики: ${JSON.stringify(item.params)}` : ''}

Ответь ТОЛЬКО в таком формате (используй эмодзи):
- Диапазон цен: XXXX - XXXX ₽ — описание состояния
- От XXXX ₽ — описание состояния
- XXXX – XXXX ₽ — описание состояния

Пример ответа:
- 115 000 – 135 000 ₽ — отличное состояние, минимальные следы использования
- От 140 000 ₽ — идеальное состояние, малый износ АКБ
- 90 000 – 110 000 ₽ — срочная продажа или с дефектами

Не пиши никаких вступлений и пояснений. Только три пункта с ценами.
`

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        model: MODEL, 
        prompt: prompt, 
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 200
        }
      })
    })
    
    const data = await response.json() as { response: string }
    return data.response || 'Не удалось определить цену'
  } catch (error) {
    console.error('Ошибка определения цены:', error)
    return 'Не удалось определить цену'
  }
}