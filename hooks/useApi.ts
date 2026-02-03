'use client';

import { useState, useCallback } from 'react'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

interface UseFetchOptions {
  headers?: Record<string, string>
}

export function useApi<T>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    loading: false,
  })

  const fetch = useCallback(async (url: string, options?: UseFetchOptions): Promise<T | null> => {
    setState({ data: null, error: null, loading: true })
    try {
      const response = await window.fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }

      const data = await response.json()
      setState({ data, error: null, loading: false })
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState({ data: null, error: errorMessage, loading: false })
      return null
    }
  }, [])

  const post = useCallback(
    async (url: string, body: any, options?: UseFetchOptions): Promise<T | null> => {
      setState({ data: null, error: null, loading: true })
      try {
        const response = await window.fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`)
        }

        const data = await response.json()
        setState({ data, error: null, loading: false })
        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        setState({ data: null, error: errorMessage, loading: false })
        return null
      }
    },
    []
  )

  const patch = useCallback(
    async (url: string, body: any, options?: UseFetchOptions): Promise<T | null> => {
      setState({ data: null, error: null, loading: true })
      try {
        const response = await window.fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`)
        }

        const data = await response.json()
        setState({ data, error: null, loading: false })
        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        setState({ data: null, error: errorMessage, loading: false })
        return null
      }
    },
    []
  )

  const delete_ = useCallback(async (url: string, options?: UseFetchOptions): Promise<T | null> => {
    setState({ data: null, error: null, loading: true })
    try {
      const response = await window.fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }

      const data = await response.json()
      setState({ data, error: null, loading: false })
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState({ data: null, error: errorMessage, loading: false })
      return null
    }
  }, [])

  return {
    ...state,
    fetch,
    post,
    patch,
    delete: delete_,
  }
}
