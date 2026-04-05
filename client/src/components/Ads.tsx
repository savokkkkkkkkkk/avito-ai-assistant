import React, { useState } from 'react'
import Ad from './Ad'
import { Pagination } from 'antd'
import type { Item } from '../../../server/src/types'

interface AdsProps {
  items: Item[]
  viewType?: 'grid' | 'list'
}

export default function Ads({ items, viewType = 'grid' }: AdsProps) {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize: number = 10
  
  const start: number = (currentPage - 1) * pageSize
  const currentItems: Item[] = items.slice(start, start + pageSize)

  // Если нет объявлений
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', width: '100%' }}>
        Нет объявлений
      </div>
    )
  }

  return (
    <div>
      <div className={viewType === 'grid' ? 'ads-list' : 'ads-list-list'}>
        {currentItems.map((item: Item) => (
          <Ad 
            key={item.id} 
            item={item} 
            viewType={viewType}
          />
        ))}
      </div>
      
      <Pagination
        current={currentPage}
        total={items.length}
        pageSize={pageSize}
        onChange={(page: number) => setCurrentPage(page)}
        style={{ marginTop: '20px', textAlign: 'center' }}
      />
    </div>
  )
}