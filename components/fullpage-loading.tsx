import { Spin } from 'antd'

export default function FullPageLoading() {
  return (
    <div 
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    >
      <Spin size="large" />
    </div>
  )
}
