/**
 * ARCHIVE: poker-tools
 * Created: 2026-02-06
 * Author: Unknown (discovered during The Poker Incident)
 * Status: Orphaned — no MANIFEST.md entry, no project ownership
 * Quality: Technically sound per Analyst review
 * Disposition: Archived for posterity per Kai's decision
 * 
 * This file was removed from pit main branch.
 * If reactivating, create proper project ownership first.
 */

/**
 * GET /api/poker/health
 * 
 * Health check endpoint for the calculation service.
 * Returns status of all registered engines.
 */

import { NextResponse } from 'next/server';
import { listEngines } from '@/lib/engines';

interface EngineHealth {
  status: 'up' | 'down';
  lastCheck: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  engines: Record<string, EngineHealth>;
  timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const engines = listEngines();
  const timestamp = new Date().toISOString();
  
  const engineHealth: Record<string, EngineHealth> = {};
  let healthyCount = 0;
  
  await Promise.all(
    engines.map(async (engine) => {
      try {
        const available = await engine.isAvailable();
        engineHealth[engine.id] = {
          status: available ? 'up' : 'down',
          lastCheck: timestamp,
        };
        if (available) healthyCount++;
      } catch {
        engineHealth[engine.id] = {
          status: 'down',
          lastCheck: timestamp,
        };
      }
    })
  );
  
  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyCount === engines.length) {
    status = 'healthy';
  } else if (healthyCount > 0) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }
  
  const response: HealthResponse = {
    status,
    engines: engineHealth,
    timestamp,
  };
  
  // Return 503 if unhealthy
  const httpStatus = status === 'unhealthy' ? 503 : 200;
  
  return NextResponse.json(response, { status: httpStatus });
}
