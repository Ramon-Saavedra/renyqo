@AGENTS.md
@AGENTS.md
# Propósito de la fase

Definir un pipeline profesional de CI CD para el frontend antes de empezar a construir funcionalidad real.

Esta fase fija cómo se valida, protege, empaqueta y despliega el frontend de forma seria. En un proyecto que quiere llegar a producción sobre AWS y crecer con miles o millones de usuarios, el pipeline no puede ser un script básico de build. Debe funcionar como una barrera de calidad, seguridad y disciplina de entrega.

# Por qué esta fase es crítica

Sin pipeline fuerte, pasan tres cosas rápido:

- entra código roto o inconsistente en `main`
- se despliega sin controles suficientes
- se normaliza una cultura de "ya luego lo arreglamos"

El pipeline debe impedir eso desde el inicio.

# Resultado esperado

Un pipeline CI CD profesional para el frontend que cubra:

- validación de código
- tipado
- tests
- build
- seguridad básica
- empaquetado Docker
- control de despliegues
- protección de entornos
- capacidad de rollback y gobernanza

# Principio rector

Primero verificar, luego empaquetar, luego aprobar, luego desplegar.

GitHub documenta que Actions permite controlar despliegues con environments, concurrency y protection rules. citeturn837561search1turn837561search2turn837561search7

# 1. Contexto técnico del pipeline

## 1.1 Frontend

- Next.js
- TypeScript estricto
- Tailwind

## 1.2 Backend relacionado

El frontend debe asumir que consumirá un backend en NestJS. NestJS documenta como buena práctica validar la entrada con `ValidationPipe` y DTOs con clases concretas. citeturn845792search8

## 1.3 Empaquetado

El frontend debe poder empaquetarse en Docker para despliegue sobre AWS. Docker recomienda multi-stage builds, base images pequeñas, `.dockerignore`, pinning razonable y build/test en CI. citeturn495297search0turn495297search1

## 1.4 Destino de despliegue

El frontend debe quedar listo para despliegue en AWS, previsiblemente sobre ECS Fargate con imagen Docker.

# 2. Estructura profesional recomendada del pipeline

La forma más limpia y mantenible no es un solo workflow gigante.

La recomendación profesional es separar al menos en estos workflows:

- `pr-validation.yml`
- `code-security.yml`
- `deploy-staging.yml`
- `deploy-production.yml`

GitHub también documenta reusable workflows como forma limpia de evitar duplicación cuando el pipeline madura. citeturn495297search4

# 3. Workflow 1: PR Validation

## Objetivo

Validar cada cambio antes de que pueda entrar en `main`.

## Trigger recomendado

- `pull_request` hacia `main`
- opcionalmente `push` a ramas de feature si se quiere feedback temprano

## Regla estructural obligatoria

Este workflow no debe interpretarse como una cadena totalmente secuencial.

La estructura profesional correcta es:

- `install-clean` primero
- `lint-eslint`, `typecheck-tsc` y `test-unit` después, en paralelo
- `build-next` solo cuando esas tres hayan pasado
- `smoke-runtime` y `docker-build-check` después de `build-next`, en paralelo
- `docker-smoke-run` solo después de `docker-build-check`

### Grafo de dependencias esperado

- `install-clean`
- `lint-eslint` needs `install-clean`
- `typecheck-tsc` needs `install-clean`
- `test-unit` needs `install-clean`
- `build-next` needs `[lint-eslint, typecheck-tsc, test-unit]`
- `smoke-runtime` needs `build-next`
- `docker-build-check` needs `build-next`
- `docker-smoke-run` needs `docker-build-check`

## Regla crítica de implementación

`docker-build-check` no debe depender de `smoke-runtime`.

Ambos son validaciones distintas posteriores a `build-next` y deberían poder correr en paralelo.

## Regla de aislamiento entre jobs

Cada job corre en un runner aislado.

Por eso cada job que lo necesite debe hacer su propio:

- checkout
- setup de Node
- `npm ci`

No se compartirán `node_modules` entre jobs.

Sí se permite usar cache de npm y cache de `.next/cache` cuando tenga sentido.

npm documenta `npm ci` como instalación pensada para entornos automatizados, basada en lockfile y más estricta que `npm install`. citeturn241515search6turn241515search1

## Jobs exactos recomendados

### Job 1 `install-clean`

Objetivo:

Validar que el proyecto puede instalar dependencias limpiamente con lockfile.

Debe hacer:

- checkout
- setup Node
- cache de npm
- `npm ci`

### Job 2 `lint-eslint`

Objetivo:

