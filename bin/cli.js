#!/usr/bin/env node

/**
 * bin/cli.js — OTPost CLI binary
 * Allows running OTPost instantly with: npx otpost
 */

import readline from 'readline';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Colors
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;
const dim = (t) => `\x1b[2m${t}\x1b[0m`;

const banner = `
${cyan('╔══════════════════════════════════════════════════════════╗')}
${cyan('║')}   ${bold('📬 OTPost')} — Zero-Database Instant Email OTP Engine       ${cyan('║')}
${cyan('║')}   ${dim('Free & Unlimited OTP Delivery powered by Gmail SMTP')}    ${cyan('║')}
${cyan('╚══════════════════════════════════════════════════════════╝')}
`;

console.log(banner);

// Parse CLI arguments (--port, --user, --pass, --help)
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  npx otpost [options]

Options:
  --port <number>      Port to run on (default: 4000)
  --user <email>       Gmail sender address
  --pass <password>    Gmail 16-character App Password
  --cors <url>         Allowed frontend origin (default: *)
  --help, -h           Show this help message
  --version, -v        Show version

Examples:
  npx otpost
  npx otpost --port 5000 --user you@gmail.com --pass "abcd efgh ijkl mnop"
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('otpost v1.0.0');
  process.exit(0);
}

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const argPort = getArg('--port') || process.env.PORT || '4000';
const argUser = getArg('--user') || process.env.GMAIL_USER;
const argPass = getArg('--pass') || process.env.GMAIL_APP_PASSWORD;
const argCors = getArg('--cors') || process.env.FRONTEND_URL || '*';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
  let user = argUser;
  let pass = argPass;
  let port = argPort;

  // If credentials are missing in flags and env, prompt interactively
  if (!user) {
    console.log(`${yellow('ℹ Gmail credentials not detected.')}`);
    user = (await ask(`${bold('Enter your Gmail address: ')}`)).trim();
  }

  if (!pass) {
    pass = (await ask(`${bold('Enter your 16-char Gmail App Password: ')}`)).trim();
  }

  rl.close();

  if (!user || !pass) {
    console.log(`\n❌ Error: Both Gmail address and App Password are required to send emails.`);
    console.log(`Get a free App Password at: https://myaccount.google.com/apppasswords\n`);
    process.exit(1);
  }

  // Set environment variables before loading server logic
  process.env.GMAIL_USER = user;
  process.env.GMAIL_APP_PASSWORD = pass;
  process.env.PORT = port;
  process.env.FRONTEND_URL = argCors;

  console.log(`\n${green('✔ Credentials set.')} Starting server on port ${port}...\n`);

  // Dynamically import the single-file engine otpost.js
  const otpostModulePath = path.join(rootDir, 'otpost.js');
  await import(`file://${otpostModulePath.replace(/\\/g, '/')}`);

  setTimeout(() => {
    console.log(`${bold(cyan('📡 API Endpoints Ready:'))}`);
    console.log(`  • ${bold('POST')} http://localhost:${port}/api/v1/auth/request-otp`);
    console.log(`  • ${bold('POST')} http://localhost:${port}/api/v1/auth/verify-otp`);
    console.log(`  • ${bold('GET')}  http://localhost:${port}/api/v1/auth/me`);
    console.log(`  • ${bold('POST')} http://localhost:${port}/api/v1/auth/logout\n`);
    console.log(`${dim('Test sending a code:')}`);
    console.log(`curl -X POST http://localhost:${port}/api/v1/auth/request-otp \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email": "${user}"}'\n`);
  }, 300);
}

run();
