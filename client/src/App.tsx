// import { useState } from 'react'
import './reset.css'
import './index.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ItemForm from './pages/ItemForm'
import Item from './pages/Item'
import List from './pages/List'

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/ads' element={<List />} />
        <Route path='/ads/:id' element={<Item />} />
        <Route path='/ads/:id/edit' element={<ItemForm />} />
      </Routes>
    </Router>
  )
}

export default App
