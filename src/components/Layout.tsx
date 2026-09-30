import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.tsx'
import Sidebar from './Sidebar.tsx'

/**
 * Phones: single column + floating bottom nav.
 * Tablets (md): icon rail on the left, wider column.
 * Desktops (lg+): labelled sidebar, content up to 5xl wide.
 * Padding respects notches and home indicators (iOS and Android).
 */
export default function Layout() {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1 pt-[max(2rem,env(safe-area-inset-top))] pr-[max(1.25rem,env(safe-area-inset-right))] pb-[calc(8rem+env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] md:px-8 md:pt-10 md:pb-12 lg:px-12">
        <div className="mx-auto w-full max-w-xl md:max-w-3xl lg:max-w-5xl">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
