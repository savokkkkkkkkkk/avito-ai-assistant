import React, { useState, useEffect } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  message, 
  Modal
} from 'antd'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import { BulbOutlined, DollarOutlined, ReloadOutlined } from '@ant-design/icons'
import { generateDescription, generatePrice } from '../services/ai'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Item } from '../../../server/src/types'

const { TextArea } = Input

type Category = 'auto' | 'electronics' | 'real_estate'

// Типы для пропсов формы
// type ViewType = 'grid' | 'list'
// type SortType = 'newest' | 'oldest' | 'price_asc' | 'price_desc'

// Тип для состояния загрузки AI
interface AiLoadingState {
  description: boolean
  price: boolean
}

// Тип для данных черновика
interface DraftData {
  category?: Category
  title?: string
  price?: number | null
  description?: string
  savedAt?: string
  [key: string]: unknown
}

// Тип для параметров формы
interface FormValues {
  category: Category
  title: string
  price: number | null
  description?: string
  type?: string
  brand?: string
  model?: string
  color?: string
  condition?: string
  yearOfManufacture?: number
  transmission?: string
  mileage?: number
  enginePower?: number
  address?: string
  area?: number
  floor?: number
}

// Ключ для localStorage
const getDraftKey = (id: string | undefined): string => `draft_${id}`

