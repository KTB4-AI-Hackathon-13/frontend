import { Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <div className="layout">
      {/* 공통 헤더 자리 */}
      <main className="layout__main">
        <Outlet />
      </main>
      {/* 공통 푸터 자리 */}
    </div>
  )
}

export default AppLayout
