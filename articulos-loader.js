/**
 * LA FRACTURA - Cargador dinámico de artículos
 * Compatible con estructura _posts
 */

const CONFIG = {
  GITHUB_USER: 'lucagalli01',
  GITHUB_REPO: 'lafractura',
  GITHUB_BRANCH: 'main',
  ARTICULOS_PATH: '_posts', // Cambio de 'articulos' a '_posts'
  
  CATEGORIAS: {
    'TERRITORIO': { nombre: 'Territorio', color: '#1A4D2E' },
    'ENERGÍA': { nombre: 'Energía', color: '#C1292E' },
    'POLÍTICA': { nombre: 'Política', color: '#00A3DD' },
    'AMBIENTE': { nombre: 'Ambiente', color: '#1A4D2E' },
    'PUEBLOS ORIGINARIOS': { nombre: 'Pueblos Originarios', color: '#D4AF37' },
    'ECONOMÍA': { nombre: 'Economía', color: '#C1292E' },
    'CULTURA': { nombre: 'Cultura', color: '#00A3DD' }
  }
};

let articulosCache = null;

// Obtener lista de archivos desde GitHub API
async function obtenerListaArchivos() {
  try {
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.ARTICULOS_PATH}?ref=${CONFIG.GITHUB_BRANCH}`;
    console.log('Obteniendo archivos desde:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Error obteniendo lista:', response.status);
      return [];
    }
    
    const archivos = await response.json();
    console.log('Archivos encontrados:', archivos);
    
    return archivos
      .filter(file => file.name.endsWith('.md') && file.type === 'file')
      .map(file => file.name);
    
  } catch (error) {
    console.error('Error en obtenerListaArchivos:', error);
    return [];
  }
}

// Convertir Markdown a HTML
function markdownToHtml(markdown) {
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
    .split('\n\n')
    .map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h')) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
  
  return html;
}

// Parsear frontmatter YAML
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }
  
  const [, frontmatter, body] = match;
  const metadata = {};
  
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    
    // Remover comillas
    value = value.replace(/^["']|["']$/g, '');
    
    metadata[key] = value;
  });
  
  return { metadata, body: body.trim() };
}

// Cargar artículo desde GitHub
async function cargarArticuloDesdeGitHub(filename) {
  try {
    const url = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/${CONFIG.ARTICULOS_PATH}/${filename}`;
    console.log('Cargando artículo:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error cargando ${filename}:`, response.status);
      return null;
    }
    
    const content = await response.text();
    const { metadata, body } = parseFrontmatter(content);
    
    console.log('Artículo cargado:', metadata.title || filename);
    
    return {
      title: metadata.title,
      category: metadata.category,
      date: metadata.date,
      author: metadata.author,
      excerpt: metadata.excerpt,
      featured: metadata.featured,
      slug: filename.replace('.md', ''),
      contenido: markdownToHtml(body),
      contenidoRaw: body,
      filename: filename
    };
    
  } catch (error) {
    console.error(`Error cargando ${filename}:`, error);
    return null;
  }
}

// Cargar todos los artículos
async function cargarTodosLosArticulos() {
  if (articulosCache) {
    return articulosCache;
  }
  
  try {
    const archivos = await obtenerListaArchivos();
    
    if (archivos.length === 0) {
      console.log('No se encontraron artículos');
      return [];
    }
    
    console.log(`Cargando ${archivos.length} artículos...`);
    
    const promesas = archivos.map(filename => cargarArticuloDesdeGitHub(filename));
    const articulos = await Promise.all(promesas);
    
    const articulosValidos = articulos.filter(a => a !== null);
    
    console.log(`${articulosValidos.length} artículos cargados exitosamente`);
    
    articulosCache = articulosValidos;
    return articulosValidos;
    
  } catch (error) {
    console.error('Error en cargarTodosLosArticulos:', error);
    return [];
  }
}

// Renderizar tarjeta de artículo
function renderizarTarjeta(articulo) {
  const categoria = CONFIG.CATEGORIAS[articulo.category] || CONFIG.CATEGORIAS['TERRITORIO'];
  
  let fecha = 'Sin fecha';
  if (articulo.date) {
    try {
      fecha = new Date(articulo.date).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error parseando fecha:', articulo.date);
    }
  }
  
  return `
    <article class="articulo-card" onclick="irAArticulo('${articulo.slug}')">
      <div class="articulo-categoria" style="background-color: ${categoria.color}">
        ${categoria.nombre}
      </div>
      <div class="articulo-contenido">
        <h2 class="articulo-titulo">${articulo.title || 'Sin título'}</h2>
        <p class="articulo-extracto">${articulo.excerpt || ''}</p>
        <div class="articulo-meta">
          <span>${fecha}</span>
          <span>${articulo.author || 'Equipo La Fractura'}</span>
        </div>
      </div>
    </article>
  `;
}

// Navegar a artículo
function irAArticulo(slug) {
  window.location.href = `/articulo.html?slug=${slug}`;
}

