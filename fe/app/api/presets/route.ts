/**
 * GET /api/presets
 * Returns all preset configurations
 */

import { NextResponse } from 'next/server';
import presetsData from '../../../../config/presets.json';

export async function GET() {
  // In production, this might hit a database or external API
  // For now, serve the static JSON
  return NextResponse.json(presetsData);
}