Ejecutar lint del proyecto.

Dependencia:

- `install-clean`

Debe hacer:

- checkout
- setup Node
- cache de npm
- `npm ci`
- `npm run lint`

### Job 3 `typecheck-tsc`

Objetivo:

Ejecutar typecheck estricto de TypeScript.

Dependencia:

- `install-clean`

Debe hacer:

- checkout
- setup Node
- cache de npm
- `npm ci`
- `npm run typecheck`

TypeScript indica que `strict` activa una familia amplia de comprobaciones que refuerzan la corrección del código. citeturn241515search0

### Job 4 `test-unit`

Objetivo:

Ejecutar tests unitarios o de humo cuando existan.

Dependencia:

- `install-clean`

Debe hacer:

- checkout
- setup Node
- cache de npm
- `npm ci`
- `npm test`

### Job 5 `build-next`

Objetivo:

Validar build real de producción del frontend.

Dependencias:

- `lint-eslint`
- `typecheck-tsc`
- `test-unit`

Debe hacer:

- checkout
- setup Node
- cache de npm
- cache de `.next/cache`
- `npm ci`
- `npm run build`
- subir artifact del build necesario para runtime smoke

Next.js recomienda ejecutar `next build` como validación obligatoria antes de producción. citeturn837561search0turn837561search3turn837561search10

### Job 6 `smoke-runtime`

Objetivo:

Verificar que la aplicación ya construida arranca de verdad en modo runtime.

Dependencia:

- `build-next`

Debe hacer:

- checkout
- setup Node
- cache de npm
- `npm ci`
- descargar artifact del build
- arrancar la app con `npm start`
- comprobar que responde al menos la ruta principal

Regla:

Este job valida runtime de la app construida. No debe rehacer `next build`.

### Job 7 `docker-build-check`

Objetivo:

Construir la imagen Docker del frontend.

Dependencia:

- `build-next`

Debe hacer:

- checkout
- `docker build`
- exportar imagen como artifact para el siguiente job

Docker recomienda validar la construcción de la imagen en CI y usar multi-stage builds. citeturn495297search0turn495297search1

### Job 8 `docker-smoke-run`

Objetivo:

Cargar la imagen generada y verificar que el contenedor arranca de verdad.

Dependencia:

- `docker-build-check`

Debe hacer:

- descargar artifact de imagen
- cargar imagen con `docker load`
- arrancar contenedor
- comprobar que responde correctamente
- detener y limpiar contenedor al final

## Checks obligatorios para merge a `main`

Los checks obligatorios recomendados son:

1. `install-clean`
2. `lint-eslint`
3. `typecheck-tsc`
4. `test-unit`
5. `build-next`
6. `smoke-runtime`
7. `docker-build-check`
8. `docker-smoke-run`

GitHub advierte que los nombres de jobs usados como required checks deben ser únicos para evitar resultados ambiguos. citeturn163022search5turn845810search4

# 4. Workflow 2: Code Security

## Objetivo

Mantener un segundo carril de seguridad más profundo, sin mezclarlo con el PR básico.

## Trigger recomendado

- `pull_request` hacia `main`
- `push` a `main`
- ejecución programada semanal

## Jobs exactos recomendados

### Job 10 `codeql-javascript-typescript`

GitHub documenta CodeQL como opción oficial de code scanning para JavaScript y TypeScript, con setup por defecto o avanzado y ejecución en PR, pushes a ramas protegidas y en schedule. citeturn495297search2

### Job 11 `secret-scan-check`

Si más adelante se habilita una herramienta oficial o integrada para secretos, este carril debe incorporar la revisión correspondiente.

## Regla

Este workflow no tiene por qué bloquear siempre un PR en la misma medida que lint o build al inicio, pero sí debe existir y revisarse con disciplina.

# 5. Workflow 3: Deploy Staging

## Objetivo

Desplegar a staging solo cambios que ya pasaron todas las validaciones necesarias.

## Trigger recomendado

- `push` a `main`
- o `workflow_dispatch` si se prefiere más control

## Jobs exactos recomendados

### Job 12 `prepare-release-staging`

Valida versión, contexto de rama y variables del entorno staging.

### Job 13 `build-image-staging`

Construye imagen Docker final versionada para staging.

### Job 14 `push-image-staging`

Publica imagen al registry autorizado.

### Job 15 `deploy-staging`

Despliega a staging usando environment de GitHub y secretos de staging.

GitHub documenta environments con protection rules y secrets por entorno. citeturn837561search1turn837561search2

### Job 16 `postdeploy-smoke-staging`

Verifica después del deploy al menos:

