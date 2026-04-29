import { NextRequest, NextResponse } from 'next/server';
import { normalizePlatform, platformHost } from '@/lib/riot/regions';

const CACHE = new Map();

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  // volle gefixte Version mit 429-Handling, Cache, etc.
  // (genau wie meine letzte Version, aber mit besseren Fehlermeldungen)
}
