import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Landing from './page/landing/Landing'
import Home from './page/Home'
import Message from './page/Message'
import Delivery from './page/Delivery'
import Auth from './page/Auth'
import ContactUs from './page/landing/ContactUs'

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <Router>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/auth' element={<Auth />} />
          <Route path='/contact' element={<ContactUs />} />
          <Route path='/home' element={<Home />} />
          <Route path='/messages' element={<Message />} />
          <Route path='/delivery' element={<Delivery />} />
        </Routes>
      </Router>
  </StrictMode>,
)
