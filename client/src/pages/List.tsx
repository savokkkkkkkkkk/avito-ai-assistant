import React, { useState, useMemo } from 'react'
import FindForm from '../components/FindForm'
import Filters from '../components/Filters'
import Ads from '../components/Ads'
import { useQuery } from '@tanstack/react-query'
import { Spin } from 'antd'
import type { Item as ItemType } from '../../../server/src/types'

// Типы для сортировки и отображения
type SortType = 'newest' | 'oldest' | 'price_asc' | 'price_desc'
type ViewType = 'grid' | 'list'

type Category = 'auto' | 'electronics' | 'real_estate'

// Расширенный тип для item с needsRevision
type ItemWithRevision = ItemType & {
  needsRevision?: boolean
}

// Тип для ответа API
interface ItemsResponse {
  items: ItemWithRevision[]
  total: number
}

export default function List() {
  const [searchText, setSearchText] = useState<string>('')
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [needsRevision, setNeedsRevision] = useState<boolean>(false)
  const [sortType, setSortType] = useState<SortType>('newest')
  const [viewType, setViewType] = useState<ViewType>('grid')

  const handleResetFilters = () => {
    setSearchText('')
    setSelectedCategories([])
    setNeedsRevision(false)
    setSortType('newest')
  }

  const { data, isLoading, isFetching, error } = useQuery<ItemsResponse>({
    queryKey: ['items'],
    queryFn: () => fetch('/api/items?limit=100').then(res => res.json()),
    refetchOnMount: true
  })

  const sortItems = (items: ItemWithRevision[], sortType: SortType): ItemWithRevision[] => {
    const sorted = [...items]
    
    switch(sortType) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      
      case 'price_asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
      
      case 'price_desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
      
      default:
        return sorted
    }
  }

  const filteredAndSortedItems = useMemo((): ItemWithRevision[] => {
    const items = (data?.items || []) as ItemWithRevision[]
    if (items.length === 0) return []
    
    // Шаг 1: Фильтрация по поиску
    let filtered = items.filter((item) => {
      if (searchText && !item.title.toLowerCase().includes(searchText.toLowerCase())) {
        return false
      }
      return true
    })
    
    // Шаг 2: Фильтрация по категориям
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) => 
        selectedCategories.includes(item.category)
      )
    }
    
    // Шаг 3: Фильтрация по доработкам
    if (needsRevision) {
      filtered = filtered.filter((item) => item.needsRevision === true)
    }
    
    // Шаг 4: Сортировка
    filtered = sortItems(filtered, sortType)
    
    return filtered
  }, [data?.items, searchText, selectedCategories, needsRevision, sortType])
  
  if (isLoading || isFetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin className='spin-container' size="large" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 50, color: 'red' }}>
        Ошибка загрузки объявлений
      </div>
    )
  }

  return (
    <div className='list-container'>
      <h2 className='list-title'>Мои объявления</h2>
      <p className='list-count'>{filteredAndSortedItems.length} объявления</p>
      <FindForm 
        onViewChange={setViewType}
        viewType={viewType}
        onSearch={setSearchText}
        onSortChange={setSortType}
      />
      <div style={{ display: 'flex' }}>
        <Filters 
          onResetFilters={handleResetFilters}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          needsRevision={needsRevision}
          onNeedsRevisionChange={setNeedsRevision}
        />
        <Ads items={filteredAndSortedItems} viewType={viewType}/>
      </div>
    </div>
  )
}