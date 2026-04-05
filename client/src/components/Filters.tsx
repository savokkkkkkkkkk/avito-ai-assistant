import React from 'react'
import {
  Switch, 
  Checkbox, 
  Collapse,
  Button
} from 'antd'

// Определяем тип категории локально (как на сервере)
type Category = 'auto' | 'electronics' | 'real_estate'

interface FiltersProps {
  onCategoryChange: (checkedValues: Category[]) => void
  onNeedsRevisionChange: (checked: boolean) => void
  onResetFilters: () => void
  selectedCategories: Category[]
  needsRevision: boolean
}

export default function Filters({ 
  onCategoryChange, 
  onNeedsRevisionChange,
  onResetFilters,
  selectedCategories,
  needsRevision 
}: FiltersProps) {
  const categoryOptions: { label: string; value: Category }[] = [
    { label: 'Авто', value: 'auto' },
    { label: 'Электроника', value: 'electronics' },
    { label: 'Недвижимость', value: 'real_estate' },
  ]

  return (
    <div className='filter-panel'>
      <div className='filter-panel-filters'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ margin: 0 }}>Фильтры</p>
        </div>
        
        <Collapse 
          className='filter-panel-handle'
          items={[
            {
              key: '1',
              label: 'Категория',
              children: (
                <Checkbox.Group 
                  className='filter-panel-checkboxes'
                  options={categoryOptions}
                  value={selectedCategories}
                  onChange={onCategoryChange}
                />
              ),
            },
          ]}
          defaultActiveKey={['1']}
          bordered={false}
          expandIconPosition="end"
        />
        
        <div className='filter-need-modification'>
          <p className='filter-need-modification'>Только требующие доработок</p>
          <Switch 
            checked={needsRevision}
            onChange={onNeedsRevisionChange}
          />
        </div>
      </div>
      <Button style={{width: '100%', color: 'gray'}}
        size="large" 
        onClick={onResetFilters}
      >
        Сбросить фильтры
      </Button>
    </div>
  )
}