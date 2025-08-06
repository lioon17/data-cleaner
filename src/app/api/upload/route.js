import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || file.type !== 'text/csv') {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const content = await file.text();
    const records = parse(content, { columns: true, skip_empty_lines: true });

    const sessionId = uuidv4();
    const sessionPath = path.join(process.cwd(), 'sessions', sessionId);
    await mkdir(sessionPath, { recursive: true });

    await writeFile(path.join(sessionPath, 'raw.csv'), content);

    return NextResponse.json({
      sessionId,
      rowCount: records.length,
      preview: records.slice(0, 3)
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
