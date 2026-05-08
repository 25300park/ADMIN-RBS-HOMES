import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { SearchParams } from '@/types/table'

const parseArrayParam = (param: string | null): (string | number)[] => {
  if (!param) return [];
  return param.split(',').filter(Boolean);
}

export function useTableParams(initialParams: SearchParams) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)
  const [params, setParams] = useState(initialParams)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const newParams: SearchParams = {
      page: Number(searchParams.get('page')) || initialParams.page || 1,
      limit: Number(searchParams.get('limit')) || initialParams.limit || 10,
      search: searchParams.get('search') || initialParams.search || '',
      sort: searchParams.get('sort') || initialParams.sort || 'id',
      order: (searchParams.get('order') as 'asc' | 'desc') || initialParams.order || 'desc',
      level: parseArrayParam(searchParams.get('level')),
      status: parseArrayParam(searchParams.get('status')),
      signupType: parseArrayParam(searchParams.get('signupType')),
      sellType: parseArrayParam(searchParams.get('sellType')),
      startDate: searchParams.get('startDate') || initialParams.startDate,
      endDate: searchParams.get('endDate') || initialParams.endDate,
    }

    // undefined, 빈 값, null, 'null' 문자열, 빈 배열 제거
    Object.keys(newParams).forEach(key => {
      const value = newParams[key]
      if (
        value === undefined || 
        value === '' || 
        value === null || 
        value === 'null' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete newParams[key]
      }
    })

    setParams(newParams)
  }, [searchParams, initialParams])

  const updateParams = useCallback(
    (newParams: Partial<SearchParams>) => {
      const current = new URLSearchParams(searchParams.toString())
      
      Object.entries(newParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            current.set(key, value.join(','))
          } else {
            current.delete(key)
          }
        } else if (value !== undefined && value !== '' && value !== null) {
          current.set(key, String(value))
        } else {
          current.delete(key)
        }
      })

      router.push(`${pathname}?${current.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  return { params, updateParams }
}