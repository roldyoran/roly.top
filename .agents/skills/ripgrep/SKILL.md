---

name: ripgrep-search
description: Utiliza `ripgrep (rg)` como herramienta principal para buscar texto, símbolos, funciones, clases, configuraciones y patrones dentro de proyectos de software. Es significativamente más rápido que grep en repositorios grandes y respeta `.gitignore` automáticamente.
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Skill: Ripgrep (rg) - Búsqueda de Código de Alto Rendimiento

## Reglas

1. Siempre intenta encontrar información con `rg` antes de abrir archivos completos.
2. Prefiere salida JSON (`--json`) cuando la información será consumida por un agente de IA.
3. Limita la búsqueda por tipo de archivo cuando sea posible (`-t`).
4. Usa búsqueda literal (`-F`) cuando no necesites expresiones regulares.
5. Usa `-n` para obtener números de línea.
6. Usa `-C`, `-A` o `-B` para obtener contexto.
7. Si no encuentras resultados y sospechas exclusiones por `.gitignore`, utiliza `-uu`.
8. Nunca escanees todo el proyecto innecesariamente cuando conozcas el lenguaje o directorio objetivo.
9. Antes de abrir archivos completos, intenta obtener suficiente contexto mediante búsquedas estructuradas.

## Prioridad para Agentes de IA

Cuando sea posible utiliza:

rg --json "<pattern>"

La salida JSON contiene metadatos estructurados como:

* Ruta completa del archivo.
* Número de línea.
* Posición de la coincidencia.
* Texto coincidente.
* Eventos de inicio y fin de archivo.
* Estadísticas de búsqueda.

Esto permite a un agente:

* Identificar exactamente dónde buscar.
* Reducir lecturas innecesarias.
* Construir mapas de dependencias.
* Correlacionar múltiples resultados automáticamente.
* Tomar decisiones basadas en estructura y no en texto plano.

## Comandos Recomendados para IA

Buscar en JSON:
rg --json "pattern"

Buscar con contexto en JSON:
rg --json -C 3 "pattern"

Buscar por lenguaje:
rg --json -t go "CreateUser"

Buscar símbolos específicos:
rg --json -w "UserService"

Buscar texto literal:
rg --json -F "user.name"

Buscar varios patrones:
rg --json -e "TODO" -e "FIXME"

Buscar ignorando filtros:
rg --json -uu "pattern"

## Estrategia Recomendada

Para localizar implementación:

1. rg --json -t <lenguaje> "<nombre>"
2. Analizar archivos más relevantes.
3. Abrir únicamente los fragmentos necesarios.

Para entender arquitectura:

1. rg --json "<concepto>"
2. Agrupar resultados por archivo.
3. Identificar puntos de entrada.
4. Abrir únicamente archivos con mayor densidad de coincidencias.

## Objetivo

Minimizar lectura innecesaria de archivos y maximizar velocidad de descubrimiento de código. Utilizar `ripgrep` como mecanismo principal de exploración y preferir siempre salidas estructuradas cuando un agente automatizado sea el consumidor de los resultados.
