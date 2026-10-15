/* Centro de Enfermería Santa Inés · Sistema de gestión
 * Aplicación de una sola página. Datos, ingreso y archivos en Supabase.
 * Estructura: utilidades → catálogos → reglas de servicios → datos (Supabase)
 * → vistas → fichas y formularios → eventos → ingreso y arranque.
 */
'use strict';
/* ===================== utilidades ===================== */
const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const today = () => ymd(new Date());
const wd = s => parseD(s).getDay();
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const uuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const SEMANA = [[1, 'Lu'], [2, 'Ma'], [3, 'Mi'], [4, 'Ju'], [5, 'Vi'], [6, 'Sa'], [0, 'Do']];
const SEMANA_L = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const fd = s => { if (!s) return '—'; const d = parseD(s); return `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`; };
const fds = s => { if (!s) return '—'; const d = parseD(s); return `${d.getDate()} ${MES[d.getMonth()]}`; };
function fRange(a, b) {
  if (!a) return '—';
  if (!b) return `Desde ${fd(a)} · sin término`;
  if (a === b) return fd(a);
  return parseD(a).getFullYear() === parseD(b).getFullYear() ? `${fds(a)} – ${fd(b)}` : `${fd(a)} – ${fd(b)}`;
}
function getPath(o, p) { return String(p).split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) {
  const ks = String(p).split('.'); let cur = o;
  ks.forEach((k, i) => {
    if (i === ks.length - 1) { cur[k] = v; return; }
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = /^\d+$/.test(ks[i + 1]) ? [] : {};
    cur = cur[k];
  });
  return v;
}

/* ===================== catálogos ===================== */
const TURNOS = {
  manana: { l: 'Mañana', h: '07–13 h', b: 'M' },
  tarde: { l: 'Tarde', h: '13–19 h', b: 'T' },
  dia: { l: 'Día 12 h', h: '07–19 h', b: 'MT' },
  noche: { l: 'Noche 12 h', h: '19–07 h', b: 'N' },
  h24: { l: '24 horas', h: '07–07 h', b: 'MTN' },
};
const blocksOverlap = (a, b) => !!(TURNOS[a] && TURNOS[b]) && [...TURNOS[a].b].some(x => TURNOS[b].b.includes(x));
const CATEG = { lic: 'Licenciado(a) en enfermería', tec: 'Técnico(a) en enfermería', aux: 'Auxiliar / cuidador(a)' };
const CATEG_S = { lic: 'Licenciado(a)', tec: 'Técnico(a)', aux: 'Auxiliar' };
const TIPO_DOC = { DNI: 'DNI', CI: 'Cédula de identidad (extranjero)', CE: 'Carné de extranjería', CPP: 'PTP / CPP', PAS: 'Pasaporte' };
const TIPO_DOC_S = { DNI: 'DNI', CI: 'CI', CE: 'CE', CPP: 'CPP', PAS: 'Pas.' };
const DOC_TIPOS = ['CV', 'Diploma', 'Título', 'Colegiatura (CEP)', 'Certificado', 'Antecedentes', 'Copia de documento', 'Constancia de trabajo', 'Otro'];
const DOC_TIPOS_C = ['Copia de documento', 'Informe médico', 'Receta', 'Contrato', 'Otro'];
const EXP_TIPOS = ['Clínica', 'Hospital', 'Familia (domicilio)', 'Centro de enfermería', 'Otro'];
const GRAV = { leve: 'Leve', moderada: 'Moderada', grave: 'Grave' };
const GRAV_T = { leve: 'warn', moderada: 'esp', grave: 'bad' };
const DIAG_SUG = ['Alzheimer', 'Parkinson', 'Secuela de ACV', 'Post operatorio', 'Fractura de cadera', 'Diabetes', 'Pie diabético', 'Úlceras por presión', 'Paciente oncológico', 'Cuidados paliativos', 'Traqueostomía', 'Sonda nasogástrica', 'Gastrostomía (PEG)', 'Oxigenoterapia', 'Insuficiencia renal', 'EPOC', 'Hipertensión arterial', 'Demencia senil', 'Paciente postrado', 'Puérpera y recién nacido'];
const DISTRITOS = ['Ate', 'Barranco', 'Breña', 'Callao', 'Carabayllo', 'Cercado de Lima', 'Chorrillos', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pueblo Libre', 'Puente Piedra', 'Rímac', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'];
const ST = { activo: ['Activo', 'ok'], programado: ['Programado', 'est'], porcerrar: ['Por cerrar', 'warn'], finalizado: ['Finalizado', ''], cancelado: ['Cancelado', 'bad'] };
const COLS = ['personal', 'clientes', 'servicios', 'incidentes'];
const BUCKET = 'archivos';
const MAX_BYTES = 25 * 1024 * 1024;

const ICONS = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  svc: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 11h6M9 15h4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.6.2 4.4 1.9 5 5.4"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7.3a4.1 4.1 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.3v.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  calplus: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  undo: '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
  logout: '<path d="M9 4H5v16h4"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/>',
};
const ic = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ===================== estado ===================== */
const S = {
  session: null, email: '', meName: '',
  personal: new Map(), clientes: new Map(), servicios: new Map(), incidentes: new Map(),
  loaded: new Set(), lastLoad: 0, channel: null, view: 'inicio',
  q: { personal: '', clientes: '', servicios: '', incidentes: '' },
  f: { personal: 'todos', clientes: 'todos', servicios: 'todos', tipo: 'todos', gravedad: 'todos', turno: '' },
  period: { kind: 'mes', anchor: today() }, selBucket: undefined,
};
try { const v = localStorage.getItem('si-view'); if (v && ['inicio', 'servicios', 'personal', 'clientes', 'incidentes'].includes(v)) S.view = v; } catch (e) { }

/* ===================== reglas de servicio ===================== */
function svcRange(s) {
  if (!s || s.estado === 'cancelado' || !s.fechaInicio) return null;
  let end = s.fechaFin || null;
  const c = s.cierre && s.cierre.fecha;
  if (c && (!end || c < end)) end = c;
  return { start: s.fechaInicio, end };
}
function spanOf(s) {
  const r = svcRange(s); if (!r) return null;
  const dias = (s.tipo === 'estable' && Array.isArray(s.dias) && s.dias.length) ? s.dias.map(Number) : null;
  return { start: r.start, end: r.end, dias, turno: s.turno };
}
const onDay = (sp, d) => !!sp && d >= sp.start && (!sp.end || d <= sp.end) && (!sp.dias || sp.dias.includes(wd(d)));
const overlaps = (sp, a, b) => !!sp && sp.start <= b && (!sp.end || sp.end >= a);
/* Primer día en que dos períodos se cruzan en días y bloques de turno (o null). */
function firstClash(a, b) {
  if (!a || !b || !blocksOverlap(a.turno, b.turno)) return null;
  const st = a.start > b.start ? a.start : b.start;
  const en = a.end && b.end ? (a.end < b.end ? a.end : b.end) : (a.end || b.end);
  if (en && en < st) return null;
  let d = st;
  for (let i = 0; i < 7 && (!en || d <= en); i++, d = addDays(d, 1)) if (onDay(a, d) && onDay(b, d)) return d;
  return null;
}
function svcStatus(s, t) {
  if (s.estado === 'cancelado') return 'cancelado';
  if (s.cierre) return 'finalizado';
  if (s.fechaInicio > t) return 'programado';
  if (s.fechaFin && s.fechaFin < t) return 'porcerrar';
  return 'activo';
}
function svcDays(s, capDay) {
  const sp = spanOf(s); if (!sp) return 0;
  let end = sp.end;
  if (!end || (capDay && end > capDay)) end = capDay;
  if (!end || end < sp.start) return 0;
  const n = daysBetween(sp.start, end) + 1;
  if (!sp.dias) return n;
  let c = 0; for (let i = 0; i < n && i < 2000; i++) if (sp.dias.includes(wd(addDays(sp.start, i)))) c++;
  return c;
}
function staffClashes(pid, sp, excludeId) {
  const out = [];
  for (const s of S.servicios.values()) {
    if (s.id === excludeId || !(s.personalIds || []).includes(pid)) continue;
    const d = firstClash(sp, spanOf(s));
    if (d) out.push({ s, d });
  }
  return out.sort((a, b) => a.d.localeCompare(b.d));
}
function nextCode() {
  const y = new Date().getFullYear(); let mx = 0;
  for (const s of S.servicios.values()) { const m = /^SI-(\d{4})-(\d+)$/.exec(s.codigo || ''); if (m && +m[1] === y) mx = Math.max(mx, +m[2]); }
  return `SI-${y}-${String(mx + 1).padStart(4, '0')}`;
}
function diasTxt(d) {
  const s = [...new Set((d || []).map(Number))];
  if (!s.length) return 'Sin días';
  if (s.length === 7) return 'Todos los días';
  const k = s.slice().sort((a, b) => a - b).join(',');
  if (k === '1,2,3,4,5') return 'Lunes a viernes';
  if (k === '1,2,3,4,5,6') return 'Lunes a sábado';
  return SEMANA.filter(([n]) => s.includes(n)).map(([, l]) => l).join(', ');
}

/* ===================== índice ===================== */
let IDX = null;
function idx() {
  if (IDX) return IDX;
  const t = today(); const sp = new Map(), sc = new Map(), ip = new Map(), ic2 = new Map(), is = new Map(), busy = new Map(), next = new Map();
  const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };
  for (const s of S.servicios.values()) {
    s._st = svcStatus(s, t);
    for (const p of s.personalIds || []) {
      push(sp, p, s);
      if (s._st === 'activo') push(busy, p, s);
      if (s._st === 'programado' && (!next.has(p) || next.get(p).fechaInicio > s.fechaInicio)) next.set(p, s);
    }
    for (const c of s.clienteIds || []) push(sc, c, s);
  }
  for (const i of S.incidentes.values()) {
    for (const p of i.personalIds || []) push(ip, p, i);
    for (const c of i.clienteIds || []) push(ic2, c, i);
    if (i.servicioId) push(is, i.servicioId, i);
  }
  return (IDX = { sp, sc, ip, ic: ic2, is, busy, next, t });
}

/* ===================== Supabase: conexión ===================== */
const CFG = window.SANTA_INES_CONFIG || {};
const CONFIG_OK = /^https:\/\/[^\s]+$/.test(CFG.supabaseUrl || '') && !/TU-PROYECTO/i.test(CFG.supabaseUrl || '') && (CFG.supabaseAnonKey || '').length > 20 && !/TU-CLAVE/i.test(CFG.supabaseAnonKey || '');
const RECOVERY_LINK = /type=recovery/.test(location.hash) || /type=recovery/.test(location.search);
const sb = (CONFIG_OK && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(CFG.supabaseUrl.replace(/\/+$/, ''), CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

/* ===================== Supabase: tablas ===================== */
const TABLES = {
  personal: { fields: ['nombres', 'apellidos', 'tipoDoc', 'numDoc', 'nacionalidad', 'fechaNac', 'telefono', 'email', 'direccion', 'distrito', 'referencia', 'emergNombre', 'emergTel', 'categoria', 'cep', 'fechaIngreso', 'estado', 'turnos', 'dias', 'especiales', 'dispNotas', 'diagnosticos', 'experiencia', 'documentos', 'notas', 'ejemplo'], dates: ['fechaNac', 'fechaIngreso'] },
  clientes: { fields: ['nombres', 'apellidos', 'tipoDoc', 'numDoc', 'fechaNac', 'telefono', 'email', 'direccion', 'distrito', 'referencia', 'condicion', 'respNombre', 'respParentesco', 'respTel', 'documentos', 'notas', 'ejemplo'], dates: ['fechaNac'] },
  servicios: { fields: ['codigo', 'tipo', 'clienteIds', 'personalIds', 'direccion', 'fechaInicio', 'fechaFin', 'turno', 'dias', 'indicaciones', 'estado', 'cierre', 'extensiones', 'ejemplo'], dates: ['fechaInicio', 'fechaFin'] },
  incidentes: { fields: ['servicioId', 'fecha', 'gravedad', 'motivo', 'causa', 'descripcion', 'acciones', 'personalIds', 'clienteIds', 'evidencias', 'ejemplo'], dates: ['fecha'] },
};
const toSnake = k => k.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
const toCamel = k => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
function fromRow(r) { const o = {}; for (const [k, v] of Object.entries(r || {})) o[toCamel(k)] = v; return o; }
function toRow(col, data) {
  const T = TABLES[col]; const r = {};
  for (const f of T.fields) {
    if (!(f in data)) continue;
    let v = data[f]; if (v === undefined) v = null;
    if (T.dates.includes(f) && !v) v = null;
    r[toSnake(f)] = v;
  }
  return r;
}
const isTransient = e => !!e && (!e.code || /fetch|network|timeout/i.test(e.message || '')) && !/JWT|row-level/i.test(e.message || '');
async function run(build) {
  let res = await build();
  if (res.error && isTransient(res.error)) { await sleep(500 + Math.random() * 700); res = await build(); }
  if (res.error) throw res.error;
  return res.data;
}
async function fetchAll(col) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const data = await run(() => sb.from(col).select('*').order('creado', { ascending: true }).order('id', { ascending: true }).range(from, from + 999));
    rows.push(...data);
    if (data.length < 1000) break;
  }
  S[col] = new Map(rows.map(r => { const o = fromRow(r); return [o.id, o]; }));
}
function upsertLocal(col, row) { const o = fromRow(row); S[col].set(o.id, o); scheduleRender(); return o; }
async function persist(col, id, data) {
  const row = toRow(col, data);
  const out = await run(() => (id ? sb.from(col).update(row).eq('id', id) : sb.from(col).insert(row)).select().single());
  return upsertLocal(col, out).id;
}
async function patch(col, id, data) {
  const row = toRow(col, data);
  const out = await run(() => sb.from(col).update(row).eq('id', id).select().single());
  upsertLocal(col, out);
}
async function removeDoc(col, id) { await run(() => sb.from(col).delete().eq('id', id)); S[col].delete(id); scheduleRender(); }
async function loadAll() {
  try {
    await Promise.all(COLS.map(fetchAll));
    COLS.forEach(c => S.loaded.add(c)); S.lastLoad = Date.now(); scheduleRender();
  } catch (e) {
    console.warn(e);
    main.innerHTML = `${mtop()}<div class="empty"><p><b>No se pudieron cargar los datos.</b></p><p class="small">${esc(dbMsg(e))}</p><button type="button" class="btn pri" data-a="reload">Reintentar</button></div>`;
  }
}
const refetchTimers = {};
function queueRefetch(col) {
  clearTimeout(refetchTimers[col]);
  refetchTimers[col] = setTimeout(() => { fetchAll(col).then(() => scheduleRender()).catch(e => console.warn(e)); }, 350);
}
function subscribeRealtime() {
  if (S.channel) { sb.removeChannel(S.channel); S.channel = null; }
  let ch = sb.channel('santa-ines-cambios');
  for (const t of COLS) ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => queueRefetch(t));
  ch.subscribe();
  S.channel = ch;
}
function dbMsg(e) {
  const c = (e && e.code) || ''; const m = (e && e.message) || ''; const d = (e && e.details) || '';
  if (c === '23505') return /codigo/i.test(m + d) ? 'Ese código de servicio ya existe. Vuelve a intentarlo.' : 'Ya existe un registro con ese número de documento.';
  if (c === '42501' || /row-level security|permission denied/i.test(m)) return 'Tu cuenta no tiene permiso de administrador.';
  if (c === 'PGRST116') return 'No se encontró el registro o no tienes permiso para cambiarlo.';
  if (c === 'PGRST301' || c === 'PGRST303' || /JWT/i.test(m)) return 'Tu sesión expiró. Vuelve a ingresar.';
  if (c === 'PGRST205' || c === 'PGRST202' || c === '42P01' || c === '42883') return 'Faltan las tablas del sistema en Supabase. Ejecuta el archivo supabase/01_esquema.sql en el SQL Editor.';
  if (c === '23514') return 'Algún dato no es válido. Revisa las fechas y los campos obligatorios.';
  if (/^22/.test(c)) return 'Hay un dato con formato inválido. Revisa las fechas.';
  if (/fetch|network/i.test(m)) return 'Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  return 'No se pudo completar la operación' + (m ? `: ${m}` : '.');
}

/* ===================== Supabase: archivos ===================== */
const SIGNED = new Map(); const pendingSign = new Set(); let signTimer = null;
function signedNow(p) { const s = SIGNED.get(p); return s && s.exp > Date.now() + 60000 ? s.url : null; }
function applyUrl(el, u) { if (el.tagName === 'IMG') { if (el.getAttribute('src') !== u) el.src = u; } else if (el.getAttribute('href') !== u) el.href = u; }
function hydrateFiles(root = document) {
  if (!root || !root.querySelectorAll) return;
  for (const el of root.querySelectorAll('[data-fpath]')) { const p = el.dataset.fpath; const u = signedNow(p); if (u) applyUrl(el, u); else pendingSign.add(p); }
  if (pendingSign.size && !signTimer) signTimer = setTimeout(flushSign, 30);
}
async function flushSign() {
  signTimer = null; const paths = [...pendingSign]; pendingSign.clear();
  if (!paths.length || !sb) return;
  try {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(paths, 6 * 3600);
    if (error || !data) return;
    const exp = Date.now() + 6 * 3600 * 1000;
    for (const r of data) if (r && r.signedUrl && !r.error) SIGNED.set(r.path, { url: r.signedUrl, exp });
    for (const el of document.querySelectorAll('[data-fpath]')) { const u = signedNow(el.dataset.fpath); if (u) applyUrl(el, u); }
  } catch (e) { console.warn(e); }
}
function removeFiles(list) {
  const paths = (list || []).map(d => (typeof d === 'string' ? d : d && d.path)).filter(Boolean);
  if (paths.length && sb) sb.storage.from(BUCKET).remove(paths).catch(() => { });
}

