/**
 * cargar-contenido.js — Revista La Fractura
 * 
 * Lee los archivos de contenido generados por el CMS (en _articulos/, _entrevistas/, etc.)
 * y los renderiza en las páginas del sitio.
 * 
 * Funciona usando la API de GitHub para leer los archivos .md
 * y parsear el front-matter YAML + Markdown a HTML.
 */

// ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
const CONFIG = {
  // Cambiá estos valores por los de tu repositorio
  GITHUB_USER: 'lucagalli01',
  GITHUB_REPO: 'ejemplo2',
  BRANCH: 'main',
  // URL base de tus imágenes (carpeta /imagenes en el repo)
  IMG_BASE: '/imagenes/',
};

const API = `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/contents`;

// ── UTILIDADES ────────────────────────────────────────────────────────────────

/** Parsea front-matter YAML simple (sin dependencias externas) */
function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  
  const meta = {};
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = val;
  });
  
  return { meta, body: match[2].trim() };
}

/** Markdown → HTML básico (suficiente para artículos de revista) */
function mdToHtml(md) {
  return md
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold e italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Imágenes
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;margin:1.5rem 0;">')
    // Párrafos
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.)/m, '<p>$1')
    .concat('</p>')
    // Limpiar p vacíos
    .replace(/<p><\/p>/g, '');
}

/** Descarga y parsea todos los archivos .md de una carpeta del repo */
async function fetchCollection(folder) {
  try {
    const res = await fetch(`${API}/${folder}?ref=${CONFIG.BRANCH}`);
    if (!res.ok) return [];
    const files = await res.json();
    
    const items = await Promise.all(
      files
        .filter(f => f.name.endsWith('.md'))
        .map(async f => {
          const r = await fetch(f.download_url);
          const text = await r.text();
          const { meta, body } = parseFrontMatter(text);
          return { ...meta, body, slug: f.name.replace('.md', '') };
        })
    );
    
    // Ordenar por fecha descendente
    return items.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  } catch (e) {
    console.warn(`No se pudo cargar ${folder}:`, e);
    return [];
  }
}

// ── COLORES POR CATEGORÍA ─────────────────────────────────────────────────────
const CATEGORIA_COLOR = {
  politica: 'verde',
  cultura: '',
  investigacion: 'rojo',
  sociedad: 'verde',
  arte: 'rojo',
  festival: 'oro',
  economia: 'celeste',
  ambiente: 'verde',
};

const CATEGORIA_LABEL = {
  politica: 'Política',
  cultura: 'Cultura',
  investigacion: 'Investigación',
  sociedad: 'Sociedad',
  arte: 'Arte Callejero',
  festival: 'Festival',
  economia: 'Economía',
  ambiente: 'Medio Ambiente',
};

function tagHtml(cat) {
  const color = CATEGORIA_COLOR[cat] || '';
  const label = CATEGORIA_LABEL[cat] || cat;
  return `<span class="tag ${color}">${label}</span>`;
}

