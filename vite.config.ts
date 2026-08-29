import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY);

function resendPlugin() {
  return {
    name: 'resend-invite-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/invite' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const { toEmail, toName, role, schemeName, schemeId, inviterName } = data;
              
              if (!toEmail) throw new Error('Missing toEmail');

              const inviteUrl = `http://localhost:3000/join/${schemeId}`;

              const response = await resend.emails.send({
                from: 'Smart Lot <onboarding@resend.dev>',
                to: toEmail,
                subject: `You have been invited to ${schemeName}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <h2>Welcome to Smart Lot!</h2>
                    <p>Hi ${toName},</p>
                    <p><strong>${inviterName}</strong> has invited you to join <strong>${schemeName}</strong> as a <strong>${role}</strong>.</p>
                    <div style="margin: 30px 0;">
                      <a href="${inviteUrl}" style="background-color: #00D4B2; color: #0B1121; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
                  </div>
                `,
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, response }));
            } catch (error: any) {
              console.error('Resend Error:', error);
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
    plugins: [react(), tailwindcss(), resendPlugin()],
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
