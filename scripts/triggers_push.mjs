#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: './.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS triggers_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      route text NOT NULL,
      event text NOT NULL,
      description text,
      group_name text,
      created_at timestamptz DEFAULT now() NOT NULL
    );
  `);
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS triggers_events_route_event_unique ON triggers_events (route, event);`);
}

function singularize(segment) {
  if (!segment) return segment;
  if (segment.endsWith('ies')) return segment.slice(0, -3) + 'y';
  if (segment.endsWith('s')) return segment.slice(0, -1);
  return segment;
}

function buildEventsForResource(resource) {
  const known = {
    messages: [
      ['message.created', 'Mensagem criada'],
      ['message.updated', 'Mensagem atualizada'],
    ],
    conversations: [
      ['conversation.created', 'Conversa criada'],
      ['conversation.updated', 'Conversa atualizada'],
      ['conversation.closed', 'Conversa encerrada'],
      ['conversation.transferred', 'Conversa transferida'],
    ],
    calls: [
      ['call.started', 'Chamada iniciada'],
      ['call.ended', 'Chamada finalizada'],
    ],
  };

  if (known[resource]) return known[resource];
  const singular = singularize(resource);
  return [
    [`${singular}.created`, `${singular} created`],
    [`${singular}.updated`, `${singular} updated`],
  ];
}

function parseServerRoutes() {
  const routesFile = path.resolve(process.cwd(), 'server', 'routes.ts');
  const content = fs.readFileSync(routesFile, 'utf-8');

  const importRegex = /import\s+(\w+)\s+from\s+"(\.\/routes\/[^"]+)"/g;
  const imports = {};
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    imports[m[1]] = m[2];
  }

  const useRegex = /app.use\(([^,]+),\s*([^\)]+)\)/g;
  const mappings = [];
  while ((m = useRegex.exec(content)) !== null) {
    const rawPath = m[1].trim();
    const handler = m[2].trim();
    const pathMatch = rawPath.match(/^['\"](.+)['\"]$/);
    const routePath = pathMatch ? pathMatch[1] : rawPath;

    let handlerName = handler.replace(/;?$/, '').trim();
    const callMatch = handlerName.match(/(\w+)\s*\(/);
    if (callMatch) handlerName = callMatch[1];

    mappings.push({ routePath, handlerName });
  }

  const routesDir = path.resolve(process.cwd(), 'server', 'routes');
  const files = fs.existsSync(routesDir) ? fs.readdirSync(routesDir).filter(f => f.endsWith('.ts') || f.endsWith('.js')) : [];

  const resources = new Map();

  for (const mapp of mappings) {
    const { routePath, handlerName } = mapp;
    let resource = '';
    if (imports[handlerName]) {
      const imp = imports[handlerName];
      resource = path.basename(imp);
    } else {
      const segs = routePath.split('/').filter(Boolean);
      resource = segs[segs.length - 1] || segs[0] || routePath.replace(/\//g, '_');
    }
    if (!resources.has(resource)) resources.set(resource, new Set());
    resources.get(resource).add(routePath);
  }

  for (const f of files) {
    const name = path.basename(f, path.extname(f));
    if (!resources.has(name)) resources.set(name, new Set([`/api/${name}`]));
  }

  return resources;
}

function parseRouteFileTags(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const groupMatch = content.match(/^\/\/\s*@triggers\.group:\s*(.+)$/m);
    const groupName = groupMatch ? groupMatch[1].trim() : null;

    const eventRegex = /^\/\/\s*@triggers\.event:\s*([^|]+)\|\s*(.+)$/mg;
    const events = [];
    let m;
    while ((m = eventRegex.exec(content)) !== null) {
      events.push([m[1].trim(), m[2].trim()]);
    }

    return { groupName, events };
  } catch (err) {
    return { groupName: null, events: [] };
  }
}

async function upsertTriggers() {
  const client = await pool.connect();
  try {
    console.log('[triggers:push] ensuring triggers_events table exists');
    await ensureTable(client);
    // ensure group_name column exists (in case table was created earlier without it)
    try {
      await client.query(`ALTER TABLE triggers_events ADD COLUMN IF NOT EXISTS group_name text;`);
    } catch (err) {
      // ignore
    }

    const resources = parseServerRoutes();

    for (const [resource, routesSet] of resources) {
      // try to parse tags from a route file if available
      let filePath = path.resolve(process.cwd(), 'server', 'routes', `${resource}.ts`);
      if (!fs.existsSync(filePath)) filePath = path.resolve(process.cwd(), 'server', 'routes', `${resource}.js`);

      let parsedTags = { groupName: null, events: [] };
      if (fs.existsSync(filePath)) {
        parsedTags = parseRouteFileTags(filePath);
      }

      const events = parsedTags.events && parsedTags.events.length > 0 ? parsedTags.events : buildEventsForResource(resource);
      const groupName = parsedTags.groupName || (resource ? resource.charAt(0).toUpperCase() + resource.slice(1) : 'Default');

      for (const routePath of routesSet) {
        for (const [eventName, description] of events) {
          const res = await client.query(
            'INSERT INTO triggers_events (route, event, description, group_name) VALUES ($1, $2, $3, $4) ON CONFLICT (route, event) DO UPDATE SET description = EXCLUDED.description, group_name = EXCLUDED.group_name RETURNING id',
            [routePath, eventName, description, groupName]
          );
          if (res.rows && res.rows.length > 0) {
            console.log(`[triggers:push] upserted ${eventName} -> ${routePath} (id=${res.rows[0].id})`);
          }
        }
      }
    }

    console.log('[triggers:push] done.');
  } catch (err) {
    console.error('[triggers:push] error:', err?.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

upsertTriggers();
