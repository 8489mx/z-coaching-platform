import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { STRESS_TEST_CLIENTS, CLINICAL_MASTER_BLUEPRINTS } from './src/data/stressTestClientsBlueprints.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load catalogs once at server boot
let exercises = [];
let packages = [];
let mobility = [];

try {
  const exPath = path.resolve(__dirname, '../data/settings/exercises_catalog.json');
  if (fs.existsSync(exPath)) {
    exercises = JSON.parse(fs.readFileSync(exPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load exercises catalog', e);
}

try {
  const pkgPath = path.resolve(__dirname, '../data/settings/subscription_packages.json');
  if (fs.existsSync(pkgPath)) {
    packages = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load packages catalog', e);
}

try {
  const mobPath = path.resolve(__dirname, './src/data/mobilityCatalog.json');
  if (fs.existsSync(mobPath)) {
    mobility = JSON.parse(fs.readFileSync(mobPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load mobility catalog', e);
}

function mockApiPlugin() {
  return {
    name: 'mock-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost:3000');
        const pathname = urlObj.pathname;

        const handleRequest = (body = {}) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');

          if (pathname === '/api/v1/auth/login-email') {
            return res.end(JSON.stringify({
              token: 'mock-jwt-token-coach',
              user: {
                id: 1,
                full_name: 'كابتن كريم زكريا',
                email: body.email || 'coach@zcoaching.com',
                role: 'COACH'
              }
            }));
          }

          if (pathname === '/api/v1/auth/login-fast') {
            const clientCode = String(body.client_code || '1');
            const matched = STRESS_TEST_CLIENTS.find(c => String(c.client_code) === clientCode || String(c.id) === clientCode) || STRESS_TEST_CLIENTS[0];
            return res.end(JSON.stringify({
              token: 'mock-jwt-token-client',
              user: {
                id: matched?.id || 1,
                client_code: matched?.client_code || '1',
                full_name: matched?.full_name || 'أحمد محمود العوضي',
                phone_number: matched?.phone_number || body.phone_number || '01011111101',
                role: 'CLIENT'
              }
            }));
          }

          if (pathname === '/api/v1/clients' || pathname === '/api/v1/subscriptions/overview') {
            return res.end(JSON.stringify({
              clients: STRESS_TEST_CLIENTS
            }));
          }

          if (pathname === '/api/v1/intake/submissions') {
            const subs = STRESS_TEST_CLIENTS.slice(0, 6).map((c, idx) => ({
              id: c.id,
              client_code: c.client_code,
              client_name: c.full_name,
              phone: c.phone_number,
              tier: c.package_name,
              primary_goal: c.primary_goal,
              goal_label: c.goal_label,
              has_injury: Array.isArray(c.injuries) && c.injuries.length > 0,
              hasInjury: Array.isArray(c.injuries) && c.injuries.length > 0,
              created_at: new Date(Date.now() - idx * 86400000).toISOString(),
              status: c.queue_status || 'PENDING_REVIEW'
            }));
            return res.end(JSON.stringify({ submissions: subs }));
          }

          if (pathname === '/api/v1/programs/checkin/pending') {
            return res.end(JSON.stringify({ checkins: [] }));
          }

          if (pathname === '/api/v1/programs/cycles/attention') {
            return res.end(JSON.stringify({ count: 0, ended_count: 0, clients: [] }));
          }

          if (pathname === '/api/v1/programs/active' || pathname === '/api/v1/programs') {
            const defaultProgram = CLINICAL_MASTER_BLUEPRINTS['1'] || {};
            return res.end(JSON.stringify({
              programs: [
                {
                  id: 1,
                  client_code: '1',
                  program_data: defaultProgram
                }
              ]
            }));
          }

          if (pathname.startsWith('/api/v1/programs/')) {
            const param = pathname.split('/').pop();
            const prog = CLINICAL_MASTER_BLUEPRINTS[param] || CLINICAL_MASTER_BLUEPRINTS['1'] || {};
            return res.end(JSON.stringify({
              program: prog,
              client: STRESS_TEST_CLIENTS.find(c => String(c.client_code) === param || String(c.id) === param) || STRESS_TEST_CLIENTS[0]
            }));
          }

          if (pathname === '/api/v1/exercises') {
            return res.end(JSON.stringify({ exercises }));
          }

          if (pathname === '/api/v1/mobility') {
            return res.end(JSON.stringify({ mobility_drills: mobility }));
          }

          if (pathname === '/api/v1/settings/packages') {
            return res.end(JSON.stringify({ packages }));
          }

          return res.end(JSON.stringify({
            success: true,
            message: 'تمت العملية بنجاح'
          }));
        };

        const isBodyMethod = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH';
        const hasContent = req.headers['content-length'] && Number(req.headers['content-length']) > 0;

        if (isBodyMethod && hasContent) {
          let rawData = '';
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            let parsed = {};
            try {
              if (rawData) parsed = JSON.parse(rawData);
            } catch {}
            handleRequest(parsed);
          };

          req.on('data', chunk => { rawData += chunk; });
          req.on('end', finish);
          req.on('error', finish);
          setTimeout(finish, 300); // 300ms fail-safe timeout
        } else {
          handleRequest({});
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {}
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  }
});
