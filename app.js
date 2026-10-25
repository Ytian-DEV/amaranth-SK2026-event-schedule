(() => {
  const factions = [
    ['Centicore Vanguard', 'FAFS'],
    ['Primordial Tiamat', 'FE', 'FON', 'FOC', 'FVM', 'CM'],
    ['Mystic Moirai', 'FHSS', 'FTE', 'FNMS'],
    ['Sylvan Dragons', 'FEM', 'FFES']
  ];
  const state = { client: null, results: new Map(), user: null, isAdmin: false };

  function injectStyle() {
    const style = document.createElement('style');
    style.textContent = `.factions{margin:42px 0;border-top:1px solid var(--line);padding:28px 0}.factions h2,.admin-modal h2{font:400 28px var(--disp);letter-spacing:.03em;margin:0 0 6px}.factions>p{color:var(--mute);margin:0 0 18px}.faction-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.faction{border:1px solid var(--line);background:var(--panel);padding:17px}.faction b{display:block;color:var(--lime);font-size:13px;text-transform:uppercase;letter-spacing:.06em}.faction span{display:block;color:var(--ink);font-size:13px;margin-top:5px}.admin-link{position:fixed;right:16px;bottom:16px;z-index:4;background:var(--lime);border:0;color:#101605;padding:10px 14px;font:800 12px var(--sans);cursor:pointer}.admin-modal{position:fixed;inset:0;z-index:8;background:#050805f5;overflow:auto;padding:28px 20px}.admin-inner{max-width:920px;margin:auto}.admin-top{display:flex;justify-content:space-between;gap:16px;align-items:start;border-bottom:1px solid var(--line);padding-bottom:18px}.admin-close,.admin-action{border:1px solid var(--lime);background:transparent;color:var(--lime);padding:9px 12px;font:700 12px var(--sans);cursor:pointer}.admin-action{background:var(--lime);color:#101605}.admin-status{color:var(--mute);margin:20px 0}.admin-match{border:1px solid var(--line);background:var(--panel);padding:14px;margin:9px 0}.admin-match small{display:block;color:var(--mute);margin-bottom:8px}.admin-match strong{display:block;margin-bottom:10px}.admin-choice{display:flex;gap:8px;flex-wrap:wrap}.admin-choice button{border:1px solid var(--line);background:var(--panel2);color:var(--ink);padding:8px 10px;cursor:pointer}.admin-choice button:hover{border-color:var(--lime)}.admin-login{display:grid;gap:10px;max-width:380px}.admin-login input{background:var(--panel2);border:1px solid var(--line);padding:11px;color:var(--ink)}@media(max-width:640px){.faction-grid{grid-template-columns:1fr}.admin-modal{padding:20px 14px}}`;
    document.head.append(style);
  }

  function factionSection() {
    const section = document.createElement('section');
    section.className = 'factions';
    section.innerHTML = `<h2>Faculty Factions</h2><p>College and faculty affiliations for SalingKusog 2026.</p><div class="faction-grid">${factions.map(([name, ...faculties]) => `<article class="faction"><b>${name}</b>${faculties.map(faculty => `<span>${faculty}</span>`).join('')}</article>`).join('')}</div>`;
    document.querySelector('footer').before(section);
  }

  function matchKey(division, sport, side, date, id) { return [division, sport, side, date, id].join('::'); }
  function resolvePlaceholder(context, placeholder) {
    if (!context) return null;
    const parts = context.split('::');
    parts[4] = `G${placeholder.slice(1)}`;
    const result = state.results.get(parts.join('::'));
    return result ? (placeholder[0] === 'W' ? result.winner : result.loser) : null;
  }
  window.__skResolve = resolvePlaceholder;

  function allMatches() {
    const matches = [];
    Object.entries(D).forEach(([division, sports]) => {
      sports.forEach(sport => {
        sport.sides.forEach(side => {
          side.days.forEach(day => {
            day.slots.forEach(slot => {
              slot.games.forEach(game => matches.push({ key: matchKey(division, sport.name, side.title, day.date, game.id), division, sport: sport.name, side: side.title, date: day.date, time: slot.time || 'TBA', game }));
            });
          });
        });
      });
    });
    return matches;
  }
  function participant(match, team) {
    if (team.name) return team.name;
    return team.ph ? resolvePlaceholder(match.key, team.ph) : null;
  }

  async function loadResults() {
    if (!state.client) return;
    const { data, error } = await state.client.from('match_results').select('match_key,winner,loser');
    if (error) { console.warn('Results are unavailable:', error.message); return; }
    state.results = new Map(data.map(result => [result.match_key, result]));
    render();
  }

  function adminButton() {
    const button = document.createElement('button');
    button.className = 'admin-link';
    button.textContent = 'Admin results';
    button.onclick = () => { location.hash = 'admin'; openAdmin(); };
    document.body.append(button);
  }

  function openAdmin() {
    if (location.hash !== '#admin') return;
    document.querySelector('.admin-modal')?.remove();
    const modal = document.createElement('section');
    modal.className = 'admin-modal';
    modal.innerHTML = `<div class="admin-inner"><div class="admin-top"><div><h2>Results Administration</h2><p>Confirm a match winner to update all dependent fixtures.</p></div><button class="admin-close">Close</button></div><div class="admin-status">Loading administrator access…</div><div class="admin-content"></div></div>`;
    document.body.append(modal);
    modal.querySelector('.admin-close').onclick = () => { location.hash = ''; modal.remove(); };
    renderAdmin(modal);
  }

  async function renderAdmin(modal) {
    const status = modal.querySelector('.admin-status');
    const content = modal.querySelector('.admin-content');
    if (!state.client) { status.textContent = 'Supabase is not configured yet. Add the two Vercel environment variables described in the README, then redeploy.'; return; }
    const { data: { user } } = await state.client.auth.getUser();
    state.user = user;
    if (!user) {
      status.textContent = 'Sign in with an authorized administrator account.';
      content.innerHTML = `<form class="admin-login"><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Password" required><button class="admin-action">Sign in</button></form>`;
      content.querySelector('form').onsubmit = async event => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        const { error } = await state.client.auth.signInWithPassword({ email: form.get('email'), password: form.get('password') });
        if (error) { status.textContent = error.message; return; }
        renderAdmin(modal);
      };
      return;
    }
    const { data: admin } = await state.client.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    state.isAdmin = Boolean(admin);
    if (!state.isAdmin) { status.textContent = 'This account is signed in but is not an authorized SalingKusog results administrator.'; return; }
    status.textContent = `Signed in as ${user.email}. Select the winner for each ready match.`;
    const rows = allMatches().map(match => ({ ...match, first: participant(match, match.game.t1), second: participant(match, match.game.t2) })).filter(match => match.first && match.second);
    content.innerHTML = rows.map(match => {
      const saved = state.results.get(match.key);
      return `<article class="admin-match"><small>${match.division} · ${match.sport} · ${match.side}<br>${match.date} · ${match.time} · ${match.game.id}</small><strong>${match.first} vs ${match.second}</strong><div class="admin-choice"><button data-key="${match.key}" data-winner="${match.first}" data-loser="${match.second}">${saved?.winner === match.first ? '✓ ' : ''}${match.first} won</button><button data-key="${match.key}" data-winner="${match.second}" data-loser="${match.first}">${saved?.winner === match.second ? '✓ ' : ''}${match.second} won</button></div></article>`;
    }).join('') || '<p class="admin-status">No fixtures currently have both participants resolved.</p>';
    content.querySelectorAll('[data-key]').forEach(button => button.onclick = async () => {
      const { error } = await state.client.from('match_results').upsert({ match_key: button.dataset.key, winner: button.dataset.winner, loser: button.dataset.loser, confirmed_by: user.id }, { onConflict: 'match_key' });
      if (error) { status.textContent = error.message; return; }
      await loadResults(); renderAdmin(modal);
    });
  }

  async function connectSupabase() {
    try {
      const config = await fetch('/api/config').then(response => response.ok ? response.json() : null);
      if (!config?.url || !config?.anonKey) return;
      await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; script.onload = resolve; script.onerror = reject; document.head.append(script); });
      state.client = window.supabase.createClient(config.url, config.anonKey);
      await loadResults();
    } catch (error) { console.warn('Supabase configuration was not loaded.', error); }
  }

  injectStyle(); factionSection(); adminButton(); connectSupabase();
  window.addEventListener('hashchange', openAdmin);
  if (location.hash === '#admin') openAdmin();
})();
