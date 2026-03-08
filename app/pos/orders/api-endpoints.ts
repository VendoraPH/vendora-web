/**
 * POS Order Endpoints
 *
 * Thin wrappers around the centralized app endpoints for POS order flows.
 */

import { endpoints } from "@/lib/api-endpoints"

export const posOrderEndpoints = {
  list: () => endpoints.orders.list(),
  get: (id: string | number) => endpoints.orders.get(id),
  create: () => endpoints.orders.create(),
  update: (id: string | number) => endpoints.orders.update(id),
  patch: (id: string | number) => endpoints.orders.update(id),
  delete: (id: string | number) => endpoints.orders.delete(id),
}

export default posOrderEndpoints
