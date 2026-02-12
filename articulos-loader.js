/**
 * LA FRACTURA - Cargador dinámico de artículos (versión simplificada)
 * Lee artículos directamente desde GitHub sin necesidad de index.json
 */

const CONFIG = {
  // Configuración de GitHub
  GITHUB_USER: 'lucagalli01',
  GITHUB_REPO: 'lafractura',
  GITHUB_BRANCH: 'main',
  ARTICULOS_PATH: 'articulos',
  
  // Categorías
  CATEGORIAS: {
    territorio: { nombre: 'Territorio', color: '#1A4D2E' },
    energia: { nombre: 'Energía', color: '#C1292E' },
    politica: { nombre: 'Política', color: '#00A3DD' },
    ambiente: { nombre: 'Ambiente', color: '#1A4D2E' },
    pueblos_originarios: { nombre: 'Pueblos Originarios', color: '#D4AF37' }
  }
};

// Cache para artículos
let articulosCache = null;

// Función para obtener lista de archivos de GitHub
async function obtenerListaArchivos() {
  try {
    const url = `https://api.github.com/repos/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.ARTICULOS_PATH}?ref=${CONFIG.GITHUB_BRANCH}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Error obteniendo lista de archivos:', response.status);
      return [];
    }
    
    const archivos = await response.json();
    
    // Filtrar solo archivos .md
    return archivos
      .filter(file => file.name.endsWith('.md') && file.type === 'file')
      .map(file => file.name);
    
  } catch (error) {
    console.error('Error en obtenerListaArchivos:', error);
    return [];
  }
}

// Función para convertir Markdown a HTML
function markdownToHtml(markdown) {
  let html = markdown
    // Títulos
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Negritas
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Itálicas
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
    // Párrafos
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

// Función para parsear frontmatter YAML
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

// Función para cargar un artículo desde GitHub
async function cargarArticuloDesdeGitHub(filename) {
  try {
    const url = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}/${CONFIG.ARTICULOS_PATH}/${filename}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error cargando ${filename}:`, response.status);
      return null;
    }
    
    const content = await response.text();
    const { metadata, body } = parseFrontmatter(content);
    
    return {
      ...metadata,
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

// Función para cargar todos los artículos
async function cargarTodosLosArticulos() {
  // Usar cache si está disponible
  if (articulosCache) {
    return articulosCache;
  }
  
  try {
    // Obtener lista de archivos
    const archivos = await obtenerListaArchivos();
    
    if (archivos.length === 0) {
      console.log('No se encontraron artículos');
      return [];
    }
    
    console.log(`Encontrados ${archivos.length} artículos:`, archivos);
    
    // Cargar todos los artículos en paralelo
    const promesas = archivos.map(filename => cargarArticuloDesdeGitHub(filename));
    const articulos = await Promise.all(promesas);
    
    // Filtrar artículos que no se pudieron cargar
    const articulosValidos = articulos.filter(a => a !== null);
    
    // Guardar en cache
    articulosCache = articulosValidos;
    
    return articulosValidos;
    
  } catch (error) {
    console.error('Error en cargarTodosLosArticulos:', error);
    return [];
  }
}

// Función para renderizar una tarjeta de artículo
function renderizarTarjeta(articulo) {
  const categoria = CONFIG.CATEGORIAS[articulo.categoria] || CONFIG.CATEGORIAS.territorio;
  
  let fecha = 'Sin fecha';
  if (articulo.fecha) {
    try {
      fecha = new Date(articulo.fecha).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error parseando fecha:', articulo.fecha);
    }
  }
  
  const imagenHtml = articulo.imagen 
    ? `<img src="${articulo.imagen}" alt="${articulo.titulo}" class="tarjeta-imagen">`
    : '';
  
  return `
    <article class="tarjeta-articulo" onclick="irAArticulo('${articulo.slug}')">
      <div class="tarjeta-categoria" style="background-color: ${categoria.color}">
        ${categoria.nombre}
      </div>
      ${imagenHtml}
      <div class="tarjeta-contenido">
        <h2 class="tarjeta-titulo">${articulo.titulo || 'Sin título'}</h2>
        <p class="tarjeta-bajada">${articulo.bajada || ''}</p>
        <div class="tarjeta-meta">
          <span class="tarjeta-fecha">${fecha}</span>
          ${articulo.autor ? `<span class="tarjeta-autor">Por ${articulo.autor}</span>` : ''}
          ${articulo.tiempoLectura ? `<span>${articulo.tiempoLectura} min lectura</span>` : ''}
        </div>
      </div>
    </article>
  `;
}

// Función para navegar a un artículo
function irAArticulo(slug) {
  window.location.href = `/articulo.html?slug=${slug}`;
}

// Función para mostrar artículos en el homepage
async function mostrarArticulosHome(limite = 6) {
  const contenedor = document.getElementById('articulos-recientes');
  if (!contenedor) return;
  
  try {
    const articulos = await cargarTodosLosArticulos();
    
    if (articulos.length === 0) {
      contenedor.innerHTML = `
        <div class="sin-articulos">
          <p>Todavía no hay artículos publicados.</p>
          <p style="margin-top: 1rem; font-size: 0.9rem;">
            <a href="/admin/" style="color: #00A3DD;">Crear el primer artículo →</a>
          </p>
        </div>
      `;
      return;
    }
    
    const articulosOrdenados = articulos
      .sort((a, b) => {
        const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
        const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
        return fechaB - fechaA;
      })
      .slice(0, limite);
    
    contenedor.innerHTML = articulosOrdenados
      .map(articulo => renderizarTarjeta(articulo))
      .join('');
      
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

// Función para mostrar artículos en el archivo
async function mostrarArticulosArchivo(filtroCategoria = null) {
  const contenedor = document.getElementById('archivo-articulos');
  if (!contenedor) return;
  
  try {
    let articulos = await cargarTodosLosArticulos();
    
    if (filtroCategoria) {
      articulos = articulos.filter(a => a.categoria === filtroCategoria);
    }
    
    if (articulos.length === 0) {
      contenedor.innerHTML = '<p class="sin-articulos">No hay artículos en esta categoría</p>';
      return;
    }
    
    articulos = articulos.sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
      const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
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

// Función para mostrar un artículo completo
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
    
    document.title = `${articulo.titulo} - La Fractura`;
    
    const categoria = CONFIG.CATEGORIAS[articulo.categoria] || CONFIG.CATEGORIAS.territorio;
    
    let fecha = 'Sin fecha';
    if (articulo.fecha) {
      try {
        fecha = new Date(articulo.fecha).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      } catch (e) {
        console.error('Error parseando fecha');
      }
    }
    
    const imagenHtml = articulo.imagen 
      ? `<img src="${articulo.imagen}" alt="${articulo.titulo}" class="articulo-imagen-principal">`
      : '';
    
    contenedor.innerHTML = `
      <article class="articulo-completo">
        <header class="articulo-header">
          <div class="articulo-categoria" style="background-color: ${categoria.color}">
            ${categoria.nombre}
          </div>
          <h1 class="articulo-titulo">${articulo.titulo}</h1>
          ${articulo.bajada ? `<p class="articulo-bajada">${articulo.bajada}</p>` : ''}
          <div class="articulo-meta">
            <span class="articulo-fecha">${fecha}</span>
            ${articulo.autor ? `<span class="articulo-autor">Por ${articulo.autor}</span>` : ''}
            ${articulo.tiempoLectura ? `<span class="articulo-lectura">${articulo.tiempoLectura} min lectura</span>` : ''}
          </div>
        </header>
        ${imagenHtml}
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
  console.log('La Fractura - Inicializando...');
  
  if (document.getElementById('articulos-recientes')) {
    console.log('Cargando homepage...');
    mostrarArticulosHome();
  }
  
  if (document.getElementById('archivo-articulos')) {
    console.log('Cargando archivo...');
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    mostrarArticulosArchivo(categoria);
  }
  
  if (document.getElementById('articulo-contenido')) {
    console.log('Cargando artículo individual...');
    mostrarArticuloCompleto();
  }
});
