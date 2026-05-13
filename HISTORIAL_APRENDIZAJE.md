# Historial de Aprendizaje

### Qué hemos aprendido en el desarrollo de esta iteración (Migración Angular 20 SSR):

*Qué se aprendió:*
- Angular 20 usa `AngularNodeAppEngine` + `createNodeRequestHandler` (no `CommonEngine` de versiones anteriores). El `server.ts` generado por CLI ya no sigue el patrón de la documentación de Angular 17/18.
- `jest-preset-angular@16` requiere `--legacy-peer-deps` con Angular 20 por un conflicto de peer en `@angular/platform-browser-dynamic` (removido en Angular 20). Se resuelve con un shim en `__mocks__/`.
- Tailwind v4 usa `@import "tailwindcss"` + `@theme {}` en lugar de las directivas `@tailwind base/components/utilities` de v3. Importante al configurar `styles.css`.
- Los estilos de un componente Angular (View Encapsulation) no alcanzan a componentes hijos — cualquier clase CSS que un componente hijo necesite debe ir en `styles.css` global.
- La interfaz `AnalysisJson` debe modelar la estructura real del JSON que devuelve Gemini (objetos anidados), no una versión simplificada. El prompt es la fuente de verdad del contrato.

*Por qué se aprendió:* la migración expuso discrepancias entre la documentación oficial de Angular y el comportamiento real del CLI v20, y entre el modelo de datos asumido y la respuesta real de la API.

*Dónde se aprendió:* implementación de `frontend/src/server.ts`, setup de Jest en `frontend/jest.config.ts`, y comparación entre `frontend/src/app/core/models/analysis.model.ts` y `src/app/api/generate/route.ts`.