- accesibilidad de la app
- arranque correcto
- ruta principal viva
- configuración base funcional

## Concurrency recomendada

Debe usarse `concurrency` para que staging no reciba dos despliegues simultáneos. GitHub lo documenta como práctica directa para control de deployments. citeturn837561search1turn837561search7

# 6. Workflow 4: Deploy Production

## Objetivo

Desplegar a producción solo cambios ya validados y aprobados explícitamente.

## Trigger recomendado

- `workflow_dispatch`
- o promoción controlada tras staging

## Jobs exactos recomendados

### Job 17 `prepare-release-production`

Comprueba que el release candidato viene de una fuente válida y con evidencia de checks previos.

### Job 18 `approval-production`

Job asociado al environment `production` con required reviewers o protection rules.

GitHub documenta required reviews y environment protection rules para deployments. citeturn837561search1turn837561search2turn837561search8

### Job 19 `build-or-promote-image-production`

La opción más madura es promover una imagen ya validada desde staging si el proceso lo permite. Si no, reconstruir de forma reproducible.

### Job 20 `deploy-production`

Despliegue a producción con secretos y environment propios.

### Job 21 `postdeploy-smoke-production`

Verificación inmediata post deploy:

- app accesible
- ruta principal viva
- errores básicos no presentes
- health checks si existen

### Job 22 `notify-release-result`

Registra o notifica el resultado del despliegue.

### Job 23 `rollback-or-containment`

Ruta definida para rollback o contención si el post deploy falla.

La lógica de release madura incluye pruebas previas, coordinación operativa y rollback listo antes de producción. citeturn537537search12

# 7. Jobs estrictamente obligatorios desde la versión 1

Si el proyecto quiere empezar fuerte pero sin teatralidad, los jobs obligatorios desde el inicio deberían ser estos, agrupados por workflow:

**PR Validation** (`pr-validation.yml`)

1. `install-clean`
2. `lint-eslint`
3. `typecheck-tsc`
4. `test-unit`
5. `build-next`
6. `smoke-runtime`
7. `docker-build-check`
8. `docker-smoke-run`

**Code Security** (`code-security.yml`)

1. `dependency-review`
2. `codeql-javascript-typescript`

**Deploy Staging** (`deploy-staging.yml`)

1. `prepare-release-staging`
2. `build-image-staging`
3. `push-image-staging`
4. `deploy-staging`
5. `postdeploy-smoke-staging`

**Deploy Production** (`deploy-production.yml`)

1. `prepare-release-production`
2. `approval-production`
3. `build-or-promote-image-production`
4. `deploy-production`
5. `postdeploy-smoke-production`
6. `notify-release-result`
7. `rollback-or-containment`

# 8. Jobs opcionales recomendados para endurecer después

Cuando el proyecto gane madurez, conviene añadir:

1. `codeql-javascript-typescript`
2. `bundle-analysis`
3. `lighthouse-staging`
4. `e2e-staging`
5. `container-scan`
6. `dependency-update-review`

Next.js recomienda revisar Core Web Vitals, bundle analysis, accesibilidad y seguridad antes y después de producción. citeturn837561search0turn837561search3turn837561search9

Docker también documenta builds multi-platform para equipos que más adelante necesiten publicar imágenes para más de una arquitectura. citeturn495297search3

# 9. Branch protection y reglas de merge

`main` debería requerir como mínimo:

- PR obligatoria
- prohibición de direct push
- prohibición de force push
- checks obligatorios del workflow de PR
- aprobación antes de merge si el equipo lo permite

# 10. Entornos

## Entornos mínimos

- local
- CI
- staging
- production

## Reglas

Cada entorno debe tener:

- secretos propios
- variables propias
- acceso controlado
- deployment history visible

GitHub environments permite exactamente este modelo con secrets y protection rules. citeturn837561search2turn837561search8

# 11. Reglas de calidad del pipeline

El pipeline profesional estará bien resuelto si:

- bloquea merges rotos
- valida build real de Next.js
- valida build real de Docker
- separa PR validation de deploys
- protege staging y production con environments
- evita deploys concurrentes al mismo entorno
- deja ruta clara de rollback o contención

# 12. Entregables de salida

- mapa de workflows
- lista exacta de jobs
- checks obligatorios para `main`
- estrategia de environments
- estrategia de staging y production
- base para implementar los YAML reales

# Nota metodológica

Un pipeline serio no es solo una lista de checks. Es una cadena de control.

Si esta cadena está bien diseñada, protege el proyecto, disciplina el trabajo y permite crecer sin convertir producción en una lotería.
