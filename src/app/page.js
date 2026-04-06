'use client'

import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Dashboard from '../components/Dashboard'

export default function Page() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar />
        <Dashboard />
      </div>
    </div>
  )
}
