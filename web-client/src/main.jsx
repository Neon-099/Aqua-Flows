import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Landing from './page/landing/Landing'
import Home from './page/Home'
import Message from './page/Message'
import Delivery from './page/Delivery'
import Order from './page/Order'
import Auth from './page/Auth'
import ContactUs from './page/landing/ContactUs'
import StaffOrders from './page/staff/StaffOrders'
import RiderOrders from './page/RiderOrders'
import { AuthProvider } from './contexts/AuthProvider'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
        <Router>
          <Routes>
            <Route path='/' element={<Landing />} />
            <Route path='/auth' element={<Auth />} />
            <Route path='/contact' element={<ContactUs />} />
            <Route path='/home' element={<Home />} />
            <Route path='/orders' element={<Order />} />
            <Route path='/messages' element={<Message />} />
            <Route path='/delivery' element={<Delivery />} />
            <Route path='/staff/orders' element={<StaffOrders />} />
            <Route path='/rider/orders' element={<RiderOrders />} />
          </Routes>
        </Router>
    </AuthProvider>
  </StrictMode>,
)