export default function ItemForm() {
  // Состояния
  const [aiLoading, setAiLoading] = useState<AiLoadingState>({
    description: false,
    price: false
  })
  const [priceModalVisible, setPriceModalVisible] = useState<boolean>(false)
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [price, setPrice] = useState<number | null>(null)

  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm<FormValues>()
  const [selectedCategory, setSelectedCategory] = useState<Category>('electronics')
  
  // Сохранение черновика
  const saveDraft = (values: Partial<FormValues>): void => {
    const draftKey = getDraftKey(id)
    const draftData: DraftData = {
      ...values,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(draftKey, JSON.stringify(draftData))
    console.log('💾 Черновик сохранён')
  }

  // Загрузка черновика
  const loadDraft = (): boolean => {
    const draftKey = getDraftKey(id)
    const savedDraft = localStorage.getItem(draftKey)
    
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as DraftData
        form.setFieldsValue({
          category: draft.category,
          title: draft.title,
          price: draft.price,
          description: draft.description,
          ...draft,
        })
        setPrice(draft.price ?? null)
        setDescription(draft.description || '')
        setSelectedCategory(draft.category || 'electronics')
        message.info(`Загружен черновик от ${new Date(draft.savedAt!).toLocaleString()}`)
        return true
      } catch (error) {
        console.error('Ошибка загрузки черновика:', error)
      }
    }
    return false
  }

  // Удаление черновика
  const clearDraft = (): void => {
    const draftKey = getDraftKey(id)
    localStorage.removeItem(draftKey)
    console.log('🗑️ Черновик удалён')
  }

  // Автосохранение
  const handleFormChange = (): void => {
    const values = form.getFieldsValue()
    if (values.title || values.price || values.description) {
      saveDraft(values)
    }
  }

  // AI функция для генерации описания
  const handleGenerateDescription = async (): Promise<void> => {
    setAiLoading(prev => ({ ...prev, description: true }))
    try {
      const values = form.getFieldsValue()
      const newDescription = await generateDescription(values)
      
      if (newDescription && newDescription !== 'Не удалось сгенерировать описание. Проверьте что Ollama запущен.') {
        let cleanDescription = newDescription
        if (cleanDescription.match(/^\d+\.\s/)) {
          cleanDescription = cleanDescription.replace(/^\d+\.\s*/, '')
        }
        cleanDescription = cleanDescription.replace(/^["']|["']$/g, '')
        
        setDescription(cleanDescription)
        form.setFieldsValue({ description: cleanDescription })
        saveDraft(form.getFieldsValue())
        message.success('Описание сгенерировано!')
      } else {
        message.error('Не удалось сгенерировать описание')
      }
    } catch (error) {
      message.error(`Ошибка: ${error}`)
    } finally {
      setAiLoading(prev => ({ ...prev, description: false }))
    }
  }

  // AI функция для генерации цены
  const handleGeneratePrice = async (): Promise<void> => {
    setAiLoading(prev => ({ ...prev, price: true }))
    try {
      const values = form.getFieldsValue()
      const priceSuggestion = await generatePrice(values)
      
      if (priceSuggestion) {
        setAiPriceSuggestion(priceSuggestion)
        setPriceModalVisible(true)
      } else {
        message.error('Не удалось определить цену')
      }
    } catch (error) {
      message.error(`Ошибка определения цены: ${error}`)
    } finally {
      setAiLoading(prev => ({ ...prev, price: false }))
    }
  }

  // Применение цены из модального окна
  const handleApplyPrice = (): void => {
    const priceMatch = aiPriceSuggestion.match(/\d[\d\s]*\d?/)
    
    if (priceMatch) {
      const newPrice = parseInt(priceMatch[0].replace(/\s/g, ''))
      setPrice(newPrice)
      form.setFieldsValue({ price: newPrice })
      saveDraft(form.getFieldsValue())
      message.success(`Цена установлена: ${newPrice} ₽`)
    } else {
      message.error('Не удалось извлечь цену из ответа AI')
    }
    setPriceModalVisible(false)
  }

  // Загрузка данных объявления
  const { data: item, isLoading, error } = useQuery<Item>({
    queryKey: ['item', id],
    queryFn: () => fetch(`/api/items/${id}`).then(res => res.json()),
  })

  const queryClient = useQueryClient()

  // Мутация для обновления
  const updateMutation = useMutation({
    mutationFn: async (updatedItem: Partial<Item>) => {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      })
      const data = await response.json()
      return data
    },
    onSuccess: async () => {
      clearDraft()
      message.success('Объявление успешно обновлено!')
      await queryClient.invalidateQueries({ queryKey: ['item', id] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      setTimeout(() => {
        navigate(`/ads/${id}`)
      }, 300)
    },
    onError: () => {
      message.error('Ошибка при обновлении')
    },
  })

  // Заполнение формы данными
  useEffect(() => {
    if (item) {
      const draftKey = getDraftKey(id)
      const savedDraft = localStorage.getItem(draftKey)
      
      if (savedDraft) {
        const draft = JSON.parse(savedDraft) as DraftData
        Modal.confirm({
          title: 'Найден черновик',
          content: `Хотите восстановить несохранённые изменения от ${new Date(draft.savedAt!).toLocaleString()}?`,
          okText: 'Восстановить',
          cancelText: 'Отмена',
          onOk: () => {
            loadDraft()
          },
          onCancel: () => {
            clearDraft()
            form.setFieldsValue({
              category: item.category,
              title: item.title,
              price: item.price,
              description: item.description,
              ...item.params,
            })
            setPrice(item.price)
            setDescription(item.description || '')
            setSelectedCategory(item.category)
          }
        })
      } else {
        form.setFieldsValue({
          category: item.category,
          title: item.title,
          price: item.price,
          description: item.description,
          ...item.params,
        })
        setPrice(item.price)
        setDescription(item.description || '')
        setSelectedCategory(item.category)
      }
    }
  }, [item, form, id])

  const handleCategoryChange = (value: Category): void => {
    setSelectedCategory(value)
    const resetFields = ['type', 'brand', 'model', 'color', 'condition', 
      'yearOfManufacture', 'transmission', 'mileage', 'enginePower', 
      'address', 'area', 'floor']
    const resetValues: Partial<FormValues> = {}
    resetFields.forEach(field => { resetValues[field as keyof FormValues] = undefined })
    form.setFieldsValue(resetValues)
    handleFormChange()
  }

  const onFinish = (values: FormValues): void => {
    const { category, title, price, description, ...params } = values
    
    let finalPrice = 0
    if (price !== undefined && price !== null) {
      finalPrice = typeof price === 'number' ? price : Number(price)
    }
    
    const cleanedParams: Record<string, unknown> = {}
    Object.keys(params).forEach(key => {
      const value = params[key as keyof typeof params]
      if (value !== undefined && value !== null && value !== '') {
        cleanedParams[key] = value
      }
    })
    
    const dataToSend: Partial<Item> = {
      category,
      title,
      price: finalPrice,
      description: description || '',
      params: cleanedParams,
    }
    
    updateMutation.mutate(dataToSend)
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 50 }}>Загрузка...</div>
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: 50, color: 'red' }}>
      Ошибка загрузки объявления
    </div>
  }

  return (
    <div className='form-container'>
      <Form 
        className='form'
        layout="vertical"
        form={form}
        onFinish={onFinish}
        onValuesChange={handleFormChange}
      >
        <h1>Редактирование объявления</h1>
        
        {/* Индикатор черновика */}

        
        {/* Категория */}
        <Form.Item 
          className='form-label'
          label="Категория" 
          name="category"
          rules={[{ required: true, message: 'Выберите категорию' }]}
        >
          <Select 
            style={{ width: '40%' }} 
            placeholder='Выберите категорию' 
            onChange={handleCategoryChange}
            options={[
              { label: 'Транспорт', value: 'auto' }, 
              { label: 'Недвижимость', value: 'real_estate' }, 
              { label: 'Электроника', value: 'electronics' },
            ]} 
          />
        </Form.Item>
        
        {/* Название */}
        <Form.Item 
          className='form-label'
          label="Название" 
          name="title"
          rules={[{ required: true, message: 'Введите название товара' }]}
        >
          <Input 
            style={{ width: '40%' }} 
            placeholder="Например: MacBook Pro 16"
          />
        </Form.Item>

        {/* Цена с AI кнопкой */}
        <Form.Item 
          className='form-label'
          label="Цена"  
          name="price" 
          rules={[{ required: true, message: 'Введите цену' }]}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <InputNumber 
              placeholder="Например: 64000" 
              min={0} 
              style={{ width: '40%' }}
              value={price}
              onChange={(value) => {
                setPrice(value)
                form.setFieldsValue({ price: value })
              }}
            />
            <Button 
              className='ai-btns'
              icon={<DollarOutlined />}
              onClick={handleGeneratePrice}
              loading={aiLoading.price}
            >
              Узнать цену
            </Button>
          </div>
        </Form.Item>
        
        {/* Модальное окно с рекомендацией цены */}
        <Modal
          title="Ответ AI:"
          open={priceModalVisible}
          onOk={handleApplyPrice}
          onCancel={() => setPriceModalVisible(false)}
          okText="Применить"
          cancelText="Закрыть"
          width={500}
          footer={null}
        >
          <div style={{ 
            background: '#f0f2f5', 
            padding: '16px', 
            borderRadius: '8px',
            marginTop: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {aiPriceSuggestion.split('\n').map((line, idx) => (
                <p key={idx} style={{ margin: '8px 0' }}>{line}</p>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              className='ai-btns'
              icon={<ReloadOutlined />}
              onClick={handleGeneratePrice}
              loading={aiLoading.price}
            >
              Повторить запрос
            </Button>
          </div>
        </Modal>

        <h2>Характеристики</h2>
        
        {/* Характеристики для электроники */}
        {selectedCategory === 'electronics' && (
          <>
            <Form.Item label="Тип" name="type">
              <Select style={{ width: '40%' }} placeholder="Выберите тип">
                <Select.Option value="phone">Телефон</Select.Option>
                <Select.Option value="laptop">Ноутбук</Select.Option>
                <Select.Option value="misc">Другое</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="Бренд" name="brand">
              <Input style={{ width: '40%' }} placeholder="Например: Apple" />
            </Form.Item>
            
            <Form.Item label="Модель" name="model">
              <Input style={{ width: '40%' }} placeholder="Например: MacBook Pro 16" />
            </Form.Item>
            
            <Form.Item label="Цвет" name="color">
              <Input style={{ width: '40%' }} placeholder="Например: Серый" />
            </Form.Item>
            
            <Form.Item label="Состояние" name="condition">
              <Select style={{ width: '40%' }} placeholder="Выберите состояние">
                <Select.Option value="new">Новое</Select.Option>
                <Select.Option value="used">Б/У</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}

        {/* Характеристики для авто */}
        {selectedCategory === 'auto' && (
          <>
            <Form.Item label="Марка" name="brand">
              <Input style={{ width: '40%' }} placeholder="Например: Toyota" />
            </Form.Item>
            
            <Form.Item label="Модель" name="model">
              <Input style={{ width: '40%' }} placeholder="Например: Camry" />
            </Form.Item>
            
            <Form.Item label="Год выпуска" name="yearOfManufacture">
              <InputNumber style={{ width: '40%' }} placeholder="Например: 2020" min={1900} />
            </Form.Item>
            
            <Form.Item label="Коробка передач" name="transmission">
              <Select style={{ width: '40%' }} placeholder="Выберите КПП">
                <Select.Option value="automatic">Автомат</Select.Option>
                <Select.Option value="manual">Механика</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="Пробег (км)" name="mileage">
              <InputNumber style={{ width: '40%' }} placeholder="Например: 50000" min={0} />
            </Form.Item>
            
            <Form.Item label="Мощность (л.с.)" name="enginePower">
              <InputNumber style={{ width: '40%' }} placeholder="Например: 150" min={0} />
            </Form.Item>
          </>
        )}

        {/* Характеристики для недвижимости */}
        {selectedCategory === 'real_estate' && (
          <>
            <Form.Item label="Тип" name="type">
              <Select style={{ width: '40%' }} placeholder="Выберите тип">
                <Select.Option value="flat">Квартира</Select.Option>
                <Select.Option value="house">Дом</Select.Option>
                <Select.Option value="room">Комната</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="Адрес" name="address">
              <Input style={{ width: '40%' }} placeholder="Например: г. Москва, ул. Тверская 1" />
            </Form.Item>
            
            <Form.Item label="Площадь (м²)" name="area">
              <InputNumber style={{ width: '40%' }} placeholder="Например: 45.5" min={0} step={0.1} />
            </Form.Item>
            
            <Form.Item label="Этаж" name="floor">
              <InputNumber style={{ width: '40%' }} placeholder="Например: 5" min={0} />
            </Form.Item>
          </>
        )}

        {/* Описание с AI кнопкой */}
        <Form.Item 
          className='form-label'
          label="Описание" 
          name="description"
        >
          <div style={{ width: '70%' }}>
            <TextArea 
              style={{ marginBottom: '10px' }}
              rows={4} 
              placeholder="Опишите ваш товар подробнее..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                form.setFieldsValue({ description: e.target.value })
              }}
            />
            <Button 
              icon={<BulbOutlined />}
              onClick={handleGenerateDescription}
              loading={aiLoading.description}
              className='ai-btns'
            >
              Придумать описание
            </Button>
          </div>
        </Form.Item>

        {/* Кнопки управления */}
        <Form.Item>
          <Button 
            className='form-btn'
            type="primary" 
            htmlType="submit"
            style={{ marginRight: 10 }}
            loading={updateMutation.isPending}
          >
            Сохранить
          </Button>
          <NavLink to={`/ads/${id}`}>
            <Button className='form-btn'>
              Отменить
            </Button>
          </NavLink>
        </Form.Item>
      </Form>
    </div>
  )
}