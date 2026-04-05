import React from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Spin, Button } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import type { Item as ItemType } from '../../../server/src/types'

// Тип для расширенного item с needsRevision
// interface ItemWithRevision extends ItemType {
//   needsRevision?: boolean
// }

type Category = 'auto' | 'electronics' | 'real_estate'

type ItemWithRevision = ItemType & {
  needsRevision?: boolean
}

// Типы для параметров
type ParamsConfig = Record<string, {
  label: string
  values?: Record<string, string>
  suffix?: string
}>

// Тип для заполненных и пустых параметров
interface ParamsResult {
  filled: Array<{ label: string; value: string }>
  empty: string[]
}

export default function Item() {
  const { id } = useParams<{ id: string }>()

  const { data: item, isLoading, error } = useQuery<ItemWithRevision>({
    queryKey: ['item', id],
    queryFn: () => fetch(`/api/items/${id}`).then(res => res.json()),
  })

  const separateParams = (category: Category, params?: Record<string, unknown>): ParamsResult => {
    const paramsConfig: Record<Category, ParamsConfig> = {
      electronics: {
        type: { label: 'Тип', values: { phone: 'Телефон', laptop: 'Ноутбук', misc: 'Другое' } },
        brand: { label: 'Бренд' },
        model: { label: 'Модель' },
        condition: { label: 'Состояние', values: { new: 'Новое', used: 'Б/У' } },
        color: { label: 'Цвет' }
      },
      auto: {
        brand: { label: 'Марка' },
        model: { label: 'Модель' },
        yearOfManufacture: { label: 'Год выпуска' },
        transmission: { label: 'Коробка передач', values: { automatic: 'Автомат', manual: 'Механика' } },
        mileage: { label: 'Пробег', suffix: ' км' },
        enginePower: { label: 'Мощность', suffix: ' л.с.' }
      },
      real_estate: {
        type: { label: 'Тип', values: { flat: 'Квартира', house: 'Дом', room: 'Комната' } },
        address: { label: 'Адрес' },
        area: { label: 'Площадь', suffix: ' м²' },
        floor: { label: 'Этаж', suffix: ' эт.' }
      }
    }

    const config = paramsConfig[category] || {}
    const filled: Array<{ label: string; value: string }> = []
    const empty: string[] = []

    Object.keys(config).forEach(key => {
      const value = params?.[key]
      const fieldConfig = config[key]
      
      if (value !== undefined && value !== null && value !== '') {
        let displayValue = String(value)
        
        if (fieldConfig.values && fieldConfig.values[displayValue]) {
          displayValue = fieldConfig.values[displayValue]
        }
        
        if (fieldConfig.suffix) {
          displayValue = `${displayValue}${fieldConfig.suffix}`
        }
        
        filled.push({
          label: fieldConfig.label,
          value: displayValue
        })
      } else {
        empty.push(fieldConfig.label)
      }
    })
    
    return { filled, empty }
  }

  const getFormattedDate = (dateString: string): string => {
    if (!dateString) return 'Дата не указана'
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(' в', '')
  }

  if (isLoading) {
    return (
      <Spin className='spin-container' size="large" />
    )
  }

  if (error || !item) {
    return <div>Ошибка загрузки или объявление не найдено</div>
  }

  const { filled, empty } = separateParams(item.category, item.params as Record<string, unknown>)

  return (
    <div className='item-container' style={{ display: 'flex', flexDirection: 'column' }}>
      <div className='item-top'>
        <div className='item-left'>
          <p className='item-title'>{item.title}</p>
          <div className='item-btns'>
            <NavLink style={{ width: 'fit-content' }} to={`/ads/${item.id}/edit`} state={{ item }}>
              <Button type="primary">Редактировать<EditOutlined /></Button>
            </NavLink>
            <NavLink to='/ads'>
              <Button className='item-btn-back'>Назад</Button>
            </NavLink>
          </div>
        </div>
        <div className='item-right'>
          <p className='item-price'>{item.price} ₽</p>
          <p className='item-create-time'>Опубликовано: {getFormattedDate(item.createdAt)}</p>
          <p className='item-create-time'>Отредактировано: {getFormattedDate(item.updatedAt)}</p>
        </div>
      </div>
      
      <div className="item-middle">
        <div className='item-img'>
          <img src="/img/default.png" alt="Изображение товара" />
        </div>
        <div>
          {empty.length !== 0 && (
            <div className='is-need-modifications'>
              <h3>Требуются доработки</h3>
              <p>У объявления не заполнены поля:</p>
              <ul>
                {empty.map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </div>
          )}
          <div className='item-characters'>
            <h3>Характеристики</h3>
            {filled.map((param, idx) => (
              <div className='filled-characters' key={idx}>
                <p className='filled-characters-label'>{param.label}</p>
                <p className='filled-characters-value'>{param.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className='item-descr'>
        <h3>Описание</h3>
        <p>{item.description || 'Отсутствует'}</p>
      </div>
    </div>
  )
}