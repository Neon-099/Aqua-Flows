import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Landing from './page/landing/Landing'
import ContactUs from './page/landing/ContactUs'

import Message from './page/customer/Message'
import Delivery from './page/customer/Delivery'
import Order from './page/customer/Order'
import Profile from './page/customer/Profile'

import Auth from './page/Auth'
import StaffOrders from './page/staff/StaffOrders'
import StaffMessages from './page/staff/StaffMessages'
import RiderOrders from './page/RiderOrders'
import { AuthProvider } from './contexts/AuthProvider'
import AdminAuth from './page/admin/AdminAuth'
import AdminDashboard from './page/admin/AdminDashboard'

import AdminRoute from './components/admin/AdminRoute'
import StaffRoute from './components/staff/StaffRoute'
import RiderRoute from './components/rider/RiderRoute'
import CustomerRoute from './components/customer/CustomerRoute'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
        <Router>
          <Routes>
            <Route path='/' element={<Landing />} />
            <Route path='/auth' element={<Auth />} />
            <Route path='/contact' element={<ContactUs />} />
            <Route
              path='/home'
              element={(
                <CustomerRoute>
                  <Delivery />
                </CustomerRoute>
              )}
            />
            <Route
              path='/orders'
              element={(
                <CustomerRoute>
                  <Order />
                </CustomerRoute>
              )}
            />
            <Route
              path='/messages'
              element={(
                <CustomerRoute>
                  <Message />
                </CustomerRoute>
              )}
            />
            <Route
              path='/profile'
              element={(
                <CustomerRoute>
                  <Profile />
                </CustomerRoute>
              )}
            />
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

        <ToastContainer />

    </AuthProvider>
  </StrictMode>,
)
