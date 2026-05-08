'use client'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, theme } from 'antd'
import type { ThemeConfig } from 'antd';

const config: ThemeConfig = {
 token: {
  //  colorBgContainer: 'var(--background)',
  //  colorText: 'var(--foreground)', 
  //  colorBorder: 'var(--foreground)',
  //  colorBgElevated: 'var(--background)',
  //  colorBgLayout: 'var(--background)',
  //  // 메뉴 관련
  //  colorBgBase: 'var(--background)',
  //  colorPrimary: 'var(--foreground)',
  //  colorSplit: 'var(--foreground)',
 },
}

export function AntdProvider({ children }: { children: React.ReactNode }) {
 return (
   <AntdRegistry>
     <ConfigProvider theme={config}>
       {children}
     </ConfigProvider>
   </AntdRegistry>
 )
}