# API Endpoints Integration Guide

This project already ships with:
- `endpoints.txt` (OpenAPI 3.0 spec from the backend)
- `lib/api-endpoints.ts` (app endpoints used by `services/*` with `lib/api-client.ts`)
- `config/api-endpoints.ts` (admin/vendor auth endpoints used by `lib/axios-client.ts`)
- `lib/api-client.ts` (Axios wrapper with auth + version handling)
- `config/env.ts` (API base URL and version env vars)

Use the steps below to wire new endpoints from `endpoints.txt` into the app.

---

## Step 1) Verify API base URL and version
Check `.env.local` (or `.env.example`) and confirm these values:

- `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000/api`)
- `NEXT_PUBLIC_API_VERSION` (default: `v1`)

The request URL is built as:

`baseUrl + '/' + version + endpoint`

So endpoint strings in code should NOT include `/api` or `/v1`.

---

## Step 2) Choose the endpoint registry
There are two endpoint registries in this project:

- `lib/api-endpoints.ts`
  - Used by app services like `services/product.service.ts`
  - Works with `lib/api-client.ts`
- `config/api-endpoints.ts`
  - Used by `lib/axios-client.ts` and `services/auth-jwt.service.ts`
  - Focused on admin/vendor auth flows

Pick the one that matches your service code path and keep usage consistent.

### POS auth endpoints
For POS login/register flows, use the POS auth service so pages don’t hardcode URLs:

- `services/auth-jwt.service.ts` (`authService.pos.*`)
  - Uses `config/api-endpoints.ts` VENDOR auth endpoints
  - Intended for POS auth pages (`app/pos/auth/*`)

---

## Step 3) Translate endpoints from `endpoints.txt`
`endpoints.txt` is OpenAPI JSON with paths like:

- `/api/auth/login`
- `/api/products/{id}`

Translate them into the registry format:

- `/api/auth/login` -> `/auth/login`
- `/api/products/{id}` -> `/products/:id`

Example addition to `lib/api-endpoints.ts`:

```ts
// Auth Endpoints
export const authEndpoints = {
  login: () => "/auth/login",
  register: () => "/auth/register",
}

// Product Endpoints
export const productEndpoints = {
  get: (id: string | number) => buildUrl("/products/:id", { id }),
}
```

---

## Step 4) Add or update a service
Create a service in `services/` that uses `lib/api-client.ts` and the endpoints registry.

Example `services/customer.service.ts`:

```ts
import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"
import { Customer, PaginatedResponse } from "@/types"

export const customerService = {
  list: async () => api.get<PaginatedResponse<Customer>>(endpoints.customers.list()),
  getById: async (id: string | number) => api.get<Customer>(endpoints.customers.get(id)),
}
```

---

## Step 5) Use the service in components

```tsx
import { useEffect, useState } from "react"
import { customerService } from "@/services"
import type { Customer } from "@/types"

export default function CustomerList() {
  const [items, setItems] = useState<Customer[]>([])

  useEffect(() => {
    customerService.list().then((data) => setItems(data.data ?? []))
  }, [])

  return <pre>{JSON.stringify(items, null, 2)}</pre>
}
```

---

## Step 5.1) POS auth example (login/register)

```ts
import { authService } from "@/services/auth-jwt.service"

// Login
await authService.pos.login({
  email,
  password,
  user_type: "vendor",
})

// Register
await authService.pos.register({
  business_name,
  email,
  password,
  password_confirmation,
  subscription_plan,
  user_type: "vendor",
})
```

---

## Step 6) Add/update types
Create or update types in `types/` based on the response schemas from `endpoints.txt`.

Example `types/customer.ts`:

```ts
export interface Customer {
  id: number
  name: string
  email: string
}
```

---

## Step 7) Validate
- Run `npm run dev`
- Open the page and confirm requests in DevTools > Network
- If the URL looks wrong, double-check `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_VERSION`, and the endpoint path string

---

## Notes
- Avoid hardcoding endpoints in components. Always use `lib/api-endpoints.ts` or `config/api-endpoints.ts`.
- `lib/api-client.ts` automatically prepends the API version when `NEXT_PUBLIC_API_VERSION` is set.
- If the backend uses a different prefix, update `.env.local` instead of changing code.