/* ===================== textos / piezas ===================== */
const pName = p => p ? `${p.nombres || ''} ${p.apellidos || ''}`.trim() || 'Sin nombre' : 'Personal eliminado';
const cName = c => c ? `${c.nombres || ''} ${c.apellidos || ''}`.trim() || 'Sin nombre' : 'Cliente eliminado';
const docLabel = o => o && o.numDoc ? `${TIPO_DOC_S[o.tipoDoc] || o.tipoDoc || 'Doc.'} ${o.numDoc}` : 'Sin documento';
const ini = o => (((o && o.nombres) || '?').charAt(0) + ((o && o.apellidos) || '').charAt(0)).toUpperCase();
const av = (o, cls = '') => `<span class="av ${cls}" aria-hidden="true">${esc(ini(o))}</span>`;
const pill = (txt, tone = '') => `<span class="pill ${tone}">${txt}</span>`;
const exTag = o => o && o.ejemplo ? '<span class="ex">Ejemplo</span>' : '';
const blocks = t => { const b = (TURNOS[t] || { b: '' }).b; return `<span class="tb" aria-hidden="true"><i class="${b.includes('M') ? 'on' : ''}"></i><i class="${b.includes('T') ? 'on' : ''}"></i><i class="${b.includes('N') ? 'on' : ''}"></i></span>`; };
const turnoTag = t => TURNOS[t] ? `<span class="tt">${blocks(t)}<span>${TURNOS[t].l} <span class="muted small">${TURNOS[t].h}</span></span></span>` : '<span class="muted">Sin turno</span>';
const tipoBadge = s => s.tipo === 'especial' ? pill('Especial', 'esp') : pill('Turno estable', 'est');
const stPill = s => { const [l, t] = ST[s._st || 'activo']; return pill(l, t); };
const clientsOf = s => (s.clienteIds || []).map(id => cName(S.clientes.get(id))).join(', ') || 'Sin cliente';
const staffOf = s => (s.personalIds || []).map(id => pName(S.personal.get(id))).join(', ') || 'Sin personal asignado';
const byName = f => (a, b) => f(a).localeCompare(f(b), 'es');
const chips = (g, list) => list.map(([v, l]) => `<button type="button" class="chip" data-a="flt" data-g="${g}" data-v="${v}" aria-pressed="${S.f[g] === v}">${l}</button>`).join('');
const empty = (msg, act, lbl) => `<div class="empty"><p>${msg}</p>${act ? `<button type="button" class="btn pri" data-a="${act}">${ic('plus')} ${lbl}</button>` : ''}</div>`;
const isImg = d => (d.contentType || '').startsWith('image/') && !/heic|heif/i.test(d.contentType || '');
const fileLink = (d, cls, inner) => `<a class="${cls}" data-fpath="${esc(d.path)}" href="#" target="_blank" rel="noopener" title="${esc(d.nombre)}">${inner}</a>`;
function fileIcon(d) {
  if (isImg(d)) return `<span class="fi"><img data-fpath="${esc(d.path)}" alt="" loading="lazy"></span>`;
  return `<span class="fi">${ic((d.contentType || '').startsWith('video/') ? 'video' : 'file', 20)}</span>`;
}
function filesView(arr, big) {
  if (!arr || !arr.length) return '';
  const imgs = arr.filter(isImg), rest = arr.filter(d => !isImg(d));
  return `${imgs.length ? `<div class="thumbs ${big ? 'lg' : ''}">${imgs.map(d => fileLink(d, 'thumb', `<img data-fpath="${esc(d.path)}" alt="${esc(d.nombre)}" loading="lazy">`)).join('')}</div>` : ''}
    ${rest.length ? `<div class="thumbs">${rest.map(d => fileLink(d, 'fchip', `${ic((d.contentType || '').startsWith('video/') ? 'video' : 'file', 16)}<span>${esc(d.nombre)}${d.tipo ? ` <span class="muted">· ${esc(d.tipo)}</span>` : ''}</span>`)).join('')}</div>` : ''}`;
}

/* ===================== render principal ===================== */
const main = $('#main');
let rq = false;
function scheduleRender() {
  IDX = null;
  if (rq) return; rq = true;
  requestAnimationFrame(() => { rq = false; if (!$('#app').hidden) { renderMain(); refreshViews(); } });
}
const NAV = [['inicio', 'Inicio', 'home'], ['servicios', 'Servicios', 'svc'], ['personal', 'Personal', 'users'], ['clientes', 'Clientes', 'heart'], ['incidentes', 'Incidentes', 'alert']];
function renderNav() {
  const I = S.loaded.size === 4 ? idx() : null;
  const cnt = { personal: S.personal.size, clientes: S.clientes.size, servicios: I ? [...S.servicios.values()].filter(s => s._st === 'activo').length : '', incidentes: S.incidentes.size };
  $('#nav').innerHTML = NAV.map(([k, l, i]) => `<button type="button" data-a="nav" data-v="${k}" ${S.view === k ? 'aria-current="page"' : ''}>${ic(i, 19)}<span>${l}</span>${I && k !== 'inicio' ? `<span class="cnt">${cnt[k]}${k === 'servicios' ? ' activos' : ''}</span>` : ''}</button>`).join('');
  $('#tabbar').innerHTML = NAV.map(([k, l, i]) => `<button type="button" data-a="nav" data-v="${k}" ${S.view === k ? 'aria-current="page"' : ''}>${ic(i, 21)}<span>${l}</span></button>`).join('');
}
function renderMain() {
  renderNav();
  if (S.loaded.size < 4) { if (!main.querySelector('[data-a="reload"]')) main.innerHTML = `${mtop()}<p class="muted"><span class="spin" aria-hidden="true"></span>Cargando datos del centro…</p>`; return; }
  const a = document.activeElement; const focusId = a && a.id && main.contains(a) ? a.id : null;
  let ss = null, se = null; try { if (focusId) { ss = a.selectionStart; se = a.selectionEnd; } } catch (e) { }
  main.innerHTML = mtop() + VIEWS[S.view]();
  hydrateFiles(main);
  if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus({ preventScroll: true }); try { if (ss != null) el.setSelectionRange(ss, se); } catch (e) { } } }
}
function mtop() {
  return `<div class="mtop"><div class="mbrand"><img src="img/icono.png" alt=""><div><b>Santa Inés</b><small>Sistema de gestión</small></div></div><button type="button" class="icon-btn" data-a="logout" aria-label="Cerrar sesión" title="Cerrar sesión">${ic('logout')}</button></div>`;
}
function go(view) {
  S.view = view; try { localStorage.setItem('si-view', view); } catch (e) { }
  renderMain(); window.scrollTo(0, 0);
}

/* ===================== INICIO ===================== */
function periodInfo() {
  const kind = S.period.kind; const a = parseD(S.period.anchor); const y = a.getFullYear(), mo = a.getMonth();
  const buckets = []; let start, end, label;
  if (kind === 'semana') {
    const dow = (a.getDay() + 6) % 7; start = addDays(S.period.anchor, -dow); end = addDays(start, 6);
    for (let i = 0; i < 7; i++) { const d = addDays(start, i); buckets.push({ start: d, end: d, lab: `${SEMANA_L[i]} ${parseD(d).getDate()}`, day: true }); }
    label = `${fds(start)} – ${fd(end)}`;
  } else if (kind === 'mes') {
    start = `${y}-${pad(mo + 1)}-01`; const last = new Date(y, mo + 1, 0).getDate(); end = `${y}-${pad(mo + 1)}-${pad(last)}`;
    for (let i = 1; i <= last; i++) { const d = `${y}-${pad(mo + 1)}-${pad(i)}`; buckets.push({ start: d, end: d, lab: (i === 1 || i % 5 === 0) ? String(i) : '', day: true }); }
    label = `${cap(MESES[mo])} ${y}`;
  } else {
    start = `${y}-01-01`; end = `${y}-12-31`;
    for (let i = 0; i < 12; i++) buckets.push({ start: `${y}-${pad(i + 1)}-01`, end: `${y}-${pad(i + 1)}-${pad(new Date(y, i + 1, 0).getDate())}`, lab: MES[i], day: false });
    label = String(y);
  }
  return { kind, start, end, buckets, label };
}
const bucketName = b => { const d = parseD(b.start); return b.day ? `${cap(DIAS_L[d.getDay()])} ${d.getDate()} de ${MESES[d.getMonth()]}` : `${cap(MESES[d.getMonth()])} ${d.getFullYear()}`; };
function defaultBucket(P) { const t = today(); const i = P.buckets.findIndex(b => t >= b.start && t <= b.end); return i >= 0 ? i : null; }

