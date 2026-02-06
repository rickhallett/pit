/**
 * GET /api/poker/engines
 * 
 * Returns available calculation engines and their capabilities.
 */

import { NextResponse } from 'next/server';
import { listEngines, getDefaultEngine } from '@/lib/engines';

interface EngineInfo {
  id: string;
  name: string;
  available: boolean;
  capabilities: {
    maxOpponents: number;
    supportsRanges: boolean;
    exactCalculation: boolean;
    averageSpeedMs: number;
  };
}

interface EnginesResponse {
  engines: EngineInfo[];
  default: string;
}

export async function GET(): Promise<NextResponse<EnginesResponse>> {
  const engines = listEngines();
  const defaultEngine = getDefaultEngine();
  
  const engineInfos: EngineInfo[] = await Promise.all(
    engines.map(async (engine) => {
      const caps = engine.getCapabilities();
      return {
        id: engine.id,
        name: engine.name,
        available: await engine.isAvailable(),
        capabilities: {
          maxOpponents: caps.maxOpponents,
          supportsRanges: caps.supportsRanges,
          exactCalculation: caps.exactCalculation,
          averageSpeedMs: caps.averageSpeedMs,
        },
      };
    })
  );
  
  return NextResponse.json({
    engines: engineInfos,
    default: defaultEngine.id,
  });
}
