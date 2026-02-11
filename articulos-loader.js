/**
 * LA FRACTURA - Cargador dinámico de artículos
 * Este script lee los archivos .md creados por Netlify CMS
 * y los muestra automáticamente en el sitio
 */

// Configuración
const ARTICULOS_PATH = '/articulos/'; // Carpeta donde Netlify CMS guarda los artículos
const CATEGORIAS = {
  territorio: { nombre: 'Territorio', color: '#1A4D2E' },
  energia: { nombre: 'Energía', color: '#C1292E' },
  politica: { nombre: 'Política', color: '#00A3DD' },
  ambiente: { nombre: 'Ambiente', color: '#1A4D2E' },
  pueblos_originarios: { nombre: 'Pueblos Originarios', color: '#D4AF37' }
};

// Función para convertir Markdown a HTML (versión simple)
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
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
    // Párrafos
    .split('\n\n')
    .map(p => p.trim() ? `<p>${p}</p>` : '')
    .join('\n');
  
  return html;
}

// Función para parsear el frontmatter YAML
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }
  
  const [, frontmatter, body] = match;
  const metadata = {};
  
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      let value = valueParts.join(':').trim();
      // Remover comillas
      value = value.replace(/^["']|["']$/g, '');
      metadata[key.trim()] = value;
    }
  });
  
  return { metadata, body: body.trim() };
}

// Función para cargar un artículo desde GitHub
async function cargarArticulo(filename) {
  try {
    const response = await fetch(`${ARTICULOS_PATH}${filename}`);
    if (!response.ok) return null;
    
    const content = await response.text();
    const { metadata, body } = parseFrontmatter(content);
    
    return {
      ...metadata,
      slug: filename.replace('.md', ''),
      contenido: markdownToHtml(body),
      contenidoRaw: body
    };
  } catch (error) {
    console.error(`Error cargando ${filename}:`, error);
    return null;
  }
}

// Función para cargar todos los artículos
async function cargarTodosLosArticulos() {
  try {
    // Primero intentamos obtener la lista de archivos del repositorio
    // Nota: Esto requiere que los archivos estén listados o uses la API de GitHub
    const response = await fetch('/articulos/index.json');
    
    if (response.ok) {
      const archivos = await response.json();
      const articulos = await Promise.all(
        archivos.map(filename => cargarArticulo(filename))
      );
      return articulos.filter(a => a !== null);
    }
  } catch (error) {
    console.error('Error cargando artículos:', error);
  }
  
  return [];
}

// Función para renderizar una tarjeta de artículo
function renderizarTarjeta(articulo) {
  const categoria = CATEGORIAS[articulo.categoria] || CATEGORIAS.territorio;
  const fecha = new Date(articulo.fecha).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  return `
    <article class="tarjeta-articulo" onclick="irAArticulo('${articulo.slug}')">
      <div class="tarjeta-categoria" style="background-color: ${categoria.color}">
        ${categoria.nombre}
      </div>
      ${articulo.imagen ? `<img src="${articulo.imagen}" alt="${articulo.titulo}" class="tarjeta-imagen">` : ''}
      <div class="tarjeta-contenido">
        <h2 class="tarjeta-titulo">${articulo.titulo}</h2>
        <p class="tarjeta-bajada">${articulo.bajada || ''}</p>
        <div class="tarjeta-meta">
          <span class="tarjeta-fecha">${fecha}</span>
          ${articulo.autor ? `<span class="tarjeta-autor">Por ${articulo.autor}</span>` : ''}
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
async function mostrarArticulosHome(limite = 3) {
  const contenedor = document.getElementById('articulos-recientes');
  if (!contenedor) return;
  
  const articulos = await cargarTodosLosArticulos();
  const articulosOrdenados = articulos
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, limite);
  
  contenedor.innerHTML = articulosOrdenados
    .map(articulo => renderizarTarjeta(articulo))
    .join('');
}

// Función para mostrar artículos en el archivo
async function mostrarArticulosArchivo(filtroCategoria = null) {
  const contenedor = document.getElementById('archivo-articulos');
  if (!contenedor) return;
  
  let articulos = await cargarTodosLosArticulos();
  
  if (filtroCategoria) {
    articulos = articulos.filter(a => a.categoria === filtroCategoria);
  }
  
  articulos = articulos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  if (articulos.length === 0) {
    contenedor.innerHTML = '<p class="sin-articulos">No hay artículos en esta categoría</p>';
    return;
  }
  
  contenedor.innerHTML = articulos
    .map(articulo => renderizarTarjeta(articulo))
    .join('');
}

// Función para cargar y mostrar un artículo individual
async function mostrarArticuloCompleto() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  
  if (!slug) {
    window.location.href = '/';
    return;
  }
  
  const articulo = await cargarArticulo(`${slug}.md`);
  
  if (!articulo) {
    document.body.innerHTML = '<p>Artículo no encontrado</p>';
    return;
  }
  
  // Actualizar el título de la página
  document.title = `${articulo.titulo} - La Fractura`;
  
  // Renderizar el artículo
  const contenedor = document.getElementById('articulo-contenido');
  if (!contenedor) return;
  
  const categoria = CATEGORIAS[articulo.categoria] || CATEGORIAS.territorio;
  const fecha = new Date(articulo.fecha).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
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
      ${articulo.imagen ? `<img src="${articulo.imagen}" alt="${articulo.titulo}" class="articulo-imagen-principal">` : ''}
      <div class="articulo-cuerpo">
        ${articulo.contenido}
      </div>
    </article>
  `;
}

// Exportar funciones para uso global
window.LaFractura = {
  mostrarArticulosHome,
  mostrarArticulosArchivo,
  mostrarArticuloCompleto,
  irAArticulo
};

// Auto-inicializar según la página
document.addEventListener('DOMContentLoaded', () => {
  // Homepage
  if (document.getElementById('articulos-recientes')) {
    mostrarArticulosHome();
  }
  
  // Archivo
  if (document.getElementById('archivo-articulos')) {
    // Detectar filtro de categoría desde URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    mostrarArticulosArchivo(categoria);
  }
  
  // Artículo individual
  if (document.getElementById('articulo-contenido')) {
    mostrarArticuloCompleto();
  }
});
