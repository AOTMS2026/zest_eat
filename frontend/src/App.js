import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import TemplateList from './pages/TemplateList';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';
import WhatsAppConnection from './pages/WhatsAppConnection';
import './App.css';
import './responsive.css';

// Auth guard
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily:'inherit', fontSize:'14px', borderRadius:'10px' },
        success: { iconTheme:{ primary:'#1A7A4A', secondary:'#fff' } },
        error:   { iconTheme:{ primary:'#C8102E', secondary:'#fff' } },
      }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard"       element={<Dashboard />} />
          <Route path="contacts"        element={<Contacts />} />
          <Route path="templates"       element={<TemplateList />} />
          <Route path="campaigns"       element={<Campaigns />} />
          <Route path="analytics"       element={<Analytics />} />
          <Route path="connection"      element={<WhatsAppConnection />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}