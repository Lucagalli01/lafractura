# 🔧 INSTRUCCIONES DE IMPLEMENTACIÓN - LA FRACTURA

## 🎯 ¿Qué resuelve esto?

**PROBLEMA:** Los artículos que creabas en Netlify CMS no se mostraban en el sitio.

**SOLUCIÓN:** Sistema híbrido que:
- ✅ Mantiene todos tus HTMLs actuales
- ✅ Lee automáticamente los artículos en formato Markdown
- ✅ Los muestra dinámicamente en el sitio
- ✅ Funciona con Netlify CMS sin cambiar nada

---

## 📦 ARCHIVOS A SUBIR A TU REPOSITORIO

Sube estos archivos a tu repositorio GitHub `lafractura`:

```
lafractura/
├── index.html (reemplazar)
├── articulo.html (nuevo)
├── archivo.html (reemplazar)
├── articulos-loader.js (nuevo)
├── build.sh (nuevo)
├── netlify.toml (nuevo)
├── admin/
│   └── config.yml (reemplazar)
└── articulos/ (carpeta nueva, vacía por ahora)
```

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### PASO 1: Subir archivos a GitHub

1. Ve a tu repositorio: https://github.com/lucagalli01/lafractura
2. Sube los archivos uno por uno usando el botón "Add file" → "Upload files"
3. O clona el repo y súbelos por Git:

```bash
git clone https://github.com/lucagalli01/lafractura.git
cd lafractura

# Copia los archivos que te envié aquí
# Luego:

git add .
git commit -m "Implementar sistema de artículos dinámicos"
git push origin main
```

### PASO 2: Crear carpeta de artículos

1. En tu repositorio, crea una carpeta llamada `articulos/`
2. Dentro de ella, crea un archivo vacío llamado `.gitkeep` para que Git la reconozca

### PASO 3: Configurar Netlify

1. Ve a tu dashboard de Netlify: https://app.netlify.com
2. Selecciona tu sitio `lafractura`
3. Ve a **Site settings** → **Build & deploy** → **Build settings**
4. Configura:
   - **Build command:** `chmod +x build.sh && ./build.sh`
   - **Publish directory:** `.` (punto)
5. Guarda los cambios

### PASO 4: Verificar Git Gateway

1. En Netlify, ve a **Site settings** → **Identity**
2. Asegúrate que **Git Gateway** esté habilitado
3. Ve a **Services** → **Git Gateway** y verifica que esté conectado

### PASO 5: Redesplegar el sitio

1. En tu dashboard de Netlify, ve a **Deploys**
2. Haz clic en **Trigger deploy** → **Deploy site**
3. Espera a que termine (verás un ✅ verde)

---

## ✅ VERIFICAR QUE FUNCIONA

### Test 1: Crear un artículo de prueba

1. Ve a `https://lafractura.com.ar/admin`
2. Inicia sesión con tu cuenta
3. Haz clic en **New Artículos**
4. Completa los campos:
   - **Título:** "Artículo de prueba"
   - **Fecha:** Hoy
   - **Categoría:** Territorio
   - **Bajada:** "Este es un artículo de prueba"
   - **Contenido:** Escribe algo
5. Haz clic en **Publish** → **Publish now**

### Test 2: Verificar que aparece en el sitio

1. Espera 1-2 minutos (Netlify necesita redesplegar)
2. Ve a `https://lafractura.com.ar`
3. **¡Deberías ver tu artículo nuevo en la homepage!**
4. Haz clic en él para ver el artículo completo
5. Ve a `/archivo.html` para verlo en el listado

---

## 🔍 CÓMO FUNCIONA

```
1. Creas artículo en /admin
        ↓
2. Netlify CMS guarda archivo .md en /articulos/
        ↓
3. Netlify detecta cambio y corre build.sh
        ↓
4. build.sh genera /articulos/index.json (lista de archivos)
        ↓
5. articulos-loader.js lee index.json
        ↓
6. JavaScript carga y muestra artículos en el sitio
        ↓
7. ¡Los usuarios ven tus artículos! 🎉
```

---

## 📝 ESTRUCTURA DE UN ARTÍCULO

Los artículos se guardan en `/articulos/` con este formato:

```markdown
---
titulo: "La lucha por el territorio mapuche"
fecha: "2026-02-11"
autor: "Redacción La Fractura"
categoria: "territorio"
bajada: "Neuquén es tierra de encuentro..."
imagen: "/imagenes/uploads/foto.jpg"
tiempoLectura: 18
---

Aquí va el contenido del artículo en Markdown.

## Subtítulo

Más contenido...
```

---

## 🎨 PERSONALIZACIÓN

### Cambiar colores de categorías

Edita `articulos-loader.js`, líneas 8-14:

```javascript
const CATEGORIAS = {
  territorio: { nombre: 'Territorio', color: '#1A4D2E' },
  energia: { nombre: 'Energía', color: '#C1292E' },
  // ... etc
};
```

### Cambiar número de artículos en homepage

Edita `articulos-loader.js`, línea 155:

```javascript
async function mostrarArticulosHome(limite = 3) {
  // Cambia el 3 por el número que quieras
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ "No se ven los artículos"

**Causa:** El build no se ejecutó correctamente

**Solución:**
1. Ve a Netlify → **Deploys**
2. Haz clic en el último deploy
3. Revisa los **logs** para ver errores
4. Si dice "command not found: jq", instala jq:
   - En `netlify.toml`, cambia el comando de build por:
   ```toml
   command = "mkdir -p articulos && ls articulos/*.md 2>/dev/null | sed 's|^|articulos/|' | jq -R -s -c 'split(\"\n\")[:-1]' > articulos/index.json || echo '[]' > articulos/index.json"
   ```

### ❌ "Error en Netlify CMS al publicar"

**Causa:** Git Gateway no está configurado correctamente

**Solución:**
1. Ve a Netlify → **Site settings** → **Identity**
2. Habilita **Git Gateway**
3. Ve a **Identity** → **Services** → **Git Gateway**
4. Haz clic en **Enable Git Gateway**

### ❌ "Los artículos aparecen vacíos"

**Causa:** El formato Markdown no se está convirtiendo

**Solución:**
1. Abre `articulos-loader.js`
2. Verifica que la función `markdownToHtml()` esté completa
3. Redesploya el sitio

---

## 📞 SOPORTE

Si algo no funciona:

1. Revisa los logs de Netlify en **Deploys** → Último deploy → **Deploy log**
2. Abre la consola del navegador (F12) y busca errores en JavaScript
3. Verifica que `/articulos/index.json` existe visitando: `https://lafractura.com.ar/articulos/index.json`

---

## 🎉 ¡LISTO!

Una vez implementado, podrás:
- ✅ Crear artículos desde `/admin`
- ✅ Verlos automáticamente en el sitio
- ✅ Filtrarlos por categoría
- ✅ Compartir URLs únicas para cada artículo

**¡Tu sitio está listo para publicar contenido!** 🚀
