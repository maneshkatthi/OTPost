#!/usr/bin/env node

/**
 * scripts/dev.js — One-command launcher for OTPost
 * Runs both server/ and web/ concurrently with clean terminal outputs
 * Automatically checks and installs node_modules if missing.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const webDir = path.join(rootDir, 'web');

// Colors
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;
const magenta = (t) => `\x1b[35m${t}\x1b[0m`;
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;

console.log(`\n${bold(cyan('📬 OTPost Dev Runner'))} — Starting Full-Stack Application...\n`);

// 1. Check if node_modules exist in server and web
function ensureInstalled(dir, name) {
  const nm = path.join(dir, 'node_modules');
  if (!fs.existsSync(nm)) {
    console.log(`${yellow(`[${name}]`)} node_modules missing. Installing dependencies...`);
    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';
    const res = spawn(npmCmd, ['install'], { cwd: dir, stdio: 'inherit', shell: true });
    return new Promise((resolve, reject) => {
      res.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${name} npm install failed with code ${code}`));
      });
    });
  }
  return Promise.resolve();
}

// 2. Check if server/.env exists
const envPath = path.join(serverDir, '.env');
const envExample = path.join(serverDir, '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(envExample)) {
  console.log(`${yellow('[setup]')} Creating server/.env from .env.example`);
  fs.copyFileSync(envExample, envPath);
}

async function start() {
  try {
    await ensureInstalled(serverDir, 'server');
    await ensureInstalled(webDir, 'web');

    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';

    console.log(`${green('✔ Dependencies verified.')}`);
    console.log(`${bold('Starting Server and Web dev processes...')}\n`);

    const serverProc = spawn(npmCmd, ['run', 'dev'], {
      cwd: serverDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    const webProc = spawn(npmCmd, ['run', 'dev'], {
      cwd: webDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    function pipeOutput(stream, prefix, colorFn) {
      stream.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            console.log(`${colorFn(`[${prefix}]`)} ${line}`);
          }
        }
      });
    }

    pipeOutput(serverProc.stdout, 'server', cyan);
    pipeOutput(serverProc.stderr, 'server', red);
    pipeOutput(webProc.stdout, 'web', magenta);
    pipeOutput(webProc.stderr, 'web', red);

    // Handle process termination cleanly
    const cleanup = () => {
      console.log(`\n${yellow('Shutting down dev servers...')}`);
      try { serverProc.kill(); } catch (_) {}
      try { webProc.kill(); } catch (_) {}
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (err) {
    console.error(`${red('Error starting dev servers:')}`, err.message);
    process.exit(1);
  }
}

start();
