/**
 * Ledger Service
 *
 * Handles all ledger/accounting-related API calls
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

export interface LedgerEntry {
  id: number
  type: "income" | "expense"
  category?: string
  product_id?: number
  quantity?: number
  amount: number
  description: string
  reference?: string
  created_at?: string
  updated_at?: string
}

export interface LedgerFilters {
  type?: "income" | "expense"
  category?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  per_page?: number
}

export interface LedgerSummary {
  total_entries: number
  total_income: number
  total_expenses: number
  net_balance: number
}

export interface LedgerCreatePayload {
  type: "income" | "expense"
  product_id?: number
  quantity?: number
  amount: number
  description: string
  reference?: string
}

export interface PaginatedLedgerResponse {
  data: LedgerEntry[]
  meta?: {
    current_page: number
    per_page: number
    total: number
  }
}

export const ledgerService = {
  /**
   * Get all ledger entries with optional filters
   * GET /api/ledger
   */
  getAll: async (filters?: LedgerFilters): Promise<PaginatedLedgerResponse> => {
    return api.get<PaginatedLedgerResponse>(endpoints.ledger.list(), {
      params: filters,
    })
  },

  /**
   * Create a new ledger entry
   * POST /api/ledger
   */
  create: async (data: LedgerCreatePayload): Promise<LedgerEntry> => {
    return api.post<LedgerEntry>(endpoints.ledger.create(), data)
  },

  /**
   * Get ledger summary (totals)
   * GET /api/ledger/summary
   */
  getSummary: async (): Promise<LedgerSummary> => {
    return api.get<LedgerSummary>(endpoints.ledger.summary())
  },
}
