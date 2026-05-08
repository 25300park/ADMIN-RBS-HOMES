'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Input, Button, message } from 'antd'
import { signIn } from 'next-auth/react'
import { login } from './action'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    setError('')
    
    try {
      const result = await login(values.email, values.password)
      if (result.error) {
        setError(result.message || 'An error occurred during login')
        return
      }

      const signInResult = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: '/',
      })

      if (signInResult?.error) {
        setError('An error occurred during login process')
        return
      }

      router.push('/')
      router.refresh()

    } catch (error) {
      setError('A server error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#f0f2f5' 
    }}>
      <Card title="RBS Homes Login" style={{ width: 400 }}>
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          {error && (
            <div style={{ color: '#ff4d4f', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <Form.Item
            label="E-mail"
            name="email"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}