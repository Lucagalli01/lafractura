# LA FRACTURA - Sitio Web

Sitio web de periodismo independiente desde Neuquén, Argentina.

## 🚀 Despliegue en GitHub Pages

### Opción 1: Subir archivos directamente

1. **Crear repositorio en GitHub:**
   - Ve a github.com y logueate
   - Click en "New repository"
   - Nombre: `lafractura` (o el que prefieras)
   - Público ✓
   - Create repository

2. **Subir archivos:**
   - Click "Add file" → "Upload files"
   - Arrastra TODOS los archivos `.html` de esta carpeta
   - Click "Commit changes"

3. **Activar GitHub Pages:**
   - Ve a Settings → Pages (en el menú lateral)
   - Source: Deploy from a branch
   - Branch: `main` o `master`
   - Folder: `/ (root)`
   - Save

4. **¡Listo!**
   - Tu sitio estará disponible en: `https://tuusuario.github.io/lafractura`
   - Tarda 1-2 minutos en publicarse

### Opción 2: Usar Git (para usuarios avanzados)

```bash
# 1. Inicializar repositorio
git init
git add .
git commit -m "Initial commit"

# 2. Conectar con GitHub
git remote add origin https://github.com/TUUSUARIO/lafractura.git
git branch -M main
git push -u origin main

# 3. Activar Pages desde Settings como arriba
```

## 📁 Estructura de archivos

```
lafractura/
├── index.html              # Página principal
├── articulo-agua.html      # Artículo ejemplo
├── archivo.html            # Archivo de artículos
├── manifiesto.html         # Manifiesto editorial
└── README.md              # Este archivo
```

## 🎨 Colores del sitio

Basados en la bandera de Neuquén:
- Celeste: #00A3DD (cielo patagónico)
- Oro: #D4AF37 (estrellas)
- Verde: #1A4D2E (pehuén)
- Rojo: #C1292E (identidad)
- Blanco: #FFFFFF (contenido)

## 🔧 Dominio personalizado (opcional)

Si compraste `lafractura.com.ar`:

1. En tu proveedor de dominio, agregar DNS:
   ```
   Type: CNAME
   Name: www
   Value: tuusuario.github.io
   ```

2. En GitHub Pages settings:
   - Custom domain: `www.lafractura.com.ar`
   - Enforce HTTPS ✓

## 📝 Actualizar el sitio

Para hacer cambios:
1. Edita los archivos HTML en tu computadora
2. Ve a tu repositorio en GitHub
3. Click en el archivo que quieras actualizar
4. Click en el ícono del lápiz (Edit)
5. Pega el nuevo contenido
6. Commit changes
7. Los cambios se reflejan en 1-2 minutos

## 💡 Tips

- **Velocidad:** GitHub Pages es muy rápido, gratis e ilimitado
- **SSL:** HTTPS incluido automáticamente
- **CDN:** Tu sitio se sirve desde servidores rápidos globalmente
- **Backups:** GitHub guarda todo el historial de cambios

## 🆘 Soporte

- Documentación GitHub Pages: https://pages.github.com
- Problemas comunes: https://docs.github.com/en/pages

---

**Desarrollado con ❤️ desde Neuquén**
