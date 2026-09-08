import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

function mailtrapPlugin() {
  return {
    name: 'mailtrap-email-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/email' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const token = process.env.MAILTRAP_API_TOKEN || 'b68d42639db12dd9c3a52f87968d94de';
              const inboxId = process.env.MAILTRAP_INBOX_ID || '4900976';
              
              const toEmail = data.toEmail || data.managerEmail;
              if (!toEmail) throw new Error('Missing recipient email (toEmail or managerEmail)');

              const toList = [{ email: toEmail, name: data.toName || data.requestorName || 'Recipient' }];
              const ccList = data.requestorEmail && data.managerEmail ? [{ email: data.requestorEmail }] : undefined;

              const mailtrapPayload: Record<string, any> = {
                from: { email: 'notifications@smartlot.app', name: 'SmartLot' },
                to: toList,
                subject: data.subject || `[SmartLot] Notification`,
                html: data.html || `<p>${data.description || 'SmartLot Notification'}</p>`,
                category: data.category || `smartlot-${data.type || 'invite'}`,
              };

              if (ccList && ccList.length > 0) {
                mailtrapPayload.cc = ccList;
              }
              if (data.referenceId) {
                mailtrapPayload.headers = {
                  'Reply-To': `requests+${String(data.referenceId).replace('#', '')}@mail.smartlot.app`
                };
              }

              const response = await fetch(`https://sandbox.api.mailtrap.io/api/send/${inboxId}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(mailtrapPayload)
              });

              const result = await response.json();
              if (!response.ok) {
                console.error('[Vite Mailtrap Relay Error]:', result);
                res.statusCode = response.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: result }));
                return;
              }

              console.log(`[Vite Mailtrap Relay] 📬 Email sent to Sandbox Inbox #${inboxId}:`, result);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, result }));
            } catch (error: any) {
              console.error('[Vite Mailtrap Relay Error]:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), mailtrapPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

// Vite config

// Build: Asset Optimization and Chunk Splitting