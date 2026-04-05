import React, { useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  Input, Select
} from 'antd'
import { 
  UnorderedListOutlined, 
  AppstoreOutlined,
  SearchOutlined 
} from '@ant-design/icons'

// Тип для вида отображения
type ViewType = 'grid' | 'list'

// Тип для сортировки
type SortType = 'newest' | 'oldest' | 'price_asc' | 'price_desc'

interface FindFormProps {
  onSearch: (value: string) => void
  onSortChange: (value: SortType) => void
  onViewChange: (view: ViewType) => void
  viewType: ViewType
}

export default function FindForm({ 
  onSearch, 
  onSortChange, 
  onViewChange, 
  viewType 
}: FindFormProps) {
  const [inputValue, setInputValue] = useState<string>('')

  const handleSearch = (): void => {
    onSearch(inputValue)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      onSearch(inputValue)
    }
  }

  return (
    <div className='ads-panel'>
      <Input 
        className='ads-panel-input'
        placeholder="Найти объявление..."
        value={inputValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        suffix={<SearchOutlined style={{ color: '#bfbfbf' }} onClick={handleSearch}/>}
      />
      
      <div className='ads-panel-display'>
        <AppstoreOutlined 
          className={`handle-grid ${viewType === 'grid' ? 'active' : ''}`}
          onClick={() => onViewChange('grid')}
          style={{ 
            cursor: 'pointer',
            color: viewType === 'grid' ? '#1890ff' : '#666',
            fontSize: '20px'
          }}
        />
        <UnorderedListOutlined 
          className={`handle-list ${viewType === 'list' ? 'active' : ''}`}
          onClick={() => onViewChange('list')}
          style={{ 
            cursor: 'pointer',
            color: viewType === 'list' ? '#1890ff' : '#666',
            fontSize: '20px'
          }}
        />
      </div>
      
      <div className='ads-panel-block-select'>
        <Select 
          className='ads-panel-select' 
          placeholder='По новизне (Сначала новые)' 
          defaultValue='newest'
          onChange={onSortChange}
          options={[
            { label: 'По новизне (сначала новые)', value: 'newest' }, 
            { label: 'По новизне (сначала старые)', value: 'oldest' }, 
            { label: 'По возрастанию цены', value: 'price_asc' },
            { label: 'По убыванию цены', value: 'price_desc' }
          ]} 
        />
      </div>
    </div>
  )
}