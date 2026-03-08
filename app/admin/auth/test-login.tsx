"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function TestLogin() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Test direct API call
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'augustinmaputol@gmail.com',
          password: 'yourpassword', // Replace with actual password
          user_type: 'admin'
        })
      })

      const data = await response.json()
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-2">Debug Login Test</h3>
      <Button onClick={testLogin} disabled={loading} size="sm">
        {loading ? "Testing..." : "Test Login API"}
      </Button>
      {result && (
        <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
