"use client"

import { AuthProvider } from "@/lib/auth-context"
import { ApiTest } from "@/components/api-test"

export default function ApiTestPage() {
  return (
    <AuthProvider>
      <ApiTest />
    </AuthProvider>
  )
}
