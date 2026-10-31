// scripts/vercel-auth.js
import fs from 'node:fs';
import path from 'node:path';

const CLIENT_ID = 'cl_HYyOPBNtFMfHhaUn9L4QPfTZz6TP47bp';
const AUTH_FILE = path.join(process.cwd(), '.vercel_auth.json');
const DEVICE_FILE = path.join(process.cwd(), '.vercel_device.json');

async function main() {
  console.log('=== Vercel CLI Authentication ===');
  
  let deviceData = null;

  // Verifica se há um device code ativo salvo que ainda não expirou
  if (fs.existsSync(DEVICE_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(DEVICE_FILE, 'utf8'));
      if (Date.now() < saved.created_at + (saved.expires_in * 1000) - 30000) {
        deviceData = saved;
        console.log('Utilizando código de autorização existente ainda válido...');
      }
    } catch {}
  }

  if (!deviceData) {
    const devRes = await fetch('https://api.vercel.com/login/oauth/device-authorization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        scope: 'openid email profile offline_access'
      }).toString()
    });

    if (!devRes.ok) {
      console.error('Falha ao iniciar autorização:', await devRes.text());
      process.exit(1);
    }

    deviceData = await devRes.json();
    deviceData.created_at = Date.now();
    fs.writeFileSync(DEVICE_FILE, JSON.stringify(deviceData, null, 2), 'utf8');
  }

  const { device_code, user_code, verification_uri_complete, interval = 5, expires_in = 600, created_at = Date.now() } = deviceData;

  console.log('\n-----------------------------------------------------------');
  console.log('POR FAVOR, ABRA O LINK ABAIXO NO SEU NAVEGADOR E CONFIRME:');
  console.log(verification_uri_complete);
  console.log('CÓDIGO DE CONFIRMAÇÃO:', user_code);
  console.log('-----------------------------------------------------------\n');
  console.log('Aguardando sua autorização no navegador...');

  const timeoutMs = expires_in * 1000;

  while (Date.now() - created_at < timeoutMs) {
    await new Promise(r => setTimeout(r, interval * 1000));

    try {
      const tokenRes = await fetch('https://api.vercel.com/login/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          device_code: device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        }).toString()
      });

      const tokenData = await tokenRes.json().catch(() => null);

      if (tokenRes.ok && tokenData && tokenData.access_token) {
        console.log('\n✅ Autenticação realizada com sucesso!');
        fs.writeFileSync(AUTH_FILE, JSON.stringify(tokenData, null, 2), 'utf8');
        try { fs.unlinkSync(DEVICE_FILE); } catch {}
        console.log('Token salvo em .vercel_auth.json');
        return;
      }

      if (tokenData && tokenData.error === 'authorization_pending') {
        process.stdout.write('.');
        continue;
      }

      if (tokenData && tokenData.error === 'slow_down') {
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      if (tokenData && (tokenData.error === 'expired_token' || tokenData.error === 'invalid_grant')) {
        console.log('\nCódigo expirou. Gerando novo código...');
        try { fs.unlinkSync(DEVICE_FILE); } catch {}
        return main();
      }

      console.error('\nResposta inesperada:', tokenData);
    } catch (netErr) {
      // Falha temporária de rede/timeout: apenas continua tentando
      process.stdout.write('~');
    }
  }

  console.error('\nTempo limite esgotado. Gerando nova tentativa...');
  try { fs.unlinkSync(DEVICE_FILE); } catch {}
  return main();
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
