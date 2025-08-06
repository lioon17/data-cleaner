import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// 🧠 Data processing utilities
import { inferTypes as inferFieldTypes } from '@/utils/infer';
import { handleMissing as handleMissingData } from '@/utils/missing';
import { removeExactDuplicates as deduplicateData } from '@/utils/deduplicate';


export async function POST(req) {
  try {
    const { sessionId, config } = await req.json();

    const rawPath = path.join('/tmp', sessionId, 'raw.csv');
    const csvRaw = await fs.readFile(rawPath, 'utf8');
    const parsed = parse(csvRaw, { columns: true, skip_empty_lines: true });

    // 🧠 Infer types
    const types = inferFieldTypes(parsed[0]);

    // 🧹 Clean
    const missingHandled = handleMissingData(parsed, types, config?.missingStrategy || 'impute');
    const deduped = config?.deduplicate ? deduplicateData(missingHandled) : missingHandled;

    // 💾 Save cleaned result
    const sessionDir = path.join('/tmp', sessionId);
    await fs.writeFile(
      path.join(sessionDir, 'cleaned.json'),
      JSON.stringify(deduped, null, 2),
      'utf8'
    );

    await fs.writeFile(
      path.join(sessionDir, 'cleaned.csv'),
      stringify(deduped, { header: true }),
      'utf8'
    );

    return NextResponse.json({
      cleaned: deduped.slice(0, 5),
      total: deduped.length,
    });
  } catch (err) {
    console.error('[CLEAN ERROR]', err);
    return NextResponse.json({ error: 'Failed to clean data' }, { status: 500 });
  }
}
