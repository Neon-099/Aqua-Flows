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
import StaffMessages from './page/staff/StaffMessages'
import RiderOrders from './page/RiderOrders'
import { AuthProvider } from './contexts/AuthProvider'
import AdminAuth from './page/admin/AdminAuth'
import AdminDashboard from './page/admin/AdminDashboard'
import AdminRoute from './components/admin/AdminRoute'
import StaffRoute from './components/staff/StaffRoute'
import RiderRoute from './components/rider/RiderRoute'


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
            <Route path='/customer/delivery' element={<Delivery />} />
            <Route
              path='/staff/orders'
              element={(
                <StaffRoute>
                  <StaffOrders />
                </StaffRoute>
              )}
            />
            <Route
              path='/staff/messages'
              element={(
                <StaffRoute>
                  <StaffMessages />
                </StaffRoute>
              )}
            />
            <Route
              path='/rider/orders'
              element={(
                <RiderRoute>
                  <RiderOrders />
                </RiderRoute>
              )}
            />
            <Route
              path='/rider/messages'
              element={(
                <RiderRoute>
                  <Message />
                </RiderRoute>
              )}
            />
            <Route path='/admin/auth' element={<AdminAuth />} />
            <Route
              path='/admin/dashboard'
              element={(
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              )}
            />
          </Routes>
        </Router>
    </AuthProvider>
  </StrictMode>,
)
