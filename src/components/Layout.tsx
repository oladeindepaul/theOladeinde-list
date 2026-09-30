import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.tsx'

export default function Layout() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-bg">
      <main className="px-5 pt-8 pb-32">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
