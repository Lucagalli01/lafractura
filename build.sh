#!/bin/bash

# Script de build para La Fractura
# Genera automáticamente el índice de artículos

echo "🔨 Construyendo La Fractura..."

# Crear carpeta de artículos si no existe
mkdir -p articulos

# Generar index.json con la lista de todos los archivos .md
echo "📝 Generando índice de artículos..."

cd articulos
ls *.md 2>/dev/null | jq -R -s -c 'split("\n")[:-1]' > index.json

if [ -f index.json ]; then
  echo "✅ Índice generado: articulos/index.json"
  cat index.json
else
  echo "⚠️  No se encontraron artículos, creando índice vacío"
  echo '[]' > index.json
fi

cd ..

echo "✅ Build completado"
