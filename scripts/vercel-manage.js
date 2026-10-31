// scripts/vercel-manage.js
import fs from 'node:fs';
import path from 'node:path';

const AUTH_FILE = path.join(process.cwd(), '.vercel_auth.json');

async function getAuth() {
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error('Arquivo .vercel_auth.json não encontrado. Execute scripts/vercel-auth.js primeiro.');
  }
  return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
}

async function api(endpoint, options = {}) {
  const auth = await getAuth();
  const token = auth.access_token;
  const res = await fetch(`https://api.vercel.com${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`API Error [${res.status}] ${endpoint}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('=== Gerenciando Projetos Vercel ===');

  // 1. Listar usuário
  const user = await api('/v2/user');
  console.log(`Logado como: ${user.user.email} (${user.user.name || user.user.username})`);

  // 2. Listar projetos
  const { projects } = await api('/v9/projects');
  console.log('\nProjetos encontrados:', projects.length);
  for (const p of projects) {
    console.log(`- Nome: ${p.name} | ID: ${p.id} | Framework: ${p.framework} | Git: ${p.link?.repoSlug || 'nenhum'}`);
  }

  // 3. Localizar projetos relacionados a minhavitrineonline
  const vitrineProjects = projects.filter(p => p.name.includes('minhavitrineonline') || p.name.includes('vitrine'));

  if (vitrineProjects.length === 0) {
    console.log('\nNenhum projeto encontrado com o nome minhavitrineonline. Criando projeto...');
    const newProj = await api('/v10/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'minhavitrineonline',
        gitRepository: {
          type: 'github',
          repo: 'eddylimasp2021/minhavitrineonline'
        }
      })
    });
    console.log(`Projeto criado: ${newProj.name} (${newProj.id})`);
    vitrineProjects.push(newProj);
  }

  // Escolhe o projeto principal (preferencialmente com o repo eddylimasp2021/minhavitrineonline ou com nome exato)
  let mainProject = vitrineProjects.find(p => p.name === 'minhavitrineonline' && p.link?.repoSlug === 'eddylimasp2021/minhavitrineonline')
    || vitrineProjects.find(p => p.link?.repoSlug === 'eddylimasp2021/minhavitrineonline')
    || vitrineProjects.find(p => p.name === 'minhavitrineonline')
    || vitrineProjects[0];

  console.log(`\n===> Projeto Principal Selecionado: ${mainProject.name} (ID: ${mainProject.id})`);

  // Se houver mais de um projeto e algum for duplicado/sem link ou temporário
  for (const p of vitrineProjects) {
    if (p.id !== mainProject.id) {
      console.log(`Projeto extra identificado: ${p.name} (${p.id})`);
    }
  }

  // 4. Configurar variáveis de ambiente do Supabase
  console.log('\nConfigurando Variáveis de Ambiente no Projeto Principal...');
  const envVars = [
    { key: 'VITE_SUPABASE_URL', value: 'https://ggsdxkwwcobobjrqujem.supabase.co' },
    { key: 'VITE_SUPABASE_ANON_KEY', value: 'sb_publishable_hTU4O9c7SoYD-EI-b8zPkQ_Vmy817sT' },
    { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: 'sb_publishable_hTU4O9c7SoYD-EI-b8zPkQ_Vmy817sT' },
    { key: 'SUPABASE_URL', value: 'https://ggsdxkwwcobobjrqujem.supabase.co' },
    { key: 'SUPABASE_PUBLISHABLE_KEY', value: 'sb_publishable_hTU4O9c7SoYD-EI-b8zPkQ_Vmy817sT' },
    { key: 'SUPABASE_ANON_KEY', value: 'sb_publishable_hTU4O9c7SoYD-EI-b8zPkQ_Vmy817sT' },
    { key: 'NITRO_PRESET', value: 'vercel' },
    { key: 'DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS', value: '1' }
  ];

  const existingEnvs = await api(`/v10/projects/${mainProject.id}/env`);
  const existingMap = new Map((existingEnvs.envs || []).map(e => [e.key, e.id]));

  for (const ev of envVars) {
    if (existingMap.has(ev.key)) {
      const envId = existingMap.get(ev.key);
      await api(`/v10/projects/${mainProject.id}/env/${envId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          value: ev.value,
          target: ['production', 'preview', 'development']
        })
      });
      console.log(`Variável atualizada: ${ev.key}`);
    } else {
      await api(`/v10/projects/${mainProject.id}/env`, {
        method: 'POST',
        body: JSON.stringify({
          key: ev.key,
          value: ev.value,
          type: 'plain',
          target: ['production', 'preview', 'development']
        })
      });
      console.log(`Variável criada: ${ev.key}`);
    }
  }

  // 5. Verificar domínios
  console.log('\nVerificando domínios...');
  const { domains } = await api(`/v9/projects/${mainProject.id}/domains`);
  console.log('Domínios configurados:', domains.map(d => d.name));

  const targetDomain = 'minhavitrineonline.vercel.app';
  const hasDomain = domains.some(d => d.name === targetDomain);
  if (!hasDomain) {
    console.log(`Adicionando domínio ${targetDomain}...`);
    try {
      await api(`/v9/projects/${mainProject.id}/domains`, {
        method: 'POST',
        body: JSON.stringify({ name: targetDomain })
      });
      console.log(`Domínio ${targetDomain} adicionado com sucesso!`);
    } catch (err) {
      console.warn(`Aviso ao adicionar domínio: ${err.message}`);
    }
  }

  // 6. Listar últimos deploys ou disparar redeploy
  console.log('\nVerificando últimos deploys...');
  const { deployments } = await api(`/v6/deployments?projectId=${mainProject.id}&limit=3`);
  if (deployments && deployments.length > 0) {
    const latest = deployments[0];
    console.log(`Último deploy: ${latest.url} | Estado: ${latest.state || latest.status}`);
  }

  // Criar novo deploy
  console.log('\nDisparando deploy da branch main atualizada...');
  try {
    const deployRes = await api('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify({
        name: mainProject.name,
        project: mainProject.id,
        gitSource: {
          type: 'github',
          ref: 'main',
          repoId: mainProject.link?.repoId
        }
      })
    });
    console.log(`🚀 Deploy disparado com sucesso!`);
    console.log(`ID: ${deployRes.id}`);
    console.log(`URL do Deploy: https://${deployRes.url}`);
    console.log(`Inspetor Vercel: https://${deployRes.inspectorUrl || 'vercel.com'}`);
  } catch (err) {
    console.log('Deploy automático via API:', err.message);
  }

  console.log('\n=== Concluído! ===');
}

main().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
