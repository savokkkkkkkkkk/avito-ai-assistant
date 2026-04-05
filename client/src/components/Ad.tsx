import React from 'react'
import { NavLink } from 'react-router-dom'
import type { Item } from '../../../server/src/types'

// Объединяем тип Item с дополнительным полем needsRevision
type AdItem = Item & {
  needsRevision?: boolean
}

interface AdProps {
  item: AdItem
  viewType?: 'grid' | 'list'
}

export default function Ad({ item, viewType = 'grid' }: AdProps) {
  const getCategoryName = (category: Item['category']): string => {
    const categories: Record<Item['category'], string> = {
      'electronics': 'Электроника',
      'auto': 'Автомобили',
      'real_estate': 'Недвижимость'
    }
    return categories[category] || category
  }

  // Отображение в виде списка
  if (viewType === 'list') {
    return (
      <NavLink 
        to={`/ads/${item.id}`} 
        state={{ item }} 
        style={{ textDecoration: 'none' }}
      >
        <div className='ad-card-list'>
          <img 
            src="/img/default.png" 
            alt="Изображение товара" 
            className='ad-image-list' 
          />
          <div className='ad-content-list'>
            <div>
              <p className='ad-category-list'>{getCategoryName(item.category)}</p>
              <p className='ad-title-list'>{item.title}</p>
            </div>
            <p className='ad-price-list'>
              {item.price?.toLocaleString()} ₽
            </p>
            {item.needsRevision && (
              <div className='revision-badge'>
                • Требует доработок
              </div>
            )}
          </div>
        </div>
      </NavLink>
    )
  }

  // Отображение в виде сетки (по умолчанию)
  return (
    <NavLink 
      to={`/ads/${item.id}`} 
      state={{ item }}
    >
      <div className='ad-card'>
        <img 
          src="/img/default.png" 
          alt="Изображение товара" 
        />
        <p className='ad-category'>{getCategoryName(item.category)}</p>
        <p className='ad-title'>{item.title}</p>
        <p className='ad-price'>
          {item.price?.toLocaleString()} ₽
        </p>
        {item.needsRevision && (
          <div className='revision-badge'>
            • Требует доработок
          </div>
        )}
      </div>
    </NavLink>
  )
}