// Mostrar artículos en homepage
async function mostrarArticulosHome(limite = 6) {
  const contenedor = document.getElementById('articulos-grid');
  if (!contenedor) return;
  
  try {
    console.log('Iniciando carga de artículos para homepage...');
    const articulos = await cargarTodosLosArticulos();
    
    if (articulos.length === 0) {
      contenedor.innerHTML = `
        <div class="sin-articulos">
          <p>Todavía no hay artículos publicados.</p>
          <p style="margin-top: 1rem;">
            <a href="/admin/">Crear el primer artículo →</a>
          </p>
        </div>
      `;
      return;
    }
    
    const articulosOrdenados = articulos
      .sort((a, b) => {
        const fechaA = a.date ? new Date(a.date) : new Date(0);
        const fechaB = b.date ? new Date(b.date) : new Date(0);
        return fechaB - fechaA;
      })
      .slice(0, limite);
    
    contenedor.innerHTML = articulosOrdenados
      .map(articulo => renderizarTarjeta(articulo))
      .join('');
    
    console.log(`Mostrando ${articulosOrdenados.length} artículos`);
      
  } catch (error) {
    console.error('Error mostrando artículos:', error);
    contenedor.innerHTML = `
      <div class="sin-articulos">
        <p>Error cargando artículos</p>
        <p style="margin-top: 0.5rem; font-size: 0.85rem; opacity: 0.7;">
          ${error.message}
        </p>
      </div>
    `;
  }
}

// Mostrar artículos en archivo
async function mostrarArticulosArchivo(filtroCategoria = null) {
  const contenedor = document.getElementById('archivo-articulos');
  if (!contenedor) return;
  
  try {
    let articulos = await cargarTodosLosArticulos();
    
    if (filtroCategoria) {
      articulos = articulos.filter(a => a.category === filtroCategoria);
    }
    
    if (articulos.length === 0) {
      contenedor.innerHTML = '<p class="sin-articulos">No hay artículos en esta categoría</p>';
      return;
    }
    
    articulos = articulos.sort((a, b) => {
      const fechaA = a.date ? new Date(a.date) : new Date(0);
      const fechaB = b.date ? new Date(b.date) : new Date(0);
      return fechaB - fechaA;
    });
    
    contenedor.innerHTML = articulos
      .map(articulo => renderizarTarjeta(articulo))
      .join('');
      
  } catch (error) {
    console.error('Error mostrando archivo:', error);
    contenedor.innerHTML = '<p class="sin-articulos">Error cargando artículos</p>';
  }
}

// Mostrar artículo completo
async function mostrarArticuloCompleto() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  
  if (!slug) {
    window.location.href = '/';
    return;
  }
  
  const contenedor = document.getElementById('articulo-contenido');
  if (!contenedor) return;
  
  try {
    contenedor.innerHTML = '<div class="loading">Cargando artículo...</div>';
    
    const articulo = await cargarArticuloDesdeGitHub(`${slug}.md`);
    
    if (!articulo) {
      contenedor.innerHTML = `
        <div class="sin-articulo">
          <h2>Artículo no encontrado</h2>
          <p style="margin-top: 1rem;">
            <a href="/">← Volver al inicio</a>
          </p>
        </div>
      `;
      return;
    }
    
    document.title = `${articulo.title} - La Fractura`;
    
    const categoria = CONFIG.CATEGORIAS[articulo.category] || CONFIG.CATEGORIAS['TERRITORIO'];
    
    let fecha = 'Sin fecha';
    if (articulo.date) {
      try {
        fecha = new Date(articulo.date).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      } catch (e) {
        console.error('Error parseando fecha');
      }
    }
    
    contenedor.innerHTML = `
      <article class="articulo-completo">
        <header class="articulo-header">
          <div class="articulo-categoria" style="background-color: ${categoria.color}">
            ${categoria.nombre}
          </div>
          <h1 class="articulo-titulo">${articulo.title}</h1>
          ${articulo.excerpt ? `<p class="articulo-bajada">${articulo.excerpt}</p>` : ''}
          <div class="articulo-meta">
            <span class="articulo-fecha">${fecha}</span>
            <span class="articulo-autor">Por ${articulo.author || 'Equipo La Fractura'}</span>
          </div>
        </header>
        <div class="articulo-cuerpo">
          ${articulo.contenido}
        </div>
      </article>
    `;
    
  } catch (error) {
    console.error('Error mostrando artículo:', error);
    contenedor.innerHTML = `
      <div class="sin-articulo">
        <h2>Error cargando artículo</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// Exportar funciones
window.LaFractura = {
  mostrarArticulosHome,
  mostrarArticulosArchivo,
  mostrarArticuloCompleto,
  irAArticulo,
  cargarTodosLosArticulos
};

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
  console.log('La Fractura - Sistema de artículos dinámicos iniciado');
  
  if (document.getElementById('articulos-grid')) {
    console.log('→ Cargando homepage');
    mostrarArticulosHome();
  }
  
  if (document.getElementById('archivo-articulos')) {
    console.log('→ Cargando archivo');
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    mostrarArticulosArchivo(categoria);
  }
  
  if (document.getElementById('articulo-contenido')) {
    console.log('→ Cargando artículo individual');
    mostrarArticuloCompleto();
  }
});