function vInicio() {
  const I = idx(), t = I.t, d = parseD(t), h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = (S.meName || '').split(' ')[0];
  const staff = [...S.personal.values()], act = staff.filter(p => p.estado !== 'inactivo');
  const enServ = act.filter(p => I.busy.has(p.id)).length, libres = act.length - enServ, inact = staff.length - act.length;
  const svcs = [...S.servicios.values()];
  const activos = svcs.filter(s => s._st === 'activo'), espA = activos.filter(s => s.tipo === 'especial').length;
  const porCerrar = svcs.filter(s => s._st === 'porcerrar').sort((a, b) => (a.fechaFin || '').localeCompare(b.fechaFin || ''));
  const cliAct = new Set(activos.flatMap(s => s.clienteIds || [])).size;
  const mStart = t.slice(0, 8) + '01';
  const incMes = [...S.incidentes.values()].filter(i => i.fecha >= mStart && i.fecha <= t).length;
  const nEj = COLS.reduce((n, c) => n + [...S[c].values()].filter(x => x.ejemplo).length, 0);
  const kpi = (k, l, v, sub, dot) => `<button type="button" class="kpi" data-a="kpi" data-k="${k}"><span class="k-l">${dot ? `<i class="dot" style="color:var(${dot})"></i>` : ''}${l}</span><span class="k-v num">${v}</span><span class="k-s">${sub}</span></button>`;

  const P = periodInfo();
  if (S.selBucket === undefined) S.selBucket = defaultBucket(P);
  const items = svcs.map(s => ({ s, sp: spanOf(s) })).filter(x => x.sp);
  const vals = P.buckets.map(b => {
    const list = items.filter(x => b.day ? onDay(x.sp, b.start) : overlaps(x.sp, b.start, b.end)).map(x => x.s);
    return { list, esp: list.filter(s => s.tipo === 'especial').length, est: list.filter(s => s.tipo !== 'especial').length };
  });
  const enCurso = items.filter(x => overlaps(x.sp, P.start, P.end)).length;
  const nuevos = svcs.filter(s => s.estado !== 'cancelado' && s.fechaInicio >= P.start && s.fechaInicio <= P.end).length;
  const fins = svcs.filter(s => s.cierre && s.cierre.fecha >= P.start && s.cierre.fecha <= P.end).length;
  const incP = [...S.incidentes.values()].filter(i => i.fecha >= P.start && i.fecha <= P.end).length;
  const selB = S.selBucket != null && P.buckets[S.selBucket] ? S.selBucket : null;

  const hoy = svcs.filter(s => s._st === 'activo' && onDay(spanOf(s), t)).sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''));
  const recent = [...S.incidentes.values()].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 4);
  const agStaff = act.slice().sort(byName(pName));

  return `
  <header class="vh"><div><p class="eyebrow">${DIAS_L[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}</p><h1>${saludo}${nombre ? ', ' + esc(nombre) : ''}</h1></div>
    <button type="button" class="btn pri" data-a="new-s">${ic('plus')} Nuevo servicio</button></header>
  ${nEj ? `<section class="alert info"><div class="alert-h">${ic('alert')}<span>Estás viendo ${plural(nEj, 'registro de ejemplo', 'registros de ejemplo')}</span></div><p class="small">Sirven para probar el sistema. Cuando quieras empezar con tus datos reales, bórralos. Los registros que agregues tú no se tocan.</p><div><button type="button" class="btn sm" data-a="clear-ex">${ic('trash', 16)} Borrar datos de ejemplo</button></div></section>` : ''}
  ${porCerrar.length ? `<section class="alert"><div class="alert-h">${ic('alert')}<span>${porCerrar.length === 1 ? 'Un servicio terminó su período y espera cierre' : `${porCerrar.length} servicios terminaron su período y esperan cierre`}</span></div>
    <p class="small">Finalízalo y registra si hubo incidentes, o extiéndelo si el cliente decide continuar.</p>
    ${porCerrar.map(s => `<div class="al-row"><button type="button" class="linkish" data-a="open-s" data-id="${esc(s.id)}"><span class="mono">${esc(s.codigo)}</span> · ${esc(clientsOf(s))} <span class="muted small">· terminó el ${fds(s.fechaFin)}</span></button><div><button type="button" class="btn sm" data-a="extend" data-id="${esc(s.id)}">${ic('calplus', 16)} Extender</button><button type="button" class="btn sm pri" data-a="finalize" data-id="${esc(s.id)}">${ic('check', 16)} Finalizar</button></div></div>`).join('')}
  </section>` : ''}
  <section class="kpis" aria-label="Resumen">
    ${kpi('personal-todos', 'Personal total', staff.length, `${plural(act.length, 'activo', 'activos')} · ${plural(inact, 'inactivo', 'inactivos')}`)}
    ${kpi('personal-servicio', 'En servicio', enServ, 'con un servicio activo', '--primary')}
    ${kpi('personal-libres', 'Libres', libres, 'sin servicio activo', '--ok')}
    ${kpi('clientes', 'Clientes', S.clientes.size, `${cliAct} con servicio activo`)}
    ${kpi('servicios-activo', 'Servicios activos', activos.length, `${plural(espA, 'especial', 'especiales')} · ${plural(activos.length - espA, 'estable', 'estables')}`)}
    ${kpi('incidentes', 'Incidentes del mes', incMes, `${S.incidentes.size} en total`, incMes ? '--bad' : '')}
  </section>
  <section class="panel">
    <div class="panel-h"><div><h2>Servicios en curso</h2><p class="small muted">Toca una barra para ver qué servicios había ese ${P.kind === 'anio' ? 'mes' : 'día'}.</p></div>
      <div class="per-ctl"><div class="chips" role="group" aria-label="Período">${[['semana', 'Semana'], ['mes', 'Mes'], ['anio', 'Año']].map(([k, l]) => `<button type="button" class="chip" data-a="per" data-v="${k}" aria-pressed="${P.kind === k}">${l}</button>`).join('')}</div>
      <div class="stepper"><button type="button" class="icon-btn" data-a="per-step" data-v="-1" aria-label="Período anterior">${ic('left', 16)}</button><span class="per-l">${esc(P.label)}</span><button type="button" class="icon-btn" data-a="per-step" data-v="1" aria-label="Período siguiente">${ic('right', 16)}</button></div></div></div>
    <div class="stats">
      <div class="stat"><b>${enCurso}</b><span>en curso en el período</span></div>
      <div class="stat"><b>${nuevos}</b><span>iniciaron</span></div>
      <div class="stat"><b>${fins}</b><span>finalizaron</span></div>
      <div class="stat"><b>${incP}</b><span>${incP === 1 ? 'incidente' : 'incidentes'}</span></div>
    </div>
    ${chartHtml(P, vals, selB)}
    <div class="legend"><span><i style="background:var(--esp)"></i>Especial</span><span><i style="background:var(--est)"></i>Turno estable</span><span><i style="background:var(--primary);border-radius:50%;width:6px;height:6px"></i>Hoy</span></div>
    ${selB != null ? `<div class="bsel"><div class="panel-h"><h3>${esc(bucketName(P.buckets[selB]))} · ${plural(vals[selB].list.length, 'servicio', 'servicios')}</h3><button type="button" class="btn sm ghost" data-a="bucket" data-i="-1">Ocultar</button></div>
      ${vals[selB].list.length ? `<div class="mini-list">${vals[selB].list.map(s => miniSvc(s)).join('')}</div>` : '<p class="small muted">No hubo servicios en curso.</p>'}</div>` : ''}
  </section>
  <div class="grid2">
    <section class="panel"><div class="panel-h"><div><h2>Personal hoy</h2><p class="small muted">${plural(act.length, 'persona activa', 'personas activas')}</p></div></div>
      <div class="donut-wrap">${donut([{ v: enServ, c: '--primary' }, { v: libres, c: '--ok' }, { v: inact, c: '--ink-3' }], staff.length)}
      <div class="dleg">
        <button type="button" data-a="kpi" data-k="personal-servicio"><i class="dot" style="color:var(--primary)"></i>En servicio<b>${enServ}</b></button>
        <button type="button" data-a="kpi" data-k="personal-libres"><i class="dot" style="color:var(--ok)"></i>Libres<b>${libres}</b></button>
        <button type="button" data-a="kpi" data-k="personal-inactivos"><i class="dot" style="color:var(--ink-3)"></i>Inactivos<b>${inact}</b></button>
      </div></div></section>
    <section class="panel"><div class="panel-h"><div><h2>De turno hoy</h2><p class="small muted">Servicios que tienen turno este ${DIAS_L[d.getDay()]}</p></div></div>
      ${hoy.length ? `<div class="mini-list">${hoy.map(s => miniSvc(s)).join('')}</div>` : '<p class="small muted">Nadie tiene turno hoy.</p>'}</section>
  </div>
  <section class="panel"><div class="panel-h"><div><h2>Agenda del personal</h2><p class="small muted">Próximos 14 días. Cada día tiene tres bloques: mañana, tarde y noche.</p></div>
    <div class="legend"><span><i style="background:var(--esp)"></i>Especial</span><span><i style="background:var(--est)"></i>Turno estable</span><span><i style="background:var(--surface-2);border:1px solid var(--line)"></i>Libre</span></div></div>
    ${agStaff.length ? agenda(agStaff, 14) : '<p class="small muted">Registra personal para ver su agenda.</p>'}
  </section>
  <section class="panel"><div class="panel-h"><div><h2>Incidentes recientes</h2></div>${S.incidentes.size ? `<button type="button" class="btn sm" data-a="nav" data-v="incidentes">Ver todos</button>` : ''}</div>
    ${recent.length ? `<div class="list">${recent.map(i => incCard(i)).join('')}</div>` : '<p class="small muted">Sin incidentes registrados.</p>'}
  </section>`;
}
function chartHtml(P, vals, selB) {
  const max = Math.max(1, ...vals.map(v => v.esp + v.est));
  const step = max <= 4 ? 1 : Math.ceil(max / 4); const topV = Math.ceil(max / step) * step;
  const ticks = []; for (let v = 0; v <= topV; v += step) ticks.push(v);
  const t = today(); const gap = P.buckets.length > 20 ? '2px' : '8px';
  return `<div class="chart" style="--n:${P.buckets.length};--g:${gap}">
    <div class="yax" aria-hidden="true">${ticks.map(v => `<span style="bottom:${v / topV * 100}%">${v}</span>`).join('')}</div>
    <div class="plot">${ticks.slice(1).map(v => `<span class="gl" style="bottom:${v / topV * 100}%"></span>`).join('')}
      ${P.buckets.map((b, i) => { const v = vals[i], tot = v.esp + v.est, isT = t >= b.start && t <= b.end; const nm = bucketName(b);
        return `<button type="button" class="bar ${isT ? 'today' : ''}" data-a="bucket" data-i="${i}" aria-pressed="${selB === i}" aria-label="${esc(nm)}: ${tot} en curso" title="${esc(nm)}: ${tot} en curso (${v.esp} especiales, ${v.est} estables)">${v.est ? `<span class="seg est" style="height:${v.est / topV * 100}%"></span>` : ''}${v.esp ? `<span class="seg esp" style="height:${v.esp / topV * 100}%"></span>` : ''}</button>`; }).join('')}
    </div>
    <div class="xl" aria-hidden="true">${P.buckets.map(b => `<span>${esc(b.lab)}</span>`).join('')}</div>
  </div>`;
}
function donut(parts, total) {
  const R = 46, C = 2 * Math.PI * R; let off = 0;
  const segs = parts.map(p => { const len = total ? C * p.v / total : 0; const s = len ? `<circle r="${R}" cx="60" cy="60" fill="none" style="stroke:var(${p.c})" stroke-width="15" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 60 60)"/>` : ''; off += len; return s; }).join('');
  return `<svg class="donut" viewBox="0 0 120 120" width="148" height="148" role="img" aria-label="Personal: ${parts.map(p => p.v).join(', ')}"><circle r="${R}" cx="60" cy="60" fill="none" style="stroke:var(--surface-2)" stroke-width="15"/>${segs}<text x="60" y="61" text-anchor="middle" class="d-v">${total}</text><text x="60" y="78" text-anchor="middle" class="d-l">personal</text></svg>`;
}
function miniSvc(s) {
  return `<div class="mini" tabindex="0" role="button" data-a="open-s" data-id="${esc(s.id)}"><span class="mono">${esc(s.codigo || '—')}</span>${tipoBadge(s)}<span class="mini-t">${esc(clientsOf(s))}</span><span class="small muted">${esc(staffOf(s))}</span>${turnoTag(s.turno)}</div>`;
}
function agenda(list, n) {
  const t = today(); const days = [...Array(n)].map((_, i) => addDays(t, i)); const I = idx();
  const head = `<tr><th scope="col"><span class="sr">Personal</span></th>${days.map(d => { const x = parseD(d), w = x.getDay(); return `<th scope="col" class="${d === t ? 'tdy' : ''}">${SEMANA_L[(w + 6) % 7]}<br><span class="num">${x.getDate()}</span></th>`; }).join('')}</tr>`;
  const rows = list.map(p => {
    const sv = (I.sp.get(p.id) || []).map(s => ({ s, sp: spanOf(s) })).filter(x => x.sp);
    return `<tr class="click" tabindex="0" data-a="open-p" data-id="${esc(p.id)}"><th scope="row"><span class="ag-n">${esc(pName(p))}</span></th>${days.map(d => {
      const occ = {}, tt = [];
      for (const x of sv) if (onDay(x.sp, d)) { for (const b of (TURNOS[x.s.turno] || { b: '' }).b) occ[b] = x.s.tipo; tt.push(`${x.s.codigo} · ${(TURNOS[x.s.turno] || {}).l || ''}`); }
      const w = wd(d), cls = b => occ[b] ? (occ[b] === 'especial' ? 'esp' : 'est') : '';
      return `<td class="${d === t ? 'tdy' : (w === 0 || w === 6 ? 'we' : '')}" title="${esc(fds(d) + ': ' + (tt.join(', ') || 'Libre'))}"><span class="cell"><i class="${cls('M')}"></i><i class="${cls('T')}"></i><i class="${cls('N')}"></i></span></td>`;
    }).join('')}</tr>`;
  }).join('');
  return `<div class="ag-wrap"><table class="ag"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}

/* ===================== LISTAS ===================== */
function matchQ(q, parts) { if (!q) return true; const hay = norm(parts.filter(Boolean).join(' | ')); return hay.includes(q) || hay.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')); }
const resCount = n => `<p class="small muted num">${plural(n, 'resultado', 'resultados')}</p>`;
function vServicios() {
  const n = S.servicios.size;
  return `<header class="vh"><div><p class="eyebrow">${plural(n, 'servicio registrado', 'servicios registrados')}</p><h1>Servicios</h1></div><button type="button" class="btn pri" data-a="new-s">${ic('plus')} Nuevo servicio</button></header>
  <div class="toolbar"><label class="search">${ic('search')}<input type="search" id="q-servicios" value="${esc(S.q.servicios)}" placeholder="Buscar por código, cliente, personal o DNI" aria-label="Buscar servicios"></label></div>
  <div class="chips">${chips('servicios', [['todos', 'Todos'], ['activo', 'Activos'], ['programado', 'Programados'], ['porcerrar', 'Por cerrar'], ['finalizado', 'Finalizados'], ['cancelado', 'Cancelados']])}</div>
  <div class="chips">${chips('tipo', [['todos', 'Ambos tipos'], ['especial', 'Especiales'], ['estable', 'Turnos estables']])}</div>
  <div id="results">${RESULTS.servicios()}</div>`;
}
function vPersonal() {
  const n = S.personal.size;
  return `<header class="vh"><div><p class="eyebrow">${plural(n, 'persona registrada', 'personas registradas')}</p><h1>Personal de enfermería</h1></div><button type="button" class="btn pri" data-a="new-p">${ic('plus')} Nuevo personal</button></header>
  <div class="toolbar"><label class="search">${ic('search')}<input type="search" id="q-personal" value="${esc(S.q.personal)}" placeholder="Buscar por DNI, cédula, nombre, apellido o servicio" aria-label="Buscar personal"></label>
    <select class="inp auto" id="flt-turno" aria-label="Filtrar por turno preferido"><option value="">Cualquier turno</option>${Object.entries(TURNOS).map(([k, t]) => `<option value="${k}" ${S.f.turno === k ? 'selected' : ''}>Prefiere ${t.l}</option>`).join('')}</select></div>
  <div class="chips">${chips('personal', [['todos', 'Todos'], ['libres', 'Libres'], ['servicio', 'En servicio'], ['especiales', 'Hacen especiales'], ['inactivos', 'Inactivos']])}</div>
  <div id="results">${RESULTS.personal()}</div>`;
}
function vClientes() {
  const n = S.clientes.size;
  return `<header class="vh"><div><p class="eyebrow">${plural(n, 'cliente registrado', 'clientes registrados')}</p><h1>Clientes</h1></div><button type="button" class="btn pri" data-a="new-c">${ic('plus')} Nuevo cliente</button></header>
  <div class="toolbar"><label class="search">${ic('search')}<input type="search" id="q-clientes" value="${esc(S.q.clientes)}" placeholder="Buscar por DNI, nombre o apellido" aria-label="Buscar clientes"></label></div>
  <div class="chips">${chips('clientes', [['todos', 'Todos'], ['activos', 'Con servicio activo'], ['incidentes', 'Con incidentes']])}</div>
  <div id="results">${RESULTS.clientes()}</div>`;
}
function vIncidentes() {
  const n = S.incidentes.size;
  return `<header class="vh"><div><p class="eyebrow">${plural(n, 'incidente registrado', 'incidentes registrados')}</p><h1>Incidentes</h1></div></header>
  <p class="small muted" style="max-width:68ch">Los incidentes se registran al finalizar un servicio, o en cualquier momento desde el detalle del servicio con «Registrar incidente». Aparecen también en la ficha del personal y del cliente.</p>
  <div class="toolbar"><label class="search">${ic('search')}<input type="search" id="q-incidentes" value="${esc(S.q.incidentes)}" placeholder="Buscar por motivo, personal, cliente o código" aria-label="Buscar incidentes"></label></div>
  <div class="chips">${chips('gravedad', [['todos', 'Todas'], ['leve', 'Leves'], ['moderada', 'Moderadas'], ['grave', 'Graves']])}</div>
  <div id="results">${RESULTS.incidentes()}</div>`;
}
const VIEWS = { inicio: vInicio, servicios: vServicios, personal: vPersonal, clientes: vClientes, incidentes: vIncidentes };
const RESULTS = {
  personal() {
    const I = idx(), q = norm(S.q.personal), f = S.f.personal;
    if (!S.personal.size) return empty('Aún no hay personal registrado.', 'new-p', 'Registrar personal');
    const arr = [...S.personal.values()].filter(p => {
      if (f === 'inactivos') { if (p.estado !== 'inactivo') return false; } else if (f !== 'todos' && p.estado === 'inactivo') return false;
      if (f === 'libres' && I.busy.has(p.id)) return false;
      if (f === 'servicio' && !I.busy.has(p.id)) return false;
      if (f === 'especiales' && !p.especiales) return false;
      if (S.f.turno && !(p.turnos || []).includes(S.f.turno)) return false;
      const svs = I.sp.get(p.id) || [];
      return matchQ(q, [p.nombres, p.apellidos, `${p.nombres} ${p.apellidos}`, p.numDoc, ...svs.map(s => s.codigo), ...svs.map(clientsOf)]);
    }).sort(byName(pName));
    if (!arr.length) return '<p class="muted">No hay personal con esa búsqueda o filtro.</p>';
    return resCount(arr.length) + `<div class="list">${arr.map(p => pRow(p)).join('')}</div>`;
  },
  clientes() {
    const I = idx(), q = norm(S.q.clientes), f = S.f.clientes;
    if (!S.clientes.size) return empty('Aún no hay clientes registrados.', 'new-c', 'Registrar cliente');
    const arr = [...S.clientes.values()].filter(c => {
      const sv = I.sc.get(c.id) || [];
      if (f === 'activos' && !sv.some(s => s._st === 'activo')) return false;
      if (f === 'incidentes' && !(I.ic.get(c.id) || []).length) return false;
      return matchQ(q, [c.nombres, c.apellidos, `${c.nombres} ${c.apellidos}`, c.numDoc]);
    }).sort(byName(cName));
    if (!arr.length) return '<p class="muted">No hay clientes con esa búsqueda o filtro.</p>';
    return resCount(arr.length) + `<div class="list">${arr.map(c => cRow(c)).join('')}</div>`;
  },
  servicios() {
    idx(); const q = norm(S.q.servicios), f = S.f.servicios, tp = S.f.tipo;
    if (!S.servicios.size) return empty('Aún no hay servicios. Crea el primero y asigna al personal disponible.', 'new-s', 'Nuevo servicio');
    const order = { porcerrar: 0, activo: 1, programado: 2, finalizado: 3, cancelado: 4 };
    const arr = [...S.servicios.values()].filter(s => {
      if (f !== 'todos' && s._st !== f) return false;
      if (tp !== 'todos' && s.tipo !== tp) return false;
      const cs = (s.clienteIds || []).map(id => S.clientes.get(id)), ps = (s.personalIds || []).map(id => S.personal.get(id));
      return matchQ(q, [s.codigo, s.direccion, ...cs.map(cName), ...cs.map(c => c && c.numDoc), ...ps.map(pName), ...ps.map(p => p && p.numDoc)]);
    }).sort((a, b) => (order[a._st] - order[b._st]) || (b.fechaInicio || '').localeCompare(a.fechaInicio || ''));
    if (!arr.length) return '<p class="muted">No hay servicios con esa búsqueda o filtro.</p>';
    return resCount(arr.length) + `<div class="list">${arr.map(s => sRow(s)).join('')}</div>`;
  },
  incidentes() {
    const q = norm(S.q.incidentes), g = S.f.gravedad;
    if (!S.incidentes.size) return '<div class="empty"><p>No hay incidentes registrados.</p></div>';
    const arr = [...S.incidentes.values()].filter(i => {
      if (g !== 'todos' && i.gravedad !== g) return false;
      const s = S.servicios.get(i.servicioId);
      return matchQ(q, [i.motivo, i.causa, i.descripcion, s && s.codigo, ...(i.personalIds || []).map(id => pName(S.personal.get(id))), ...(i.clienteIds || []).map(id => cName(S.clientes.get(id))), ...(i.personalIds || []).map(id => (S.personal.get(id) || {}).numDoc), ...(i.clienteIds || []).map(id => (S.clientes.get(id) || {}).numDoc)]);
    }).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    if (!arr.length) return '<p class="muted">No hay incidentes con esa búsqueda o filtro.</p>';
    return resCount(arr.length) + `<div class="list">${arr.map(i => incCard(i)).join('')}</div>`;
  },
};
function pRow(p) {
  const I = idx(); const busy = I.busy.get(p.id), nx = I.next.get(p.id); const nS = (I.sp.get(p.id) || []).length, nI = (I.ip.get(p.id) || []).length;
  const est = p.estado === 'inactivo' ? pill('Inactivo') : busy ? pill('En servicio · ' + esc(busy.map(s => s.codigo).join(', ')), 'pri') : pill('Libre', 'ok');
  return `<div class="row p" tabindex="0" role="button" data-a="open-p" data-id="${esc(p.id)}">
    <div class="who">${av(p)}<div><b>${esc(pName(p))}${exTag(p)}</b><span class="small muted mono">${esc(docLabel(p))}</span>${!busy && nx && p.estado !== 'inactivo' ? `<span class="small muted">Próximo: ${esc(nx.codigo)} desde el ${fds(nx.fechaInicio)}</span>` : ''}</div></div>
    <div class="hide-m small stack"><span>${esc(CATEG_S[p.categoria] || '—')}</span>${p.cep ? `<span class="muted mono">CEP ${esc(p.cep)}</span>` : ''}</div>
    <div class="hide-m stack"><div class="opts-r">${(p.turnos || []).map(t => `<span class="tag">${esc((TURNOS[t] || {}).l || t)}</span>`).join('') || '<span class="muted small">Sin preferencia de turno</span>'}</div>${p.especiales ? '<span class="small" style="color:var(--esp);font-weight:700">Hace especiales</span>' : ''}</div>
    <div class="hide-m small num muted">${plural(nS, 'servicio', 'servicios')}</div>
    <div class="end">${est}${nI ? pill(ic('alert', 13) + ' ' + nI, 'bad') : ''}</div>
  </div>`;
}
function cRow(c) {
  const I = idx(); const sv = I.sc.get(c.id) || []; const act = sv.filter(s => s._st === 'activo'); const nI = (I.ic.get(c.id) || []).length;
  return `<div class="row c" tabindex="0" role="button" data-a="open-c" data-id="${esc(c.id)}">
    <div class="who">${av(c, 'c')}<div><b>${esc(cName(c))}${exTag(c)}</b><span class="small muted mono">${esc(docLabel(c))}</span></div></div>
    <div class="hide-m small stack"><span>${esc(c.direccion || 'Sin dirección')}</span><span class="muted">${esc(c.distrito || '')}</span></div>
    <div class="hide-m small num muted">${plural(sv.length, 'servicio', 'servicios')}</div>
    <div class="end">${act.length ? pill('Servicio activo · ' + esc(act.map(s => s.codigo).join(', ')), 'pri') : pill('Sin servicio activo')}${nI ? pill(ic('alert', 13) + ' ' + nI, 'bad') : ''}</div>
  </div>`;
}
function sRow(s) {
  const nI = (idx().is.get(s.id) || []).length;
  return `<div class="row s" tabindex="0" role="button" data-a="open-s" data-id="${esc(s.id)}">
    <div class="stack"><div class="code"><span class="mono">${esc(s.codigo || '—')}</span>${tipoBadge(s)}${exTag(s)}</div><b>${esc(clientsOf(s))}</b><span class="small muted">${esc(staffOf(s))}</span><span class="small muted only-m">${esc(fRange(s.fechaInicio, s.fechaFin))}</span></div>
    <div class="hide-m small stack"><span class="muted">Fechas</span><span>${esc(fRange(s.fechaInicio, s.fechaFin))}</span></div>
    <div class="hide-m small stack">${turnoTag(s.turno)}${s.tipo === 'estable' ? `<span class="muted">${esc(diasTxt(s.dias))}</span>` : ''}</div>
    <div class="end">${stPill(s)}${nI ? pill(ic('alert', 13) + ' ' + nI, 'bad') : ''}</div>
  </div>`;
}
function incCard(i) {
  const s = S.servicios.get(i.servicioId);
  const ps = (i.personalIds || []).map(id => pName(S.personal.get(id))).join(', ');
  const cs = (i.clienteIds || []).map(id => cName(S.clientes.get(id))).join(', ');
  const ev = (i.evidencias || []).length;
  return `<div class="incard" tabindex="0" role="button" data-a="open-i" data-id="${esc(i.id)}">
    <div class="ih">${pill(GRAV[i.gravedad] || 'Incidente', GRAV_T[i.gravedad] || 'bad')}<b>${esc(i.motivo || 'Incidente')}</b>${exTag(i)}<span class="small muted">${fd(i.fecha)}${s ? ' · <span class="mono">' + esc(s.codigo) + '</span>' : ''}</span></div>
    ${i.causa ? `<p class="small"><span class="muted">Causa:</span> ${esc(i.causa)}</p>` : ''}
    <p class="small muted">${ps ? 'Personal: ' + esc(ps) : 'Sin personal indicado'}${cs ? ' · Cliente: ' + esc(cs) : ''}${ev ? ` · ${plural(ev, 'evidencia', 'evidencias')}` : ''}</p>
    ${filesView(i.evidencias)}
  </div>`;
}

/* ===================== ventanas ===================== */
const modals = []; let UID = 0; let RUID = 0;
const topModal = () => modals[modals.length - 1];
function openModal(m) {
  m.uid = ++UID; m.newAssets = []; m.delAssets = [];
  const wrap = document.createElement('div'); wrap.className = 'ov' + (m.center ? ' center' : '');
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"></div>`;
  $('#modal-root').appendChild(wrap); m.el = wrap; m.sheet = wrap.firstElementChild; modals.push(m);
  paint(m); document.body.classList.add('noscroll');
  requestAnimationFrame(() => wrap.classList.add('in'));
  setTimeout(() => { const f = m.sheet.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=file]),textarea,select'); if (m.kind === 'form' && f && window.innerWidth > 860) f.focus({ preventScroll: true }); else { const c = m.sheet.querySelector('[data-a="close"]'); if (c) c.focus({ preventScroll: true }); } }, 60);
}
function paint(m) { const st = m.sheet.scrollTop; RUID = m.uid; m.sheet.innerHTML = m.render(m); m.sheet.scrollTop = st; hydrateFiles(m.sheet); }
function closeModal() {
  const m = modals.pop(); if (!m) return;
  if (m.kind === 'form') removeFiles(m.saved ? m.delAssets : m.newAssets);
  if (m.resolve) m.resolve(false);
  m.el.remove(); if (!modals.length) document.body.classList.remove('noscroll');
}
function refreshViews() { for (const m of modals) if (m.kind === 'view') paint(m); }
const sheetHead = (t, sub = '') => `<div class="sheet-h"><div class="sh-t"><h2>${t}</h2>${sub ? `<p class="small muted">${sub}</p>` : ''}</div><div class="sh-r"><button type="button" class="icon-btn" data-a="close" aria-label="Cerrar">${ic('x', 20)}</button></div></div>`;
const sheetFoot = (m, label) => `<div class="sheet-f"><button type="button" class="btn" data-a="close">Cancelar</button><button type="button" class="btn pri" data-a="save" ${m.busy || m.uploading ? 'disabled' : ''}>${m.busy ? 'Guardando…' : m.uploading ? 'Subiendo archivos…' : label}</button></div>`;
const gone = msg => `${sheetHead('No encontrado')}<div class="sheet-b"><p class="muted">${msg}</p></div>`;
function confirmBox({ title, body, ok = 'Eliminar', tone = 'badfill' }) {
  return new Promise(resolve => {
    openModal({
      kind: 'confirm', center: true, resolve,
      render: () => `<div class="sheet-b" style="gap:14px"><h2>${title}</h2><p class="muted">${body}</p><div class="actions" style="justify-content:flex-end"><button type="button" class="btn" data-a="close">Cancelar</button><button type="button" class="btn ${tone}" data-a="confirm-ok">${ok}</button></div></div>`,
    });
  });
}
function toast(msg, tone = '') {
  const el = document.createElement('div'); el.className = 'toast ' + tone; el.textContent = msg;
  $('#toast').appendChild(el); setTimeout(() => el.remove(), tone === 'bad' ? 5500 : 2800);
}