function imgSrc(img) {
  if (!img) return 'https://i.imgur.com/BMboB8Z.png';
  if (img.startsWith('http')) return img;
  return CONFIG.IMG_BASE + img.replace(/^\/imagenes\//, '');
}

// ── RENDERIZADORES POR PÁGINA ─────────────────────────────────────────────────

/**
 * INDEX.HTML — reemplaza el artículo destacado y la lista de cards
 */
async function renderIndex() {
  const articulos = await fetchCollection('_articulos');
  if (!articulos.length) return;

  const destacado = articulos.find(a => a.destacado === 'true') || articulos[0];
  const resto = articulos.filter(a => a !== destacado).slice(0, 5);

  // Artículo destacado
  const featImg = document.querySelector('#featured-article .featured-img');
  const featInfo = document.querySelector('#featured-article .featured-info');
  if (featImg && featInfo) {
    featImg.href = `articulo.html?slug=${destacado.slug}&tipo=articulos`;
    featImg.querySelector('img').src = imgSrc(destacado.imagen);
    featImg.querySelector('img').alt = destacado.titulo;
    featInfo.innerHTML = `
      <div>
        ${tagHtml(destacado.categoria)}
        <h2 class="featured-title">
          <a href="articulo.html?slug=${destacado.slug}&tipo=articulos">${destacado.titulo}</a>
        </h2>
        <p class="article-excerpt">${destacado.bajada || ''}</p>
      </div>
      <div class="article-meta">
        <span><strong>Autor</strong>${destacado.autor || ''}</span>
        <span><strong>Fecha</strong>${destacado.fecha || ''}</span>
        <span><strong>Lectura</strong>${destacado.lectura || ''}</span>
      </div>`;
  }

  // Lista de cards
  const lista = document.querySelector('#articles-list');
  if (lista && resto.length) {
    lista.innerHTML = resto.map(a => `
      <li class="article-card">
        <a class="card-img" href="articulo.html?slug=${a.slug}&tipo=articulos">
          <img src="${imgSrc(a.imagen)}" alt="${a.titulo}">
        </a>
        <div class="card-info">
          ${tagHtml(a.categoria)}
          <h3 class="card-title">
            <a href="articulo.html?slug=${a.slug}&tipo=articulos">${a.titulo}</a>
          </h3>
          <p class="card-excerpt">${a.bajada || ''}</p>
          <div class="article-meta">
            <span><strong>${a.autor || ''}</strong></span>
            <span><strong>${a.fecha || ''}</strong></span>
            <span><strong>${a.lectura || ''}</strong></span>
          </div>
        </div>
      </li>`).join('');
  }

  // Sidebar - lo más leído (simplemente los primeros 3)
  const popularList = document.querySelector('#popular-list');
  if (popularList) {
    popularList.innerHTML = articulos.slice(0, 3).map((a, i) => `
      <li class="popular-item">
        <span class="popular-num">0${i + 1}</span>
        <div>
          <h4 class="popular-title">
            <a href="articulo.html?slug=${a.slug}&tipo=articulos">${a.titulo}</a>
          </h4>
          <p class="popular-author">${a.autor || ''}</p>
        </div>
      </li>`).join('');
  }
}

/**
 * ARTICULOS.HTML — lista todos los artículos
 */
async function renderArticulos() {
  const articulos = await fetchCollection('_articulos');
  if (!articulos.length) return;

  const destacado = articulos.find(a => a.destacado === 'true') || articulos[0];
  const resto = articulos.filter(a => a !== destacado);

  // Featured
  const featEl = document.querySelector('#art-featured');
  if (featEl) {
    const imgLink = featEl.querySelector('.art-featured-img');
    const info = featEl.querySelector('.art-featured-info');
    if (imgLink) { imgLink.href = `articulo.html?slug=${destacado.slug}&tipo=articulos`; imgLink.querySelector('img').src = imgSrc(destacado.imagen); }
    if (info) info.innerHTML = `
      <div>
        ${tagHtml(destacado.categoria)}
        <h2 class="art-title-lg"><a href="articulo.html?slug=${destacado.slug}&tipo=articulos">${destacado.titulo}</a></h2>
        <p class="art-excerpt">${destacado.bajada || ''}</p>
      </div>
      <div class="art-meta">
        <span><strong>${destacado.autor || ''}</strong></span>
        <span><strong>${destacado.fecha || ''}</strong></span>
        <span><strong>${destacado.lectura || ''}</strong></span>
      </div>`;
  }

  // List
  const lista = document.querySelector('#art-list');
  if (lista) {
    lista.innerHTML = resto.map(a => `
      <li class="art-row">
        <a class="art-row-img" href="articulo.html?slug=${a.slug}&tipo=articulos"><img src="${imgSrc(a.imagen)}" alt="${a.titulo}"></a>
        <div class="art-row-info">
          <div>${tagHtml(a.categoria)}<h3 class="art-title-sm"><a href="articulo.html?slug=${a.slug}&tipo=articulos">${a.titulo}</a></h3><p class="art-excerpt-sm">${a.bajada || ''}</p></div>
          <div class="art-meta"><span><strong>${a.autor || ''}</strong></span><span><strong>${a.fecha || ''}</strong></span><span><strong>${a.lectura || ''}</strong></span></div>
        </div>
      </li>`).join('');
  }

  // Sidebar más leído
  const popList = document.querySelector('#pop-list');
  if (popList) {
    popList.innerHTML = articulos.slice(0, 4).map((a, i) => `
      <li class="pop-item">
        <span class="pop-num">0${i + 1}</span>
        <div><p class="pop-title"><a href="articulo.html?slug=${a.slug}&tipo=articulos">${a.titulo}</a></p><p class="pop-author">${a.autor || ''}</p></div>
      </li>`).join('');
  }
}

/**
 * ENTREVISTAS.HTML
 */
async function renderEntrevistas() {
  const items = await fetchCollection('_entrevistas');
  const container = document.querySelector('#ep-grid');
  if (!container || !items.length) return;

  container.innerHTML = items.map(a => `
    <article class="ep-card">
      <div class="ep-card-img">
        <img src="${imgSrc(a.imagen)}" alt="${a.titulo}">
        <div class="ep-card-overlay"><div class="play-sm">▶</div></div>
      </div>
      <div class="ep-card-info">
        <p class="ep-card-num">Entrevista — ${a.fecha || ''}</p>
        <h3 class="ep-card-title"><a href="articulo.html?slug=${a.slug}&tipo=entrevistas">${a.titulo}</a></h3>
        <div class="ep-card-meta"><span>${a.lectura || ''}</span><span>${a.entrevistado || ''}</span></div>
      </div>
    </article>`).join('');
}

/**
 * COLUMNISTAS.HTML
 */
async function renderColumnistas() {
  const perfiles = await fetchCollection('_columnistas');
  const container = document.querySelector('#authors-grid');
  if (!container || !perfiles.length) return;

  const COLORES = { 'Política': 'verde', 'Economía': '', 'Cultura': 'oro', 'Medio Ambiente': 'verde', 'Derechos Humanos': 'rojo', 'Género': 'rojo', 'Internacional': 'celeste' };

  container.innerHTML = perfiles.map(c => `
    <div class="author-card">
      <div class="ac-portrait"><img src="${imgSrc(c.foto)}" alt="${c.nombre}"></div>
      <div class="ac-info">
        <div>
          <h3 class="ac-name"><a href="#">${c.nombre}</a></h3>
          <p class="ac-role">${c.especialidad || ''}</p>
          <span class="ac-tag ${COLORES[c.especialidad] || ''}">${c.especialidad || ''}</span>
        </div>
        <p style="font-size:0.8rem;color:#666;line-height:1.5;margin-top:8px;">${c.bio ? c.bio.substring(0, 90) + '…' : ''}</p>
      </div>
    </div>`).join('');
}

// ── PÁGINA DE ARTÍCULO INDIVIDUAL ─────────────────────────────────────────────

/**
 * articulo.html?slug=xxx&tipo=articulos
 * Lee el archivo correspondiente y renderiza el artículo completo
 */
async function renderArticuloSingle() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const tipo = params.get('tipo') || 'articulos';
  if (!slug) return;

  const container = document.querySelector('#articulo-contenido');
  if (!container) return;

  container.innerHTML = `<p style="padding:40px;font-family:'Space Mono',monospace;font-size:0.8rem;">Cargando...</p>`;

  try {
    const res = await fetch(`${API}/${`_${tipo}`}/${slug}.md?ref=${CONFIG.BRANCH}`);
    if (!res.ok) throw new Error('No encontrado');
    const file = await res.json();
    const text = atob(file.content.replace(/\n/g, ''));
    const { meta, body } = parseFrontMatter(text);

    document.title = `${meta.titulo} — Revista La Fractura`;

    container.innerHTML = `
      <article style="max-width:720px;margin:0 auto;padding:48px 24px;">
        <div style="margin-bottom:24px;">
          ${tagHtml(meta.categoria || tipo.replace('_',''))}
        </div>
        <h1 style="font-family:'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;line-height:1.15;letter-spacing:-0.02em;margin-bottom:16px;">${meta.titulo || ''}</h1>
        <p style="font-size:1.05rem;color:#555;line-height:1.6;margin-bottom:24px;font-style:italic;">${meta.bajada || ''}</p>
        <div style="display:flex;gap:24px;font-family:'Space Mono',monospace;font-size:0.65rem;letter-spacing:0.08em;text-transform:uppercase;color:#888;border-top:2px solid var(--negro);border-bottom:1px solid #ddd;padding:14px 0;margin-bottom:32px;">
          <span><strong style="color:var(--negro);">Por</strong> ${meta.autor || meta.entrevistado || ''}</span>
          <span>${meta.fecha || ''}</span>
          <span>${meta.lectura || ''}</span>
        </div>
        ${meta.imagen ? `<img src="${imgSrc(meta.imagen)}" alt="${meta.titulo}" style="width:100%;max-height:480px;object-fit:cover;margin-bottom:40px;border:2px solid var(--negro);">` : ''}
        <div style="font-size:1.02rem;line-height:1.85;color:#222;" class="articulo-body">
          ${mdToHtml(body)}
        </div>
        <div style="margin-top:48px;padding-top:24px;border-top:2px solid var(--negro);">
          <a href="javascript:history.back()" style="font-family:'Space Mono',monospace;font-size:0.65rem;letter-spacing:0.1em;text-transform:uppercase;border:2px solid var(--negro);padding:10px 20px;display:inline-block;transition:all 0.2s;" onmouseover="this.style.background='var(--negro)';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='inherit'">← Volver</a>
        </div>
      </article>`;
  } catch (e) {
    container.innerHTML = `<p style="padding:40px;color:var(--rojo);">No se pudo cargar el artículo.</p>`;
  }
}

// ── DETECCIÓN DE PÁGINA Y EJECUCIÓN ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '') renderIndex();
  else if (page === 'articulos.html') renderArticulos();
  else if (page === 'entrevistas.html') renderEntrevistas();
  else if (page === 'columnistas.html') renderColumnistas();
  else if (page === 'articulo.html') renderArticuloSingle();
});
