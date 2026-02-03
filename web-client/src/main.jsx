import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Landing from './page/landing/Landing'
import Home from './page/Home'
import Message from './page/Message'
import Delivery from './page/Delivery'

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <Router>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/home' element={<Home />} />
          <Route path='/messages' element={<Message />} />
          <Route path='/delivery' element={<Delivery />} />
        </Routes>
      </Router>
  </StrictMode>,
)