/* ===================== campos de formulario ===================== */
const fid = name => `f${RUID}-${String(name).replace(/[^\w]/g, '-')}`;
function inp(name, label, val, o = {}) {
  const id = fid(name);
  return `<label class="fld ${o.full ? 'full' : ''}" for="${id}"><span>${esc(label)}${o.req ? ' <em>*</em>' : ''}</span><input class="inp ${o.mono ? 'mono' : ''}" id="${id}" name="${esc(name)}" type="${o.type || 'text'}" value="${esc(val ?? '')}"${o.list ? ` list="${o.list}"` : ''}${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}${o.min ? ` min="${o.min}"` : ''}${o.ac ? ` autocomplete="${o.ac}"` : ''}>${o.hint ? `<small class="hint">${esc(o.hint)}</small>` : ''}</label>`;
}
function sel(name, label, val, opts, o = {}) {
  const id = fid(name); const ent = Array.isArray(opts) ? opts.map(x => [x, x]) : Object.entries(opts);
  return `<label class="fld ${o.full ? 'full' : ''}" for="${id}"><span>${esc(label)}</span><select class="inp" id="${id}" name="${esc(name)}">${ent.map(([k, l]) => `<option value="${esc(k)}" ${String(val) === String(k) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
}
function ta(name, label, val, ph = '', o = {}) {
  const id = fid(name);
  return `<label class="fld ${o.full === false ? '' : 'full'}" for="${id}">${label ? `<span>${esc(label)}${o.req ? ' <em>*</em>' : ''}</span>` : ''}<textarea class="inp" id="${id}" name="${esc(name)}" rows="${o.rows || 3}" ${ph ? `placeholder="${esc(ph)}"` : ''}${label ? '' : ' aria-label="Notas"'}>${esc(val ?? '')}</textarea></label>`;
}
const optChk = (name, value, html, checked) => `<label class="opt"><input type="checkbox" name="${esc(name)}" value="${esc(value)}" ${checked ? 'checked' : ''}><span>${html}</span></label>`;
const optRadio = (name, value, html, checked) => `<label class="opt"><input type="radio" name="${esc(name)}" value="${esc(value)}" ${checked ? 'checked' : ''}><span>${html}</span></label>`;
function collect(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    const name = el.name;
    if (name.endsWith('[]')) { const k = name.slice(0, -2); let arr = getPath(out, k); if (!Array.isArray(arr)) arr = setPath(out, k, []); if (el.checked) arr.push(el.value); continue; }
    if (el.type === 'radio') { if (el.checked) setPath(out, name, el.value); continue; }
    setPath(out, name, el.type === 'checkbox' ? el.checked : el.value);
  }
  return out;
}
function deepMerge(t, s) {
  for (const k of Object.keys(s)) {
    const v = s[k];
    if (Array.isArray(v)) {
      if (v.some(x => x && typeof x === 'object') && Array.isArray(t[k])) { const arr = t[k]; v.forEach((x, i) => { if (x && typeof x === 'object' && arr[i] && typeof arr[i] === 'object') deepMerge(arr[i], x); else arr[i] = x; }); arr.length = v.length; }
      else t[k] = v.slice();
    } else if (v && typeof v === 'object') { if (!t[k] || typeof t[k] !== 'object' || Array.isArray(t[k])) t[k] = {}; deepMerge(t[k], v); }
    else t[k] = v;
  }
  return t;
}
function syncForm(m) { const f = m.sheet.querySelector('form'); if (f) deepMerge(m.state, collect(f)); }
function showErr(m, errs) {
  const p = m.sheet.querySelector('.f-err'); if (p) { p.innerHTML = errs.map(esc).join('<br>'); p.hidden = false; if (p.scrollIntoView) p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  toast(errs[0], 'bad');
}

/* ===================== subir archivos ===================== */
function guessTipo(name, list) {
  const n = norm(name);
  const g = [['cv', 'CV'], ['curricul', 'CV'], ['hoja de vida', 'CV'], ['diploma', 'Diploma'], ['titulo', 'Título'], ['cep', 'Colegiatura (CEP)'], ['colegiatura', 'Colegiatura (CEP)'], ['antecedente', 'Antecedentes'], ['dni', 'Copia de documento'], ['carne', 'Copia de documento'], ['cedula', 'Copia de documento'], ['certificad', 'Certificado'], ['constancia', 'Constancia de trabajo'], ['receta', 'Receta'], ['informe', 'Informe médico'], ['contrato', 'Contrato']].find(([k, v]) => n.includes(k) && list.includes(v));
  return g ? g[1] : 'Otro';
}
async function toJpeg(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('jpeg')), 'image/jpeg', 0.86));
}
function upMsg(e, name) {
  const m = (e && (e.message || e.error)) || '';
  if ((e && e.code === 'too_large') || /exceeded|too large|payload/i.test(m)) return `«${name}» pesa más de 25 MB. Comprímelo o divídelo.`;
  if (/mime|type/i.test(m)) return `«${name}» tiene un formato que no se puede guardar.`;
  if (/row-level|unauthori|403|permission/i.test(m)) return 'Tu cuenta no tiene permiso para subir archivos.';
  if (/bucket not found/i.test(m)) return 'Falta el depósito de archivos en Supabase. Ejecuta supabase/01_esquema.sql.';
  return `No se pudo subir «${name}». Revisa tu conexión e inténtalo de nuevo.`;
}
async function uploadOne(f, folder) {
  let blob = f, type = f.type || '', name = f.name || 'archivo';
  const isHeic = /heic|heif/i.test(type) || /\.(heic|heif)$/i.test(name);
  if (isHeic || (/^image\/(jpeg|png|webp)$/.test(type) && f.size > 2.5 * 1024 * 1024)) {
    try { blob = await toJpeg(f); type = 'image/jpeg'; name = name.replace(/\.\w+$/, '') + '.jpg'; } catch (e) { blob = f; }
  }
  if (blob.size > MAX_BYTES) throw { code: 'too_large' };
  const safe = norm(name).replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-80) || 'archivo';
  const path = `${folder}/${uuid()}-${safe}`;
  let r = await sb.storage.from(BUCKET).upload(path, blob, { contentType: type || 'application/octet-stream', upsert: false, cacheControl: '3600' });
  if (r.error && isTransient(r.error)) { await sleep(800); r = await sb.storage.from(BUCKET).upload(path, blob, { contentType: type || 'application/octet-stream', upsert: false, cacheControl: '3600' }); }
  if (r.error) throw r.error;
  try { SIGNED.set(path, { url: URL.createObjectURL(blob), exp: Date.now() + 6 * 3600 * 1000 }); } catch (e) { }
  return { path, name, contentType: type || 'application/octet-stream', size: blob.size };
}
async function onUpload(m, path, files) {
  syncForm(m); m.uploading = (m.uploading || 0) + files.length; paint(m);
  const list = m.docTypes || DOC_TIPOS;
  for (const f of files) {
    try {
      const r = await uploadOne(f, m.folder || 'otros');
      let arr = getPath(m.state, path); if (!Array.isArray(arr)) arr = setPath(m.state, path, []);
      arr.push({ path: r.path, nombre: r.name, contentType: r.contentType, size: r.size, tipo: m.noDocType ? '' : guessTipo(r.name, list), fecha: today() });
      m.newAssets.push(r.path);
    } catch (e) { console.warn(e); toast(upMsg(e, f.name), 'bad'); }
    m.uploading--; if (modals.includes(m)) { syncForm(m); paint(m); }
  }
}
function docsEditor(st, path, m) {
  const arr = getPath(st, path) || []; const types = m.docTypes || DOC_TIPOS;
  return `<div class="files">${arr.map((d, i) => `<div class="file">${fileIcon(d)}<div class="fgrow"><input class="inp sm" name="${path}.${i}.nombre" value="${esc(d.nombre)}" aria-label="Nombre del archivo">${m.noDocType ? '' : `<select class="inp sm" name="${path}.${i}.tipo" aria-label="Tipo de documento">${types.map(t => `<option ${t === d.tipo ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`}</div>${fileLink(d, 'btn sm ghost', 'Ver')}<button type="button" class="btn sm ghost bad" data-a="file-del" data-p="${esc(path)}" data-i="${i}" aria-label="Quitar ${esc(d.nombre)}">${ic('trash', 16)}</button></div>`).join('')}</div>
  <label class="drop">${ic('upload', 22)}<span><b>Subir archivos</b><span class="hint">PDF, Word, fotos, videos… hasta 25 MB cada uno</span></span><input type="file" multiple data-up="${esc(path)}" aria-label="Subir archivos"></label>
  ${m.uploading ? `<p class="hint"><span class="spin" aria-hidden="true"></span>Subiendo ${plural(m.uploading, 'archivo', 'archivos')}…</p>` : ''}`;
}

/* ===================== guardar ===================== */
async function runSave(m, fn) {
  if (m.busy) return; m.busy = true; syncForm(m); paint(m);
  try { await fn(); }
  catch (e) { console.warn(e); m.busy = false; if (modals.includes(m)) { paint(m); showErr(m, [e && e.userMsg ? e.userMsg : dbMsg(e)]); } return; }
  m.busy = false;
}
const fail = msg => { const e = new Error(msg); e.userMsg = msg; return e; };
const tidy = s => String(s ?? '').trim();

/* ===================== PERSONAL ===================== */
function detailP(id) {
  const p = S.personal.get(id); if (!p) return gone('Este registro de personal ya no existe.');
  const I = idx(), t = I.t;
  const svcs = (I.sp.get(id) || []).slice().sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || ''));
  const incs = (I.ip.get(id) || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const busy = I.busy.get(id);
  const dias = svcs.reduce((n, s) => n + svcDays(s, t), 0);
  const nEsp = svcs.filter(s => s.tipo === 'especial' && s._st !== 'cancelado').length;
  const est = p.estado === 'inactivo' ? pill('Inactivo') : busy ? pill('En servicio', 'pri') : pill('Libre', 'ok');
  const dl = (l, v, full) => `<div class="${full ? 'full' : ''}"><dt>${l}</dt><dd>${v || '<span class="muted">—</span>'}</dd></div>`;
  return `${sheetHead(`${esc(pName(p))}${exTag(p)}`, `<span class="mono">${esc(docLabel(p))}</span> · ${esc(CATEG[p.categoria] || 'Sin categoría')} · ${est}`)}
  <div class="sheet-b">
    <div class="actions"><button type="button" class="btn" data-a="edit-p" data-id="${esc(id)}">${ic('edit', 16)} Editar</button><button type="button" class="btn bad" data-a="del-p" data-id="${esc(id)}">${ic('trash', 16)} Eliminar</button></div>
    <div class="pstats">
      <div class="stat"><b>${svcs.length}</b><span>servicios con nosotros</span></div>
      <div class="stat"><b>${dias}</b><span>días de servicio a la fecha</span></div>
      <div class="stat"><b>${nEsp}</b><span>especiales</span></div>
      <div class="stat"><b style="${incs.length ? 'color:var(--bad)' : ''}">${incs.length}</b><span>incidentes</span></div>
    </div>
    ${busy ? `<div class="alert info"><div class="alert-h">${ic('svc')}<span>Ahora en ${busy.map(s => `<button type="button" class="linkish" data-a="open-s" data-id="${esc(s.id)}"><span class="mono">${esc(s.codigo)}</span></button>`).join(', ')}</span></div><p class="small">${busy.map(s => `${esc(clientsOf(s))} · ${esc(fRange(s.fechaInicio, s.fechaFin))} · ${(TURNOS[s.turno] || {}).l || ''}`).join('<br>')}</p></div>` : ''}
    <section class="sec"><h3>Agenda · próximos 14 días</h3><div class="card" style="padding:8px 12px">${agenda([p], 14)}</div></section>
    <section class="sec"><h3>Datos generales</h3><div class="card"><dl class="dl">
      ${dl('Documento', `<span class="mono">${esc(TIPO_DOC[p.tipoDoc] || p.tipoDoc || '')} ${esc(p.numDoc || '')}</span>`)}
      ${dl('Nacionalidad', esc(p.nacionalidad))}
      ${dl('Fecha de nacimiento', p.fechaNac ? `${fd(p.fechaNac)} <span class="muted">(${Math.floor(daysBetween(p.fechaNac, t) / 365.25)} años)</span>` : '')}
      ${dl('Celular', esc(p.telefono))}
      ${dl('Correo', esc(p.email))}
      ${dl('Ingreso al centro', p.fechaIngreso ? fd(p.fechaIngreso) : '')}
      ${dl('Dirección', esc([p.direccion, p.distrito].filter(Boolean).join(', ')) + (p.referencia ? `<br><span class="muted small">Ref.: ${esc(p.referencia)}</span>` : ''), true)}
      ${dl('Colegiatura', p.cep ? `<span class="mono">CEP ${esc(p.cep)}</span>` : '')}
      ${dl('Contacto de emergencia', esc([p.emergNombre, p.emergTel].filter(Boolean).join(' · ')))}
    </dl></div></section>
    <section class="sec"><h3>Turnos y disponibilidad</h3><div class="card"><dl class="dl">
      ${dl('Turnos que prefiere', (p.turnos || []).length ? `<div class="plist">${p.turnos.map(turnoTag).join('')}</div>` : 'Sin preferencia', false)}
      ${dl('Días que prefiere', (p.dias || []).length ? esc(diasTxt(p.dias)) : 'Cualquier día')}
      ${dl('Especiales', p.especiales ? '<b style="color:var(--esp)">Sí, puede hacer especiales</b>' : 'No marcó especiales')}
      ${dl('Notas', p.dispNotas ? `<span class="prose">${esc(p.dispNotas)}</span>` : '')}
    </dl></div></section>
    <section class="sec"><h3>Diagnósticos que ha atendido</h3>${(p.diagnosticos || []).length ? `<div class="tags">${p.diagnosticos.map(d => `<span class="tag">${esc(d)}</span>`).join('')}</div>` : '<p class="small muted">Sin diagnósticos registrados.</p>'}</section>
    <section class="sec"><h3>Experiencia: clínicas y familias</h3>${(p.experiencia || []).length ? `<div class="plist">${p.experiencia.map(e => `<div class="card" style="gap:6px"><div class="ih"><b>${esc(e.nombre || 'Sin nombre')}</b>${e.tipo ? pill(esc(e.tipo)) : ''}<span class="small muted">${esc([e.desde, e.hasta].filter(Boolean).join(' – '))}</span></div>${e.paciente ? `<p class="small"><span class="muted">Paciente / diagnóstico:</span> ${esc(e.paciente)}</p>` : ''}${e.contacto || e.telefono ? `<p class="small"><span class="muted">Contacto:</span> ${esc([e.contacto, e.telefono].filter(Boolean).join(' · '))}</p>` : ''}${e.notas ? `<p class="small prose">${esc(e.notas)}</p>` : ''}</div>`).join('')}</div>` : '<p class="small muted">Sin experiencia registrada.</p>'}</section>
    <section class="sec"><h3>Documentos</h3>${(p.documentos || []).length ? filesView(p.documentos) : '<p class="small muted">Sin documentos. Usa «Editar» para subir su CV, diplomas y otros.</p>'}</section>
    <section class="sec"><h3>Historial de servicios ${pill(svcs.length)}</h3>${histTable(svcs, 'p')}</section>
    <section class="sec"><h3>Incidentes ${incs.length ? pill(incs.length, 'bad') : ''}</h3>${incs.length ? `<div class="list">${incs.map(i => incCard(i)).join('')}</div>` : '<p class="small muted">Sin incidentes registrados.</p>'}</section>
    ${p.notas ? `<section class="sec"><h3>Notas internas</h3><p class="prose">${esc(p.notas)}</p></section>` : ''}
  </div>`;
}
function histTable(svcs, who) {
  if (!svcs.length) return '<p class="small muted">Todavía no tiene servicios.</p>';
  const I = idx();
  return `<div class="tw"><table class="t"><thead><tr><th>Código</th><th>Tipo</th><th>${who === 'p' ? 'Cliente' : 'Personal'}</th><th>Fechas</th><th>Turno</th><th>Días</th><th>Estado</th></tr></thead><tbody>
    ${svcs.map(s => { const nI = (I.is.get(s.id) || []).length; const sp = spanOf(s); return `<tr class="click" tabindex="0" data-a="open-s" data-id="${esc(s.id)}"><td class="mono">${esc(s.codigo)}</td><td>${tipoBadge(s)}</td><td>${esc(who === 'p' ? clientsOf(s) : staffOf(s))}</td><td>${esc(fRange(s.fechaInicio, s.fechaFin))}</td><td>${esc((TURNOS[s.turno] || {}).l || '')}${s.tipo === 'estable' ? `<br><span class="muted small">${esc(diasTxt(s.dias))}</span>` : ''}</td><td class="num">${sp ? svcDays(s, sp.end ? null : I.t) : '—'}</td><td><div class="tags">${stPill(s)}${nI ? pill(ic('alert', 13) + ' ' + nI, 'bad') : ''}</div></td></tr>`; }).join('')}
  </tbody></table></div>`;
}
function openFormP(id) {
  const base = id ? clone(S.personal.get(id)) : { tipoDoc: 'DNI', nacionalidad: 'Peruana', categoria: 'tec', estado: 'activo', especiales: false };
  if (!base) return;
  for (const k of ['turnos', 'dias', 'diagnosticos', 'experiencia', 'documentos']) if (!Array.isArray(base[k])) base[k] = [];
  base.dias = base.dias.map(String);
  openModal({ kind: 'form', id, state: base, render: renderFormP, onSave: saveP, docTypes: DOC_TIPOS, folder: 'personal' });
}
function renderFormP(m) {
  const st = m.state;
  return `${sheetHead(m.id ? 'Editar personal' : 'Nuevo personal de enfermería', m.id ? esc(pName(st)) : 'Los campos con * son obligatorios.')}
  <form class="sheet-b" novalidate autocomplete="off">
    <fieldset class="fs"><h3>Datos personales</h3><div class="fgrid">
      ${inp('nombres', 'Nombres', st.nombres, { req: 1 })}
      ${inp('apellidos', 'Apellidos', st.apellidos, { req: 1 })}
      ${sel('tipoDoc', 'Tipo de documento', st.tipoDoc, TIPO_DOC)}
      ${inp('numDoc', 'Número de documento', st.numDoc, { req: 1, mono: 1 })}
      ${inp('nacionalidad', 'Nacionalidad', st.nacionalidad)}
      ${inp('fechaNac', 'Fecha de nacimiento', st.fechaNac, { type: 'date' })}
      ${inp('telefono', 'Celular', st.telefono, { type: 'tel', ph: '987 654 321' })}
      ${inp('email', 'Correo', st.email, { type: 'email' })}
      ${inp('direccion', 'Dirección', st.direccion, { full: 1, ph: 'Av., calle, jirón, número' })}
      ${inp('distrito', 'Distrito', st.distrito, { list: 'dl-distritos' })}
      ${inp('referencia', 'Referencia', st.referencia)}
      ${inp('emergNombre', 'Contacto de emergencia', st.emergNombre, { ph: 'Nombre y parentesco' })}
      ${inp('emergTel', 'Teléfono de emergencia', st.emergTel, { type: 'tel' })}
    </div></fieldset>
    <fieldset class="fs"><h3>Perfil profesional</h3><div class="fgrid">
      ${sel('categoria', 'Categoría', st.categoria, CATEG)}
      ${inp('cep', 'N.º de colegiatura (CEP)', st.cep, { mono: 1, hint: 'Solo para licenciados(as)' })}
      ${inp('fechaIngreso', 'Fecha de ingreso al centro', st.fechaIngreso, { type: 'date' })}
      ${sel('estado', 'Estado', st.estado, { activo: 'Activo', inactivo: 'Inactivo (no aparece para asignar)' })}
    </div></fieldset>
    <fieldset class="fs"><h3>Turnos y disponibilidad</h3>
      <div class="fld"><span>Turnos que prefiere</span><div class="opts">${Object.entries(TURNOS).map(([k, t]) => optChk('turnos[]', k, `${blocks(k)} ${t.l} <small>${t.h}</small>`, st.turnos.includes(k))).join('')}</div></div>
      <div class="fld"><span>Días que prefiere</span><div class="opts">${SEMANA.map(([n, l]) => optChk('dias[]', n, l, st.dias.includes(String(n)))).join('')}</div><small class="hint">Déjalo vacío si puede cualquier día.</small></div>
      <div class="fld"><span>Especiales</span><div class="opts"><label class="opt"><input type="checkbox" name="especiales" ${st.especiales ? 'checked' : ''}><span>Disponible para hacer especiales</span></label></div><small class="hint">Al crear un especial, aparece primero en la lista de disponibles.</small></div>
      ${ta('dispNotas', 'Notas de disponibilidad', st.dispNotas, 'Ej.: no puede los domingos por la mañana', { rows: 2 })}
    </fieldset>
    <fieldset class="fs"><h3>Diagnósticos que ha atendido</h3>
      <div class="tags">${st.diagnosticos.map((d, i) => `<span class="tag">${esc(d)}<button type="button" class="x" data-a="tag-del" data-i="${i}" aria-label="Quitar ${esc(d)}">${ic('x', 13)}</button></span>`).join('') || '<span class="hint">Aún no hay diagnósticos.</span>'}</div>
      <div class="addrow"><input class="inp" id="${fid('diag')}" data-tag-in placeholder="Escribe un diagnóstico" aria-label="Nuevo diagnóstico"><button type="button" class="btn sm" data-a="tag-add">Agregar</button></div>
      <div class="sug"><span class="hint">Toca para agregar:</span>${DIAG_SUG.filter(d => !st.diagnosticos.includes(d)).map(d => `<button type="button" class="chip sm" data-a="tag-sug" data-v="${esc(d)}">+ ${esc(d)}</button>`).join('')}</div>
    </fieldset>
    <fieldset class="fs"><h3>Experiencia: clínicas y familias</h3>
      ${st.experiencia.map((e, i) => `<div class="rep"><div class="rep-h"><b class="small">Experiencia ${i + 1}</b><button type="button" class="btn sm ghost bad" data-a="exp-del" data-i="${i}">${ic('trash', 15)} Quitar</button></div><div class="fgrid">
        ${sel(`experiencia.${i}.tipo`, 'Tipo', e.tipo || EXP_TIPOS[0], EXP_TIPOS)}
        ${inp(`experiencia.${i}.nombre`, 'Clínica o familia', e.nombre, { ph: 'Ej.: Clínica… / Familia Pérez' })}
        ${inp(`experiencia.${i}.contacto`, 'Persona de contacto', e.contacto)}
        ${inp(`experiencia.${i}.telefono`, 'Teléfono de contacto', e.telefono, { type: 'tel' })}
        ${inp(`experiencia.${i}.desde`, 'Desde', e.desde, { ph: 'mar 2022' })}
        ${inp(`experiencia.${i}.hasta`, 'Hasta', e.hasta, { ph: 'dic 2024 o actual' })}
        ${inp(`experiencia.${i}.paciente`, 'Paciente / diagnóstico atendido', e.paciente, { full: 1 })}
        ${ta(`experiencia.${i}.notas`, 'Comentarios o referencias', e.notas, '', { rows: 2 })}
      </div></div>`).join('') || '<p class="hint">Agrega las clínicas, hospitales o familias donde trabajó.</p>'}
      <div><button type="button" class="btn sm" data-a="exp-add">${ic('plus', 16)} Agregar experiencia</button></div>
    </fieldset>
    <fieldset class="fs"><h3>Documentos</h3><p class="hint">CV, diplomas, título, colegiatura, antecedentes, copia de DNI…</p>${docsEditor(st, 'documentos', m)}</fieldset>
    <fieldset class="fs"><h3>Notas internas</h3>${ta('notas', '', st.notas, 'Solo las ven los administradores')}</fieldset>
    <p class="f-err" hidden></p>
  </form>${sheetFoot(m, m.id ? 'Guardar cambios' : 'Registrar personal')}`;
}
function saveP(m) {
  return runSave(m, async () => {
    const st = m.state; const errs = [];
    st.nombres = tidy(st.nombres); st.apellidos = tidy(st.apellidos); st.numDoc = tidy(st.numDoc).toUpperCase();
    if (!st.nombres) errs.push('Escribe los nombres.');
    if (!st.apellidos) errs.push('Escribe los apellidos.');
    if (!st.numDoc) errs.push('Escribe el número de documento.');
    const dup = st.numDoc && [...S.personal.values()].find(p => p.id !== m.id && norm(p.numDoc) === norm(st.numDoc));
    if (dup) errs.push(`Ya existe personal con el documento ${st.numDoc}: ${pName(dup)}.`);
    if (m.uploading) errs.push('Espera a que terminen de subir los archivos.');
    if (errs.length) throw fail(errs.join(' '));
    const data = { ...st, dias: st.dias.map(Number), especiales: !!st.especiales, experiencia: st.experiencia.filter(e => Object.entries(e).some(([k, v]) => k !== 'tipo' && tidy(v))) };
    const nid = await persist('personal', m.id, data);
    m.saved = true; closeModal(); toast(m.id ? 'Cambios guardados' : 'Personal registrado');
    if (!m.id) openView('p', nid);
  });
}

/* ===================== CLIENTES ===================== */
function detailC(id) {
  const c = S.clientes.get(id); if (!c) return gone('Este cliente ya no existe.');
  const I = idx();
  const svcs = (I.sc.get(id) || []).slice().sort((a, b) => (b.fechaInicio || '').localeCompare(a.fechaInicio || ''));
  const incs = (I.ic.get(id) || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const act = svcs.filter(s => s._st === 'activo');
  const dl = (l, v, full) => `<div class="${full ? 'full' : ''}"><dt>${l}</dt><dd>${v || '<span class="muted">—</span>'}</dd></div>`;
  return `${sheetHead(`${esc(cName(c))}${exTag(c)}`, `<span class="mono">${esc(docLabel(c))}</span>${act.length ? ' · ' + pill('Servicio activo', 'pri') : ''}`)}
  <div class="sheet-b">
    <div class="actions"><button type="button" class="btn pri" data-a="new-s-for" data-id="${esc(id)}">${ic('plus', 16)} Nuevo servicio</button><button type="button" class="btn" data-a="edit-c" data-id="${esc(id)}">${ic('edit', 16)} Editar</button><button type="button" class="btn bad" data-a="del-c" data-id="${esc(id)}">${ic('trash', 16)} Eliminar</button></div>
    <div class="pstats">
      <div class="stat"><b>${svcs.length}</b><span>servicios con nosotros</span></div>
      <div class="stat"><b>${act.length}</b><span>activos ahora</span></div>
      <div class="stat"><b>${svcs.filter(s => s.tipo === 'especial').length}</b><span>especiales</span></div>
      <div class="stat"><b style="${incs.length ? 'color:var(--bad)' : ''}">${incs.length}</b><span>incidentes</span></div>
    </div>
    <section class="sec"><h3>Datos del cliente</h3><div class="card"><dl class="dl">
      ${dl('Documento', `<span class="mono">${esc(TIPO_DOC[c.tipoDoc] || c.tipoDoc || '')} ${esc(c.numDoc || '')}</span>`)}
      ${dl('Fecha de nacimiento', c.fechaNac ? `${fd(c.fechaNac)} <span class="muted">(${Math.floor(daysBetween(c.fechaNac, I.t) / 365.25)} años)</span>` : '')}
      ${dl('Dirección', esc([c.direccion, c.distrito].filter(Boolean).join(', ')) + (c.referencia ? `<br><span class="muted small">Ref.: ${esc(c.referencia)}</span>` : ''), true)}
      ${dl('Celular', esc(c.telefono))}
      ${dl('Correo', esc(c.email))}
      ${dl('Condición / diagnóstico', c.condicion ? `<span class="prose">${esc(c.condicion)}</span>` : '', true)}
      ${dl('Familiar responsable', esc([c.respNombre, c.respParentesco].filter(Boolean).join(' · ')))}
      ${dl('Teléfono del responsable', esc(c.respTel))}
    </dl></div></section>
    ${(c.documentos || []).length ? `<section class="sec"><h3>Documentos</h3>${filesView(c.documentos)}</section>` : ''}
    <section class="sec"><h3>Historial de servicios ${pill(svcs.length)}</h3>${histTable(svcs, 'c')}</section>
    <section class="sec"><h3>Incidentes ${incs.length ? pill(incs.length, 'bad') : ''}</h3>${incs.length ? `<div class="list">${incs.map(i => incCard(i)).join('')}</div>` : '<p class="small muted">Sin incidentes registrados.</p>'}</section>
    ${c.notas ? `<section class="sec"><h3>Notas internas</h3><p class="prose">${esc(c.notas)}</p></section>` : ''}
  </div>`;
}
function openFormC(id, onSaved) {
  const base = id ? clone(S.clientes.get(id)) : { tipoDoc: 'DNI' };
  if (!base) return;
  if (!Array.isArray(base.documentos)) base.documentos = [];
  openModal({ kind: 'form', id, state: base, render: renderFormC, onSave: saveC, onSaved, docTypes: DOC_TIPOS_C, folder: 'clientes' });
}
function renderFormC(m) {
  const st = m.state;
  return `${sheetHead(m.id ? 'Editar cliente' : 'Nuevo cliente', m.id ? esc(cName(st)) : 'Los campos con * son obligatorios.')}
  <form class="sheet-b" novalidate autocomplete="off">
    <fieldset class="fs"><h3>Datos del cliente</h3><div class="fgrid">
      ${inp('nombres', 'Nombres', st.nombres, { req: 1 })}
      ${inp('apellidos', 'Apellidos', st.apellidos, { req: 1 })}
      ${sel('tipoDoc', 'Tipo de documento', st.tipoDoc, TIPO_DOC)}
      ${inp('numDoc', 'Número de documento', st.numDoc, { req: 1, mono: 1 })}
      ${inp('fechaNac', 'Fecha de nacimiento', st.fechaNac, { type: 'date' })}
      ${inp('telefono', 'Celular', st.telefono, { type: 'tel' })}
      ${inp('direccion', 'Dirección', st.direccion, { full: 1, req: 1, ph: 'Av., calle, jirón, número, dpto.' })}
      ${inp('distrito', 'Distrito', st.distrito, { list: 'dl-distritos' })}
      ${inp('referencia', 'Referencia', st.referencia, { ph: 'Frente al parque…' })}
      ${inp('email', 'Correo', st.email, { type: 'email' })}
      ${ta('condicion', 'Condición o diagnóstico del paciente', st.condicion, 'Ej.: Post operatorio de cadera, usa andador', { rows: 2 })}
    </div></fieldset>
    <fieldset class="fs"><h3>Familiar responsable</h3><div class="fgrid">
      ${inp('respNombre', 'Nombre', st.respNombre)}
      ${inp('respParentesco', 'Parentesco', st.respParentesco, { ph: 'Hijo, hija, esposa…' })}
      ${inp('respTel', 'Teléfono', st.respTel, { type: 'tel' })}
    </div></fieldset>
    <fieldset class="fs"><h3>Documentos</h3><p class="hint">Copia de DNI, informes médicos, recetas, contrato…</p>${docsEditor(st, 'documentos', m)}</fieldset>
    <fieldset class="fs"><h3>Notas internas</h3>${ta('notas', '', st.notas)}</fieldset>
    <p class="f-err" hidden></p>
  </form>${sheetFoot(m, m.id ? 'Guardar cambios' : 'Registrar cliente')}`;
}
function saveC(m) {
  return runSave(m, async () => {
    const st = m.state; const errs = [];
    st.nombres = tidy(st.nombres); st.apellidos = tidy(st.apellidos); st.numDoc = tidy(st.numDoc).toUpperCase();
    if (!st.nombres) errs.push('Escribe los nombres.');
    if (!st.apellidos) errs.push('Escribe los apellidos.');
    if (!st.numDoc) errs.push('Escribe el número de documento.');
    if (!tidy(st.direccion)) errs.push('Escribe la dirección.');
    const dup = st.numDoc && [...S.clientes.values()].find(c => c.id !== m.id && norm(c.numDoc) === norm(st.numDoc));
    if (dup) errs.push(`Ya existe un cliente con el documento ${st.numDoc}: ${cName(dup)}.`);
    if (m.uploading) errs.push('Espera a que terminen de subir los archivos.');
    if (errs.length) throw fail(errs.join(' '));
    const nid = await persist('clientes', m.id, st);
    m.saved = true; closeModal(); toast(m.id ? 'Cambios guardados' : 'Cliente registrado');
    if (m.onSaved) m.onSaved(nid);
  });
}

/* ===================== SERVICIOS ===================== */
function personLink(o, kind) {
  return o ? `<div class="plink" tabindex="0" role="button" data-a="open-${kind}" data-id="${esc(o.id)}">${av(o, kind === 'c' ? 'c sm' : 'sm')}<div><b>${esc(kind === 'c' ? cName(o) : pName(o))}</b><span class="small muted mono">${esc(docLabel(o))}</span></div></div>`
    : `<div class="plink"><span class="muted">${kind === 'c' ? 'Cliente eliminado' : 'Personal eliminado'}</span></div>`;
}
function detailS(id) {
  const s = S.servicios.get(id); if (!s) return gone('Este servicio ya no existe.');
  const I = idx(); const st = s._st; const sp = spanOf(s);
  const incs = (I.is.get(id) || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const nd = sp ? svcDays(s, sp.end ? null : I.t) : 0;
  const A = [];
  const b = (a, l, i, cls = '') => `<button type="button" class="btn ${cls}" data-a="${a}" data-id="${esc(id)}">${ic(i, 16)} ${l}</button>`;
  if (st !== 'finalizado' && st !== 'cancelado') {
    A.push(b('finalize', 'Finalizar servicio', 'check', 'pri'));
    if (s.fechaFin) A.push(b('extend', 'Extender', 'calplus'));
    A.push(b('edit-s', 'Editar', 'edit'), b('add-inc', 'Registrar incidente', 'alert'), b('cancel-s', 'Cancelar servicio', 'ban'));
  } else if (st === 'finalizado') A.push(b('edit-s', 'Editar', 'edit'), b('add-inc', 'Registrar incidente', 'alert'), b('reopen-s', 'Reabrir', 'undo'));
  else A.push(b('react-s', 'Reactivar', 'undo'));
  A.push(b('del-s', 'Eliminar', 'trash', 'bad'));
  return `${sheetHead(`<span class="mono">${esc(s.codigo || 'Servicio')}</span>${exTag(s)}`, `${tipoBadge(s)} ${stPill(s)}`)}
  <div class="sheet-b">
    <div class="actions">${A.join('')}</div>
    ${st === 'porcerrar' ? `<div class="alert"><div class="alert-h">${ic('alert')}<span>El período terminó el ${fd(s.fechaFin)}</span></div><p class="small">Si el cliente decide continuar, extiéndelo. Si no, finalízalo y registra si hubo incidentes.</p></div>` : ''}
    <div class="facts">
      <div><span class="eyebrow">Fechas</span><b>${esc(fRange(s.fechaInicio, s.fechaFin))}</b><span class="small muted">${plural(nd, 'día', 'días')} de servicio${sp && !sp.end ? ' a la fecha' : ''}</span></div>
      <div><span class="eyebrow">Turno</span>${turnoTag(s.turno)}${s.tipo === 'estable' ? `<span class="small muted">${esc(diasTxt(s.dias))}</span>` : ''}</div>
      <div><span class="eyebrow">Dirección</span><span>${esc(s.direccion || '—')}</span></div>
    </div>
    <section class="sec"><h3>${(s.clienteIds || []).length > 1 ? 'Clientes' : 'Cliente'}</h3><div class="plist">${(s.clienteIds || []).map(cid => personLink(S.clientes.get(cid), 'c')).join('') || '<p class="small muted">Sin cliente.</p>'}</div></section>
    <section class="sec"><h3>Personal asignado</h3><div class="plist">${(s.personalIds || []).map(pid => personLink(S.personal.get(pid), 'p')).join('') || '<p class="small muted">Sin personal asignado. Usa «Editar» para asignar.</p>'}</div></section>
    ${s.indicaciones ? `<section class="sec"><h3>Indicaciones</h3><div class="card"><p class="prose">${esc(s.indicaciones)}</p></div></section>` : ''}
    ${(s.extensiones || []).length ? `<section class="sec"><h3>Extensiones</h3><div class="plist">${s.extensiones.map(e => `<div class="card" style="gap:4px"><b>Se extendió hasta el ${fd(e.hasta)}</b><span class="small muted">Antes terminaba el ${fd(e.desde)} · registrado el ${fd(e.fecha)}</span>${e.nota ? `<p class="small prose">${esc(e.nota)}</p>` : ''}</div>`).join('')}</div></section>` : ''}
    ${s.cierre ? `<section class="sec"><h3>Cierre</h3><div class="card"><dl class="dl"><div><dt>Fecha de cierre</dt><dd>${fd(s.cierre.fecha)}</dd></div><div><dt>¿Hubo incidentes?</dt><dd>${incs.length || s.cierre.huboIncidente ? '<b style="color:var(--bad)">Sí</b>' : 'No'}</dd></div>${s.cierre.observaciones ? `<div class="full"><dt>Observaciones</dt><dd class="prose">${esc(s.cierre.observaciones)}</dd></div>` : ''}</dl></div></section>` : ''}
    <section class="sec"><h3>Incidentes ${incs.length ? pill(incs.length, 'bad') : ''}</h3>${incs.length ? `<div class="list">${incs.map(i => incCard(i)).join('')}</div>` : '<p class="small muted">Sin incidentes en este servicio.</p>'}</section>
    ${s.creado ? `<p class="hint">Creado el ${fd(String(s.creado).slice(0, 10))}${s.actualizado ? ` · última modificación ${fd(String(s.actualizado).slice(0, 10))}` : ''}</p>` : ''}
  </div>`;
}
function openFormS(id, preset = {}) {
  const base = id ? clone(S.servicios.get(id)) : { tipo: 'especial', turno: 'dia', fechaInicio: today(), fechaFin: '', clienteIds: [], personalIds: [], dias: [], ...preset };
  if (!base) return;
  for (const k of ['clienteIds', 'personalIds', 'dias']) if (!Array.isArray(base[k])) base[k] = [];
  base.dias = base.dias.map(String); base.fechaFin = base.fechaFin || '';
  if (!base.direccion && base.clienteIds.length) { const c = S.clientes.get(base.clienteIds[0]); if (c) base.direccion = [c.direccion, c.distrito].filter(Boolean).join(', '); }
  openModal({ kind: 'form', id, state: base, render: renderFormS, onSave: saveS, onChange: changeS });
}
function draftSpan(st) {
  const isEsp = st.tipo === 'especial';
  if (!st.fechaInicio) return { ok: false, msg: 'Elige la fecha de inicio.' };
  if (isEsp && !st.fechaFin) return { ok: false, msg: 'Elige la fecha de término del especial.' };
  const end = st.fechaFin || null;
  if (end && end < st.fechaInicio) return { ok: false, msg: 'La fecha de término es anterior a la de inicio.' };
  if (!st.turno) return { ok: false, msg: 'Elige el turno.' };
  const dias = isEsp ? null : (st.dias || []).map(Number);
  if (!isEsp && !dias.length) return { ok: false, msg: 'Marca al menos un día de la semana.' };
  return { ok: true, sp: { start: st.fechaInicio, end, dias, turno: st.turno } };
}
function spanSummary(st) {
  const d = draftSpan(st); if (!d.ok) return `<span class="warn-t">${esc(d.msg)}</span>`;
  const sp = d.sp; const T = TURNOS[sp.turno];
  if (st.tipo === 'especial') { const n = daysBetween(sp.start, sp.end) + 1; return `${plural(n, 'día', 'días')} · ${esc(fRange(sp.start, sp.end))} · ${T.l} (${T.h})`; }
  return `${esc(diasTxt(sp.dias))} · ${T.l} (${T.h}) · ${sp.end ? `del ${fd(sp.start)} al ${fd(sp.end)}` : `desde el ${fd(sp.start)}, sin fecha de término`}`;
}
function renderFormS(m) {
  const st = m.state, isEsp = st.tipo === 'especial';
  return `${sheetHead(m.id ? `Editar servicio <span class="mono">${esc(st.codigo || '')}</span>` : 'Nuevo servicio', m.id ? '' : 'Elige el cliente, las fechas y el turno; luego asigna al personal disponible.')}
  <form class="sheet-b" novalidate autocomplete="off">
    <fieldset class="fs"><h3>Tipo de servicio</h3><div class="opts big">
      ${optRadio('tipo', 'especial', '<b>Especial</b><small>Período definido: termina en la fecha indicada, salvo que se extienda</small>', isEsp)}
      ${optRadio('tipo', 'estable', '<b>Turno estable</b><small>Turno fijo en ciertos días de la semana</small>', !isEsp)}
    </div></fieldset>
    <fieldset class="fs"><h3>Cliente(s) <em>*</em></h3>
      <div class="pick"><label class="search sm">${ic('search', 16)}<input type="search" data-q="cli" value="${esc(st._cq || '')}" placeholder="Buscar cliente por DNI o nombre" aria-label="Buscar cliente"></label>
      <div class="pick-list short" data-list="cli">${clientPickList(st)}</div>
      <div><button type="button" class="btn sm" data-a="new-c-inline">${ic('plus', 16)} Registrar cliente nuevo</button></div></div>
      <div class="fgrid">${inp('direccion', 'Dirección del servicio', st.direccion, { full: 1, hint: 'Se completa con la dirección del primer cliente que elijas.' })}</div>
    </fieldset>
    <fieldset class="fs"><h3>Fechas y turno</h3><div class="fgrid">
      ${inp('fechaInicio', 'Fecha de inicio', st.fechaInicio, { type: 'date', req: 1 })}
      ${inp('fechaFin', isEsp ? 'Fecha de término' : 'Fecha de término (opcional)', st.fechaFin, { type: 'date', req: isEsp, min: st.fechaInicio, hint: isEsp ? '' : 'Déjala vacía si el turno es indefinido.' })}
    </div>
      <div class="fld"><span>Turno <em>*</em></span><div class="opts">${Object.entries(TURNOS).map(([k, t]) => optRadio('turno', k, `${blocks(k)} ${t.l} <small>${t.h}</small>`, st.turno === k)).join('')}</div></div>
      ${isEsp ? '' : `<div class="fld"><span>Días de la semana <em>*</em></span><div class="opts">${SEMANA.map(([n, l]) => optChk('dias[]', n, l, st.dias.includes(String(n)))).join('')}</div>
        <div class="ext-q"><button type="button" class="chip sm" data-a="dias-q" data-v="1,2,3,4,5">Lunes a viernes</button><button type="button" class="chip sm" data-a="dias-q" data-v="1,2,3,4,5,6">Lunes a sábado</button><button type="button" class="chip sm" data-a="dias-q" data-v="0,1,2,3,4,5,6">Todos los días</button></div></div>`}
      <p class="small muted span-sum">${spanSummary(st)}</p>
    </fieldset>
    <fieldset class="fs"><h3>Personal de enfermería</h3>
      <p class="hint">${isEsp ? 'Primero aparece quien está libre y marcó que hace especiales; luego quien está libre pero no lo marcó. Quien ya tiene un servicio en esas fechas y turno aparece como ocupado.' : 'Primero aparece quien está libre y prefiere este turno; luego quien está libre con otras preferencias. Quien ya tiene un servicio en esos días y turno aparece como ocupado.'}</p>
      <div class="pick"><label class="search sm">${ic('search', 16)}<input type="search" data-q="per" value="${esc(st._pq || '')}" placeholder="Filtrar por nombre o DNI" aria-label="Filtrar personal"></label>
      <div class="pick-list" data-list="per">${staffPickList(st, m.id)}</div></div>
    </fieldset>
    <fieldset class="fs"><h3>Indicaciones</h3>${ta('indicaciones', 'Indicaciones para el personal', st.indicaciones, 'Medicación, cuidados, horarios, contacto en casa…')}</fieldset>
    <p class="f-err" hidden></p>
  </form>${sheetFoot(m, m.id ? 'Guardar cambios' : 'Crear servicio')}`;
}
function clientPickList(st) {
  const q = norm(st._cq || ''); const selSet = new Set(st.clienteIds);
  const all = [...S.clientes.values()].sort(byName(cName));
  const list = all.filter(c => selSet.has(c.id) || matchQ(q, [c.nombres, c.apellidos, `${c.nombres} ${c.apellidos}`, c.numDoc]))
    .sort((a, b) => (selSet.has(b.id) - selSet.has(a.id))).slice(0, 60);
  const missing = st.clienteIds.filter(id => !S.clientes.has(id));
  if (!all.length && !missing.length) return '<p class="hint">Aún no hay clientes. Regístralo con el botón de abajo.</p>';
  return list.map(c => `<label class="pi"><input type="checkbox" data-pick="cli" value="${esc(c.id)}" ${selSet.has(c.id) ? 'checked' : ''}>${av(c, 'c sm')}<div class="pi-b"><b>${esc(cName(c))}${exTag(c)}</b><span class="small muted"><span class="mono">${esc(docLabel(c))}</span>${c.direccion ? ' · ' + esc([c.direccion, c.distrito].filter(Boolean).join(', ')) : ''}</span></div></label>`).join('')
    + missing.map(id => `<label class="pi"><input type="checkbox" data-pick="cli" value="${esc(id)}" checked><div class="pi-b"><b class="muted">Cliente eliminado</b></div></label>`).join('')
    || '<p class="hint">Ningún cliente coincide con la búsqueda.</p>';
}
function staffPickList(st, excl) {
  const d = draftSpan(st); const isEsp = st.tipo === 'especial'; const selSet = new Set(st.personalIds); const q = norm(st._pq || '');
  const selChips = () => st.personalIds.length ? `<div class="pg-h">Seleccionados</div>${st.personalIds.map(id => { const p = S.personal.get(id); return `<label class="pi"><input type="checkbox" data-pick="per" value="${esc(id)}" checked>${av(p, 'sm')}<div class="pi-b"><b>${esc(pName(p))}</b></div></label>`; }).join('')}` : '';
  if (!d.ok) return `<p class="warn-t">${esc(d.msg)} Así podremos mostrarte quién está disponible.</p>${selChips()}`;
  if (!S.personal.size) return '<p class="hint">Aún no hay personal registrado.</p>';
  const g = { pref: [], libre: [], ocup: [] };
  for (const p of S.personal.values()) {
    if (p.estado === 'inactivo' && !selSet.has(p.id)) continue;
    if (!selSet.has(p.id) && !matchQ(q, [p.nombres, p.apellidos, `${p.nombres} ${p.apellidos}`, p.numDoc])) continue;
    const cl = staffClashes(p.id, d.sp, excl);
    const it = { p, cl, sel: selSet.has(p.id) };
    if (cl.length) g.ocup.push(it);
    else if (isEsp ? p.especiales : (p.turnos || []).some(t => blocksOverlap(t, d.sp.turno))) g.pref.push(it);
    else g.libre.push(it);
  }
  const sorter = (a, b) => (b.sel - a.sel) || pName(a.p).localeCompare(pName(b.p), 'es');
  const titles = isEsp ? ['Libres · marcaron que hacen especiales', 'Libres · no marcaron especiales', 'Ocupados en esas fechas'] : ['Libres · prefieren este turno', 'Libres · prefieren otros turnos', 'Ocupados en ese horario'];
  const colors = ['--ok', '--ink-3', '--bad'];
  const sec = (arr, i) => arr.length ? `<div class="pg-h"><i class="dot" style="color:var(${colors[i]})"></i>${titles[i]} · ${arr.length}</div>${arr.sort(sorter).map(x => pickItem(x, isEsp, d.sp)).join('')}` : '';
  return (sec(g.pref, 0) + sec(g.libre, 1) + sec(g.ocup, 2)) || '<p class="hint">Nadie coincide con la búsqueda.</p>';
}
function pickItem({ p, cl, sel: isSel }, isEsp, sp) {
  const busy = cl.length > 0; const notes = [];
  if (busy) { const c = cl[0]; notes.push(`<span class="busy-t">Ocupado(a) el ${fds(c.d)} en ${esc(c.s.codigo)} · ${esc((TURNOS[c.s.turno] || {}).l || '')}${cl.length > 1 ? ` (y ${cl.length - 1} más)` : ''}</span>`); if (isSel) notes.push('<span class="warn-t">Ya estaba asignado(a); revisa el cruce de horarios.</span>'); }
  if (p.estado === 'inactivo') notes.push('<span class="warn-t">Está marcado(a) como inactivo(a).</span>');
  if (!busy && sp.dias && (p.dias || []).length && sp.dias.some(x => !p.dias.map(Number).includes(x))) notes.push('<span class="warn-t">Prefiere otros días</span>');
  const tags = (p.turnos || []).map(t => `<span class="tag">${esc((TURNOS[t] || {}).l || t)}</span>`).join('') + (p.especiales ? '<span class="tag" style="color:var(--esp)">Hace especiales</span>' : '');
  return `<label class="pi ${busy ? 'busy' : ''}"><input type="checkbox" data-pick="per" value="${esc(p.id)}" ${isSel ? 'checked' : ''} ${busy && !isSel ? 'disabled' : ''}>${av(p, 'sm')}<div class="pi-b"><b>${esc(pName(p))}${exTag(p)}</b><span class="small muted"><span class="mono">${esc(docLabel(p))}</span> · ${esc(CATEG_S[p.categoria] || '')}</span>${tags ? `<span class="pi-tags">${tags}</span>` : ''}${notes.join('')}</div></label>`;
}
function changeS(t, m) {
  if (t.name === 'tipo') { syncForm(m); paint(m); return; }
  if (['fechaInicio', 'fechaFin', 'turno', 'dias[]'].includes(t.name)) { syncForm(m); repaintPicker(m); }
}
function repaintPicker(m) {
  const l = m.sheet.querySelector('[data-list="per"]'); if (l) l.innerHTML = staffPickList(m.state, m.id);
  const s = m.sheet.querySelector('.span-sum'); if (s) s.innerHTML = spanSummary(m.state);
  const ff = m.sheet.querySelector('[name="fechaFin"]'); if (ff && m.state.fechaInicio) ff.min = m.state.fechaInicio;
}
function saveS(m) {
  return runSave(m, async () => {
    const st = m.state; const errs = [];
    if (!st.clienteIds.length) errs.push('Elige al menos un cliente.');
    const d = draftSpan(st); if (!d.ok) errs.push(d.msg);
    if (errs.length) throw fail(errs.join(' '));
    const clashes = st.personalIds.map(pid => ({ p: S.personal.get(pid), cl: staffClashes(pid, d.sp, m.id) })).filter(x => x.cl.length);
    if (clashes.length) {
      m.busy = false; paint(m);
      const ok = await confirmBox({ title: 'Hay cruces de horario', body: esc(clashes.map(x => `${pName(x.p)} ya está en ${x.cl[0].s.codigo} el ${fds(x.cl[0].d)}`).join('. ')) + '. ¿Guardar de todas formas?', ok: 'Guardar igual', tone: 'pri' });
      if (!ok) return; m.busy = true; paint(m);
    }
    const data = {
      ...st, codigo: st.codigo || nextCode(), fechaFin: d.sp.end, dias: st.tipo === 'estable' ? st.dias.map(Number) : [],
      direccion: tidy(st.direccion), estado: st.estado || 'vigente', cierre: st.cierre || null, extensiones: st.extensiones || [], ejemplo: !!st.ejemplo,
    };
    try { await persist('servicios', m.id, data); }
    catch (e) {
      if (!m.id && e && e.code === '23505') { await fetchAll('servicios'); data.codigo = nextCode(); await persist('servicios', null, data); }
      else throw e;
    }
    m.saved = true; closeModal(); toast(m.id ? 'Servicio actualizado' : `Servicio ${data.codigo} creado`);
  });
}

/* --- extender --- */
function openExtend(id) {
  const s = S.servicios.get(id); if (!s || !s.fechaFin) return;
  const base = s.fechaFin < today() ? today() : s.fechaFin;
  openModal({ kind: 'form', sid: id, state: { nuevaFin: addDays(base, 3), nota: '' }, render: renderExtend, onSave: saveExtend, onChange: (t, m) => { if (t.name === 'nuevaFin') { syncForm(m); const c = m.sheet.querySelector('.ext-conf'); if (c) c.innerHTML = extConflicts(m); } } });
}
function extConflicts(m) {
  const s = S.servicios.get(m.sid); const nf = m.state.nuevaFin;
  if (!s) return '';
  if (!nf || nf <= s.fechaFin) return `<p class="warn-t">La nueva fecha debe ser posterior al ${fd(s.fechaFin)}.</p>`;
  const base = spanOf(s);
  const sp = { start: addDays(s.fechaFin, 1), end: nf, dias: base && base.dias, turno: s.turno };
  const rows = (s.personalIds || []).map(pid => ({ p: S.personal.get(pid), cl: staffClashes(pid, sp, s.id) }));
  return `<p class="small">Se agregan ${plural(daysBetween(s.fechaFin, nf), 'día', 'días')}: del ${fd(sp.start)} al ${fd(nf)}.</p>` + rows.map(r => r.cl.length ? `<p class="busy-t">${esc(pName(r.p))} está ocupado(a) el ${fds(r.cl[0].d)} en ${esc(r.cl[0].s.codigo)}.</p>` : `<p class="ok-t">${esc(pName(r.p))} está libre en esos días.</p>`).join('');
}
function renderExtend(m) {
  const s = S.servicios.get(m.sid); if (!s) return gone('El servicio ya no existe.');
  return `${sheetHead(`Extender <span class="mono">${esc(s.codigo)}</span>`, `${esc(clientsOf(s))} · termina el ${fd(s.fechaFin)}`)}
  <form class="sheet-b" novalidate>
    <fieldset class="fs"><h3>Nueva fecha de término</h3>
      <div class="fgrid">${inp('nuevaFin', 'Termina el', m.state.nuevaFin, { type: 'date', req: 1, min: addDays(s.fechaFin, 1) })}</div>
      <div class="ext-q">${[1, 3, 7, 15, 30].map(n => `<button type="button" class="chip sm" data-a="ext-q" data-v="${n}">+${plural(n, 'día', 'días')}</button>`).join('')}</div>
      <div class="ext-conf">${extConflicts(m)}</div>
      ${ta('nota', 'Acuerdo con el cliente', m.state.nota, 'Ej.: la familia pide continuar una semana más')}
    </fieldset>
    <p class="f-err" hidden></p>
  </form>${sheetFoot(m, 'Guardar extensión')}`;
}
function saveExtend(m) {
  return runSave(m, async () => {
    const s = S.servicios.get(m.sid); const nf = m.state.nuevaFin;
    if (!s) throw fail('El servicio ya no existe.');
    if (!nf || nf <= s.fechaFin) throw fail(`La nueva fecha debe ser posterior al ${fd(s.fechaFin)}.`);
    await patch('servicios', s.id, { fechaFin: nf, extensiones: [...(s.extensiones || []), { fecha: today(), desde: s.fechaFin, hasta: nf, nota: tidy(m.state.nota) }] });
    m.saved = true; closeModal(); toast(`Servicio extendido hasta el ${fd(nf)}`);
  });
}

/* --- finalizar --- */
function newInc(s, fecha) { return { fecha, gravedad: 'leve', motivo: '', causa: '', descripcion: '', acciones: '', personalIds: [...((s && s.personalIds) || [])], clienteIds: [...((s && s.clienteIds) || [])], evidencias: [] }; }
function openFinalize(id) {
  const s = S.servicios.get(id); if (!s) return; const t = today();
  const fecha = s.fechaFin && s.fechaFin < t ? s.fechaFin : t;
  openModal({ kind: 'form', sid: id, noDocType: true, folder: 'incidentes', state: { fecha, hubo: 'no', obs: '', incidentes: [] }, render: renderFinalize, onSave: saveFinalize, onChange: (el, m) => { if (el.name === 'hubo') { syncForm(m); if (m.state.hubo === 'si' && !m.state.incidentes.length) m.state.incidentes.push(newInc(s, m.state.fecha)); paint(m); } } });
}
function incEditor(inc, path, s, m, n) {
  const pids = [...new Set([...((s && s.personalIds) || []), ...(inc.personalIds || [])])];
  const cids = [...new Set([...((s && s.clienteIds) || []), ...(inc.clienteIds || [])])];
  const pre = path ? path + '.' : '';
  return `<div class="${path ? 'rep' : 'fs'}">
    ${path ? `<div class="rep-h"><h3>Incidente ${n}</h3><button type="button" class="btn sm ghost bad" data-a="inc-del" data-i="${n - 1}">${ic('trash', 15)} Quitar</button></div>` : '<h3>Detalle del incidente</h3>'}
    <div class="fgrid">
      ${inp(pre + 'fecha', 'Fecha', inc.fecha, { type: 'date', req: 1 })}
      ${sel(pre + 'gravedad', 'Gravedad', inc.gravedad, GRAV)}
      ${inp(pre + 'motivo', 'Motivo', inc.motivo, { full: 1, req: 1, ph: 'Ej.: caída del paciente, falta del personal, reclamo de la familia…' })}
      ${ta(pre + 'causa', 'Causa', inc.causa, '¿Por qué ocurrió?', { rows: 2 })}
      ${ta(pre + 'descripcion', 'Qué pasó', inc.descripcion, 'Describe lo ocurrido', { rows: 3 })}
      ${ta(pre + 'acciones', 'Acciones tomadas', inc.acciones, 'Ej.: se llamó a la familia, se atendió…', { rows: 2 })}
    </div>
    <div class="fld"><span>Personal involucrado</span><div class="opts">${pids.map(id => optChk(pre + 'personalIds[]', id, esc(pName(S.personal.get(id))), (inc.personalIds || []).includes(id))).join('') || '<span class="hint">El servicio no tiene personal asignado.</span>'}</div></div>
    <div class="fld"><span>Cliente(s)</span><div class="opts">${cids.map(id => optChk(pre + 'clienteIds[]', id, esc(cName(S.clientes.get(id))), (inc.clienteIds || []).includes(id))).join('') || '<span class="hint">Sin clientes.</span>'}</div></div>
    <div class="fld"><span>Evidencias</span><span class="hint">Fotos, PDF, videos o documentos</span>${docsEditor(m.state, pre + 'evidencias', m)}</div>
  </div>`;
}
function renderFinalize(m) {
  const s = S.servicios.get(m.sid); if (!s) return gone('El servicio ya no existe.');
  const st = m.state;
  return `${sheetHead(`Finalizar <span class="mono">${esc(s.codigo)}</span>`, `${esc(clientsOf(s))} · ${esc(fRange(s.fechaInicio, s.fechaFin))}`)}
  <form class="sheet-b" novalidate>
    <fieldset class="fs"><h3>Cierre del servicio</h3>
      <div class="fgrid">${inp('fecha', 'Fecha de cierre', st.fecha, { type: 'date', req: 1, min: s.fechaInicio })}</div>
      <div class="fld"><span>¿Hubo incidentes durante el servicio?</span><div class="opts">${optRadio('hubo', 'no', 'No, sin incidentes', st.hubo === 'no')}${optRadio('hubo', 'si', 'Sí, hubo incidentes', st.hubo === 'si')}</div></div>
    </fieldset>
    ${st.hubo === 'si' ? st.incidentes.map((inc, i) => incEditor(inc, 'incidentes.' + i, s, m, i + 1)).join('') + `<div><button type="button" class="btn sm" data-a="inc-add">${ic('plus', 16)} Agregar otro incidente</button></div>` : ''}
    <fieldset class="fs"><h3>Observaciones del cierre</h3>${ta('obs', '', st.obs, 'Comentarios de la familia, estado del paciente al cierre…')}</fieldset>
    <p class="f-err" hidden></p>
  </form>${sheetFoot(m, 'Finalizar servicio')}`;
}
function cleanInc(inc, sid) {
  return { servicioId: sid, fecha: inc.fecha, gravedad: inc.gravedad || 'leve', motivo: tidy(inc.motivo), causa: tidy(inc.causa), descripcion: tidy(inc.descripcion), acciones: tidy(inc.acciones), personalIds: inc.personalIds || [], clienteIds: inc.clienteIds || [], evidencias: inc.evidencias || [], ejemplo: !!inc.ejemplo };
}
function saveFinalize(m) {
  return runSave(m, async () => {
    const s = S.servicios.get(m.sid); const st = m.state; const errs = [];
    if (!s) throw fail('El servicio ya no existe.');
    if (!st.fecha) errs.push('Elige la fecha de cierre.');
    if (st.fecha && st.fecha < s.fechaInicio) errs.push('La fecha de cierre no puede ser anterior al inicio del servicio.');
    if (st.hubo === 'si') st.incidentes.forEach((inc, i) => { if (!tidy(inc.motivo)) errs.push(`Escribe el motivo del incidente ${i + 1}.`); if (!inc.fecha) errs.push(`Elige la fecha del incidente ${i + 1}.`); });
    if (m.uploading) errs.push('Espera a que terminen de subir los archivos.');
    if (errs.length) throw fail(errs.join(' '));
    if (st.hubo === 'si') { for (const inc of st.incidentes) { if (!inc._savedId) inc._savedId = await persist('incidentes', null, cleanInc(inc, s.id)); } }
    else for (const inc of st.incidentes) m.delAssets.push(...(inc.evidencias || []).map(d => d.path));
    await patch('servicios', s.id, { cierre: { fecha: st.fecha, huboIncidente: st.hubo === 'si', observaciones: tidy(st.obs), registrado: today() } });
    m.saved = true; closeModal(); toast(`Servicio ${s.codigo} finalizado`);
  });
}

/* --- incidente individual --- */
function openFormI(id, sid) {
  let base, s;
  if (id) { base = clone(S.incidentes.get(id)); if (!base) return; s = S.servicios.get(base.servicioId); }
  else { s = S.servicios.get(sid); if (!s) return; base = { servicioId: sid, ...newInc(s, today()) }; }
  for (const k of ['personalIds', 'clienteIds', 'evidencias']) if (!Array.isArray(base[k])) base[k] = [];
  openModal({ kind: 'form', id, sid: base.servicioId, noDocType: true, folder: 'incidentes', state: base, render: renderFormI, onSave: saveI });
}
function renderFormI(m) {
  const s = S.servicios.get(m.sid);
  return `${sheetHead(m.id ? 'Editar incidente' : 'Registrar incidente', s ? `<span class="mono">${esc(s.codigo)}</span> · ${esc(clientsOf(s))}` : 'Servicio eliminado')}
  <form class="sheet-b" novalidate>${incEditor(m.state, '', s, m, 1)}<p class="f-err" hidden></p></form>${sheetFoot(m, m.id ? 'Guardar cambios' : 'Registrar incidente')}`;
}
function saveI(m) {
  return runSave(m, async () => {
    const st = m.state; const errs = [];
    if (!tidy(st.motivo)) errs.push('Escribe el motivo del incidente.');
    if (!st.fecha) errs.push('Elige la fecha.');
    if (m.uploading) errs.push('Espera a que terminen de subir los archivos.');
    if (errs.length) throw fail(errs.join(' '));
    const s = S.servicios.get(m.sid);
    await persist('incidentes', m.id, cleanInc(st, m.sid));
    if (!m.id && s && s.cierre && !s.cierre.huboIncidente) await patch('servicios', s.id, { cierre: { ...s.cierre, huboIncidente: true } }).catch(() => { });
    m.saved = true; closeModal(); toast(m.id ? 'Incidente actualizado' : 'Incidente registrado');
  });
}
function detailI(id) {
  const i = S.incidentes.get(id); if (!i) return gone('Este incidente ya no existe.');
  const s = S.servicios.get(i.servicioId);
  return `${sheetHead(`${esc(i.motivo || 'Incidente')}${exTag(i)}`, `${pill(GRAV[i.gravedad] || 'Incidente', GRAV_T[i.gravedad] || 'bad')} ${fd(i.fecha)}`)}
  <div class="sheet-b">
    <div class="actions"><button type="button" class="btn" data-a="edit-i" data-id="${esc(id)}">${ic('edit', 16)} Editar</button><button type="button" class="btn bad" data-a="del-i" data-id="${esc(id)}">${ic('trash', 16)} Eliminar</button></div>
    <section class="sec"><h3>Servicio</h3>${s ? `<div class="mini" tabindex="0" role="button" data-a="open-s" data-id="${esc(s.id)}"><span class="mono">${esc(s.codigo)}</span>${tipoBadge(s)}<span class="mini-t">${esc(clientsOf(s))}</span><span class="small muted">${esc(fRange(s.fechaInicio, s.fechaFin))}</span></div>` : '<p class="small muted">El servicio fue eliminado.</p>'}</section>
    <div class="card"><dl class="dl">
      <div class="full"><dt>Motivo</dt><dd>${esc(i.motivo || '—')}</dd></div>
      <div class="full"><dt>Causa</dt><dd class="prose">${esc(i.causa || '—')}</dd></div>
      <div class="full"><dt>Qué pasó</dt><dd class="prose">${esc(i.descripcion || '—')}</dd></div>
      <div class="full"><dt>Acciones tomadas</dt><dd class="prose">${esc(i.acciones || '—')}</dd></div>
    </dl></div>
    <section class="sec"><h3>Personal involucrado</h3><div class="plist">${(i.personalIds || []).map(pid => personLink(S.personal.get(pid), 'p')).join('') || '<p class="small muted">Sin personal indicado.</p>'}</div></section>
    <section class="sec"><h3>Cliente(s)</h3><div class="plist">${(i.clienteIds || []).map(cid => personLink(S.clientes.get(cid), 'c')).join('') || '<p class="small muted">Sin cliente indicado.</p>'}</div></section>
    <section class="sec"><h3>Evidencias ${pill((i.evidencias || []).length)}</h3>${(i.evidencias || []).length ? filesView(i.evidencias, true) : '<p class="small muted">Sin evidencias.</p>'}</section>
  </div>`;
}

/* ===================== abrir / eliminar ===================== */
function openView(kind, id) {
  const R = { p: detailP, c: detailC, s: detailS, i: detailI }[kind];
  const key = kind + ':' + id; const t = topModal(); if (t && t.key === key) return;
  openModal({ kind: 'view', key, render: () => R(id) });
}
function closeKeys(keys) { while (modals.length && keys.includes(topModal().key)) closeModal(); }
async function delP(id) {
  const p = S.personal.get(id); if (!p) return;
  const n = (idx().sp.get(id) || []).length;
  if (!await confirmBox({ title: `¿Eliminar a ${esc(pName(p))}?`, body: `Se borrarán sus datos y ${plural((p.documentos || []).length, 'documento', 'documentos')}. ${n ? `Sus ${plural(n, 'servicio', 'servicios')} se conservan y mostrarán «Personal eliminado».` : ''} No se puede deshacer.` })) return;
  try { await removeDoc('personal', id); removeFiles(p.documentos); closeKeys(['p:' + id]); toast('Personal eliminado'); } catch (e) { toast(dbMsg(e), 'bad'); }
}
async function delC(id) {
  const c = S.clientes.get(id); if (!c) return;
  const n = (idx().sc.get(id) || []).length;
  if (!await confirmBox({ title: `¿Eliminar a ${esc(cName(c))}?`, body: `Se borrarán sus datos y documentos. ${n ? `Sus ${plural(n, 'servicio', 'servicios')} se conservan y mostrarán «Cliente eliminado».` : ''} No se puede deshacer.` })) return;
  try { await removeDoc('clientes', id); removeFiles(c.documentos); closeKeys(['c:' + id]); toast('Cliente eliminado'); } catch (e) { toast(dbMsg(e), 'bad'); }
}
async function delS(id) {
  const s = S.servicios.get(id); if (!s) return;
  const incs = idx().is.get(id) || [];
  if (!await confirmBox({ title: `¿Eliminar el servicio ${esc(s.codigo)}?`, body: `Desaparecerá del historial del personal y de los clientes${incs.length ? `, junto con ${plural(incs.length, 'incidente', 'incidentes')} y sus evidencias` : ''}. Si solo quieres detenerlo, usa «Cancelar servicio». No se puede deshacer.` })) return;
  try { for (const i of incs) { await removeDoc('incidentes', i.id); removeFiles(i.evidencias); } await removeDoc('servicios', id); closeKeys(['s:' + id]); toast('Servicio eliminado'); } catch (e) { toast(dbMsg(e), 'bad'); }
}
async function delI(id) {
  const i = S.incidentes.get(id); if (!i) return;
  if (!await confirmBox({ title: '¿Eliminar este incidente?', body: `Se borrará «${esc(i.motivo || 'Incidente')}» y ${plural((i.evidencias || []).length, 'evidencia', 'evidencias')}. No se puede deshacer.` })) return;
  try { await removeDoc('incidentes', id); removeFiles(i.evidencias); closeKeys(['i:' + id]); toast('Incidente eliminado'); } catch (e) { toast(dbMsg(e), 'bad'); }
}
async function simplePatch(id, data, conf, msg) {
  if (conf && !await confirmBox(conf)) return;
  try { await patch('servicios', id, data); toast(msg); } catch (e) { toast(dbMsg(e), 'bad'); }
}
async function clearExamples() {
  const n = COLS.reduce((k, c) => k + [...S[c].values()].filter(x => x.ejemplo).length, 0);
  if (!await confirmBox({ title: '¿Borrar los datos de ejemplo?', body: `Se eliminarán ${plural(n, 'registro de ejemplo', 'registros de ejemplo')}. Tus propios registros no se tocan.`, ok: 'Borrar ejemplos' })) return;
  try {
    for (const c of ['incidentes', 'servicios', 'clientes', 'personal']) {
      const rows = [...S[c].values()].filter(x => x.ejemplo);
      for (const r of rows) { removeFiles(r.documentos); removeFiles(r.evidencias); }
      await run(() => sb.from(c).delete().eq('ejemplo', true));
      for (const r of rows) S[c].delete(r.id);
    }
    scheduleRender(); toast('Datos de ejemplo borrados');
  } catch (e) { toast(dbMsg(e), 'bad'); }
}

/* ===================== eventos ===================== */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href]');
  if (link) {
    if (link.dataset.fpath && !signedNow(link.dataset.fpath)) { e.preventDefault(); toast('Preparando el archivo… vuelve a tocar en un momento.'); hydrateFiles(link.parentElement || document); }
    return;
  }
  const el = e.target.closest('[data-a]');
  if (!el) { const m = topModal(); if (m && e.target === m.el && (m.kind === 'view' || m.kind === 'confirm')) closeModal(); return; }
  if (el.tagName === 'INPUT') return;
  const a = el.dataset.a, id = el.dataset.id, m = topModal();
  switch (a) {
    case 'nav': while (modals.length) closeModal(); go(el.dataset.v); break;
    case 'kpi': {
      const k = el.dataset.k;
      if (k.startsWith('personal-')) { S.f.personal = { 'personal-todos': 'todos', 'personal-servicio': 'servicio', 'personal-libres': 'libres', 'personal-inactivos': 'inactivos' }[k]; S.q.personal = ''; go('personal'); }
      else if (k === 'servicios-activo') { S.f.servicios = 'activo'; S.f.tipo = 'todos'; S.q.servicios = ''; go('servicios'); }
      else go(k);
      break;
    }
    case 'flt': S.f[el.dataset.g] = el.dataset.v; renderMain(); break;
    case 'per': S.period.kind = el.dataset.v; S.selBucket = undefined; renderMain(); break;
    case 'per-step': {
      const n = +el.dataset.v, a0 = parseD(S.period.anchor);
      if (S.period.kind === 'semana') S.period.anchor = addDays(S.period.anchor, 7 * n);
      else if (S.period.kind === 'mes') S.period.anchor = ymd(new Date(a0.getFullYear(), a0.getMonth() + n, 1));
      else S.period.anchor = ymd(new Date(a0.getFullYear() + n, 0, 1));
      S.selBucket = undefined; renderMain(); break;
    }
    case 'bucket': { const i = +el.dataset.i; S.selBucket = i < 0 || S.selBucket === i ? null : i; renderMain(); break; }
    case 'new-p': openFormP(); break;
    case 'new-c': openFormC(); break;
    case 'new-s': openFormS(); break;
    case 'new-s-for': openFormS(null, { clienteIds: [id] }); break;
    case 'open-p': openView('p', id); break;
    case 'open-c': openView('c', id); break;
    case 'open-s': openView('s', id); break;
    case 'open-i': openView('i', id); break;
    case 'edit-p': openFormP(id); break;
    case 'edit-c': openFormC(id); break;
    case 'edit-s': openFormS(id); break;
    case 'edit-i': openFormI(id); break;
    case 'del-p': delP(id); break;
    case 'del-c': delC(id); break;
    case 'del-s': delS(id); break;
    case 'del-i': delI(id); break;
    case 'extend': openExtend(id); break;
    case 'finalize': openFinalize(id); break;
    case 'add-inc': openFormI(null, id); break;
    case 'cancel-s': simplePatch(id, { estado: 'cancelado' }, { title: '¿Cancelar este servicio?', body: 'Quedará como cancelado y el personal asignado volverá a aparecer libre en esas fechas. Puedes reactivarlo después.', ok: 'Cancelar servicio' }, 'Servicio cancelado'); break;
    case 'react-s': simplePatch(id, { estado: 'vigente' }, null, 'Servicio reactivado'); break;
    case 'reopen-s': simplePatch(id, { cierre: null }, { title: '¿Reabrir este servicio?', body: 'Se quitará el cierre y volverá a estar vigente. Los incidentes registrados se conservan.', ok: 'Reabrir', tone: 'pri' }, 'Servicio reabierto'); break;
    case 'clear-ex': clearExamples(); break;
    case 'reload': main.innerHTML = `${mtop()}<p class="muted"><span class="spin" aria-hidden="true"></span>Cargando datos del centro…</p>`; loadAll(); break;
    case 'logout': doLogout(); break;
    case 'forgot': gateForgot(($('#login-email') || {}).value || ''); break;
    case 'back-login': gateLogin('', ($('#forgot-email') || {}).value || ''); break;
    case 'close': closeModal(); break;
    case 'confirm-ok': if (m && m.resolve) { const r = m.resolve; m.resolve = null; closeModal(); r(true); } break;
    case 'save': if (m && m.onSave) m.onSave(m); break;
    case 'new-c-inline': if (m) {
      const sm = m;
      openFormC(null, nid => {
        if (!modals.includes(sm)) return;
        syncForm(sm); if (!sm.state.clienteIds.includes(nid)) sm.state.clienteIds.push(nid); sm.state._cq = '';
        const c = S.clientes.get(nid); if (c && !tidy(sm.state.direccion)) sm.state.direccion = [c.direccion, c.distrito].filter(Boolean).join(', ');
        paint(sm);
      });
    } break;
    case 'tag-add': case 'tag-sug': {
      syncForm(m); const v = a === 'tag-sug' ? el.dataset.v : tidy((m.sheet.querySelector('[data-tag-in]') || {}).value);
      if (v && !m.state.diagnosticos.some(d => norm(d) === norm(v))) m.state.diagnosticos.push(v);
      paint(m); const ti = m.sheet.querySelector('[data-tag-in]'); if (ti && a === 'tag-add') ti.focus(); break;
    }
    case 'tag-del': syncForm(m); m.state.diagnosticos.splice(+el.dataset.i, 1); paint(m); break;
    case 'exp-add': { syncForm(m); m.state.experiencia.push({ tipo: EXP_TIPOS[0] }); paint(m); const reps = m.sheet.querySelectorAll('.rep'); const last = reps[reps.length - 1]; if (last && last.scrollIntoView) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); break; }
    case 'exp-del': syncForm(m); m.state.experiencia.splice(+el.dataset.i, 1); paint(m); break;
    case 'file-del': {
      syncForm(m); const arr = getPath(m.state, el.dataset.p) || []; const [d] = arr.splice(+el.dataset.i, 1);
      if (d) { if (m.newAssets.includes(d.path)) { m.newAssets = m.newAssets.filter(x => x !== d.path); removeFiles([d.path]); } else m.delAssets.push(d.path); }
      paint(m); break;
    }
    case 'inc-add': { syncForm(m); const s = S.servicios.get(m.sid); m.state.incidentes.push(newInc(s, m.state.fecha)); paint(m); break; }
    case 'inc-del': {
      syncForm(m); const [inc] = m.state.incidentes.splice(+el.dataset.i, 1);
      for (const d of (inc && inc.evidencias) || []) if (m.newAssets.includes(d.path)) { m.newAssets = m.newAssets.filter(x => x !== d.path); removeFiles([d.path]); }
      if (!m.state.incidentes.length) m.state.hubo = 'no';
      paint(m); break;
    }
    case 'dias-q': syncForm(m); m.state.dias = el.dataset.v.split(','); paint(m); break;
    case 'ext-q': { syncForm(m); const s = S.servicios.get(m.sid); const base = s.fechaFin < today() ? today() : s.fechaFin; m.state.nuevaFin = addDays(base, +el.dataset.v); paint(m); break; }
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { const m = topModal(); if (m && (m.kind === 'view' || m.kind === 'confirm')) { e.preventDefault(); closeModal(); } return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-a],tr[data-a]')) { e.preventDefault(); e.target.click(); return; }
  if (e.key === 'Enter' && e.target.matches('[data-tag-in]')) { e.preventDefault(); const b = topModal() && topModal().sheet.querySelector('[data-a="tag-add"]'); if (b) b.click(); return; }
  if (e.key === 'Enter' && e.target.closest('#modal-root') && e.target.matches('form input:not([type=search])')) e.preventDefault();
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'login-form') doLogin();
  else if (f.id === 'forgot-form') doForgot();
  else if (f.id === 'recover-form') doRecover();
});
document.addEventListener('change', e => {
  const t = e.target, m = topModal();
  if (t.id === 'flt-turno') { S.f.turno = t.value; const r = $('#results'); if (r) { r.innerHTML = RESULTS.personal(); hydrateFiles(r); } return; }
  if (!m) return;
  if (t.matches('input[type=file][data-up]')) { const files = [...t.files]; t.value = ''; if (files.length) onUpload(m, t.dataset.up, files); return; }
  if (t.dataset.pick) {
    const key = t.dataset.pick === 'per' ? 'personalIds' : 'clienteIds'; const set = new Set(m.state[key]);
    if (t.checked) set.add(t.value); else set.delete(t.value); m.state[key] = [...set];
    if (key === 'clienteIds' && t.checked) { const dir = m.sheet.querySelector('[name="direccion"]'); const c = S.clientes.get(t.value); if (dir && c && !dir.value.trim()) { dir.value = [c.direccion, c.distrito].filter(Boolean).join(', '); m.state.direccion = dir.value; } }
    return;
  }
  if (m.onChange && t.closest('form')) m.onChange(t, m);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q-' + S.view) { S.q[S.view] = t.value; const r = $('#results'); if (r) { r.innerHTML = RESULTS[S.view](); hydrateFiles(r); } return; }
  const m = topModal(); if (!m) return;
  if (t.dataset.q === 'cli') { m.state._cq = t.value; const l = m.sheet.querySelector('[data-list="cli"]'); if (l) l.innerHTML = clientPickList(m.state); }
  if (t.dataset.q === 'per') { m.state._pq = t.value; const l = m.sheet.querySelector('[data-list="per"]'); if (l) l.innerHTML = staffPickList(m.state, m.id); }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !sb || S.loaded.size < 4) return;
  if (Date.now() - S.lastLoad > 60000) Promise.all(COLS.map(fetchAll)).then(() => { S.lastLoad = Date.now(); scheduleRender(); }).catch(() => { });
  else scheduleRender();
});

/* ===================== ingreso ===================== */
function showGate(html) {
  while (modals.length) closeModal();
  $('#app').hidden = true; $('#gate').hidden = false; $('#gate-body').innerHTML = html;
  const f = $('#gate-body input'); if (f) setTimeout(() => f.focus(), 30);
}
function gateErr(msg) { const p = $('#gate-err'); if (p) { p.textContent = msg; p.hidden = !msg; } }
function gateBusy(on, label) { const b = $('#gate-body button[type=submit]'); if (b) { b.disabled = on; if (label) b.textContent = label; } }
function gateLogin(note = '', email = '') {
  showGate(`<form class="gate-form" id="login-form" novalidate>
    <h1>Ingreso de administrador</h1>
    ${note ? `<p class="gate-note">${esc(note)}</p>` : ''}
    <label class="fld" for="login-email"><span>Correo</span><input class="inp" id="login-email" type="email" autocomplete="username" required value="${esc(email)}"></label>
    <label class="fld" for="login-pass"><span>Contraseña</span><input class="inp" id="login-pass" type="password" autocomplete="current-password" required></label>
    <p class="f-err" id="gate-err" hidden></p>
    <button type="submit" class="btn pri lg">Ingresar</button>
    <button type="button" class="linkish small" data-a="forgot">¿Olvidaste tu contraseña?</button>
  </form>`);
}
function gateForgot(email = '') {
  showGate(`<form class="gate-form" id="forgot-form" novalidate>
    <h1>Recuperar contraseña</h1>
    <p class="muted small">Te enviaremos un enlace a tu correo para crear una nueva contraseña.</p>
    <label class="fld" for="forgot-email"><span>Correo</span><input class="inp" id="forgot-email" type="email" autocomplete="username" required value="${esc(email)}"></label>
    <p class="f-err" id="gate-err" hidden></p>
    <button type="submit" class="btn pri lg">Enviar enlace</button>
    <button type="button" class="linkish small" data-a="back-login">Volver al ingreso</button>
  </form>`);
}
function gateRecover() {
  showGate(`<form class="gate-form" id="recover-form" novalidate>
    <h1>Nueva contraseña</h1>
    <p class="muted small">Escribe tu nueva contraseña. Debe tener al menos 8 caracteres.</p>
    <label class="fld" for="rec-pass"><span>Nueva contraseña</span><input class="inp" id="rec-pass" type="password" autocomplete="new-password" required></label>
    <label class="fld" for="rec-pass2"><span>Repite la contraseña</span><input class="inp" id="rec-pass2" type="password" autocomplete="new-password" required></label>
    <p class="f-err" id="gate-err" hidden></p>
    <button type="submit" class="btn pri lg">Guardar contraseña</button>
  </form>`);
}
function gateMessage(title, html, actions = '') {
  showGate(`<div class="gate-form"><h1>${title}</h1><div class="muted" style="display:grid;gap:10px">${html}</div>${actions}</div>`);
}
async function doLogin() {
  const email = tidy(($('#login-email') || {}).value), pass = ($('#login-pass') || {}).value || '';
  if (!email || !pass) { gateErr('Escribe tu correo y tu contraseña.'); return; }
  gateErr(''); gateBusy(true, 'Ingresando…');
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) {
      const m = error.message || '';
      gateErr(/invalid login|invalid credentials/i.test(m) ? 'Correo o contraseña incorrectos.' : /not confirmed/i.test(m) ? 'Tu correo aún no está confirmado. Revisa tu bandeja o pide que lo confirmen en Supabase.' : /fetch|network/i.test(m) ? 'Sin conexión con el servidor. Revisa tu internet.' : 'No se pudo ingresar: ' + m);
      gateBusy(false, 'Ingresar'); return;
    }
    await enterIfAdmin(data.session);
  } catch (e) { gateErr('No se pudo ingresar. Revisa tu conexión.'); gateBusy(false, 'Ingresar'); }
}
async function doForgot() {
  const email = tidy(($('#forgot-email') || {}).value);
  if (!email) { gateErr('Escribe tu correo.'); return; }
  gateErr(''); gateBusy(true, 'Enviando…');
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  if (error && !/rate|seconds/i.test(error.message || '')) { gateErr('No se pudo enviar el enlace: ' + error.message); gateBusy(false, 'Enviar enlace'); return; }
  gateLogin('Si el correo está registrado, te llegará un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.', email);
}
async function doRecover() {
  const p1 = ($('#rec-pass') || {}).value || '', p2 = ($('#rec-pass2') || {}).value || '';
  if (p1.length < 8) { gateErr('La contraseña debe tener al menos 8 caracteres.'); return; }
  if (p1 !== p2) { gateErr('Las contraseñas no coinciden.'); return; }
  gateErr(''); gateBusy(true, 'Guardando…');
  const { data, error } = await sb.auth.updateUser({ password: p1 });
  if (error) { gateErr('No se pudo guardar la contraseña: ' + error.message + '. Pide un enlace nuevo si este venció.'); gateBusy(false, 'Guardar contraseña'); return; }
  try { history.replaceState(null, '', location.pathname); } catch (e) { }
  S.recovering = false; toast('Contraseña actualizada');
  const { data: sess } = await sb.auth.getSession();
  await enterIfAdmin(sess.session || (data && data.session));
}
async function doLogout() {
  try { if (S.channel) sb.removeChannel(S.channel); } catch (e) { }
  S.channel = null;
  await sb.auth.signOut().catch(() => { });
  resetData(); gateLogin('Cerraste sesión.');
}
function resetData() {
  for (const c of COLS) S[c] = new Map();
  S.loaded = new Set(); S.session = null; S.email = ''; S.meName = ''; IDX = null; SIGNED.clear();
}
async function enterIfAdmin(session) {
  if (!session) { gateLogin(); return; }
  S.session = session; S.email = (session.user && session.user.email) || '';
  showGate('<p class="muted" style="text-align:center"><span class="spin" aria-hidden="true"></span>Verificando permisos…</p>');
  let ok = false;
  try { ok = !!(await run(() => sb.rpc('es_admin'))); }
  catch (e) { gateMessage('No se pudo verificar el acceso', `<p>${esc(dbMsg(e))}</p>`, `<button type="button" class="btn" data-a="logout">Cerrar sesión</button>`); return; }
  if (!ok) {
    gateMessage('Acceso no autorizado', `<p>La cuenta <b>${esc(S.email)}</b> no está registrada como administradora del sistema.</p><p class="small">Para autorizarla, agrega este correo a la tabla «administradores» con el archivo <span class="mono">supabase/02_administrador.sql</span>.</p>`, `<button type="button" class="btn" data-a="logout">${ic('logout', 16)} Cerrar sesión</button>`);
    return;
  }
  try {
    const { data } = await sb.from('administradores').select('nombre').ilike('email', S.email).maybeSingle();
    const n = tidy(data && data.nombre); S.meName = n && !/^(administrador|nombre de la persona)$/i.test(n) ? n : '';
  } catch (e) { }
  enterApp();
}
function enterApp() {
  $('#gate').hidden = true; $('#app').hidden = false;
  $('#admin-chip').innerHTML = `<div><small>Administrador</small><b>${esc(S.meName || S.email)}</b></div><button type="button" class="icon-btn" data-a="logout" aria-label="Cerrar sesión" title="Cerrar sesión">${ic('logout')}</button>`;
  S.loaded = new Set(); renderMain();
  loadAll().then(() => { if (S.loaded.size === 4) subscribeRealtime(); });
}

/* ===================== arranque ===================== */
(async function boot() {
  $('#dl-distritos').innerHTML = DISTRITOS.map(d => `<option value="${esc(d)}"></option>`).join('');
  if (!window.supabase) { gateMessage('No se pudo cargar el sistema', '<p>No se pudo descargar la librería de conexión. Revisa tu internet y recarga la página.</p>'); return; }
  if (!sb) { gateMessage('Falta configurar la conexión', '<p>Abre el archivo <span class="mono">js/config.js</span> y completa la dirección y la clave pública de tu proyecto de Supabase. Los pasos están en el archivo README.</p>'); return; }
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') { S.recovering = true; setTimeout(gateRecover, 0); }
    else if (event === 'SIGNED_OUT') { setTimeout(() => { if (!$('#app').hidden) { resetData(); gateLogin('Tu sesión terminó. Vuelve a ingresar.'); } }, 0); }
    else if (session) S.session = session;
  });
  const linkErr = new URLSearchParams(location.hash.replace(/^#/, '')).get('error_description');
  if (linkErr) { try { history.replaceState(null, '', location.pathname); } catch (e) { } gateLogin('El enlace ya no es válido o venció. Pide uno nuevo con «¿Olvidaste tu contraseña?».'); return; }
  if (RECOVERY_LINK) { S.recovering = true; gateRecover(); return; }
  const { data } = await sb.auth.getSession();
  if (S.recovering) return;
  if (data && data.session) enterIfAdmin(data.session); else gateLogin();
})();
