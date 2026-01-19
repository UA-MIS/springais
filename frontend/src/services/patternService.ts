import type { CareerGraphData } from '@/data/mockCareerGraphData'
import { mockCareerGraphData } from '@/data/mockCareerGraphData'

export type FetchCareerGraphParams = {
  employeeCurrentRoleId?: string
}

/**
 * STEP-2 (Block K): returns mock data.
 *
 * STEP-3 (Block P): replace this with an authenticated API call to:
 * - GET /api/patterns/graph
 * and keep the response contract identical to CareerGraphData.
 *
 * NOTE: Block P docs reference `api` from Block M. When that exists, implement:
 *   const data = await api.get<CareerGraphData>('/api/patterns/graph', { params })
 */
export async function fetchCareerGraph(params: FetchCareerGraphParams = {}): Promise<CareerGraphData> {
  // Simulate small latency so loading states are visible during dev.
  await new Promise((r) => setTimeout(r, 150))

  if (!params.employeeCurrentRoleId) return mockCareerGraphData

  return {
    ...mockCareerGraphData,
    employeeCurrentRole: params.employeeCurrentRoleId,
  }
}

