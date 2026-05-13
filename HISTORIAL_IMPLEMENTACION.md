# Historial de Implementación

### Qué hemos completado hasta ahora (Migración Next.js → Angular 20 SSR):
*Fase actual:* Fase 1: Migración de stack
*Estado actual:* Completado

- ✔️ **Scaffold Angular 20 SSR:** proyecto creado en `frontend/` con `ng new --ssr --standalone`
- ✔️ **Server Express:** `frontend/src/server.ts` con handlers `/api/generate` y `/api/generate-variation` + `AngularNodeAppEngine` para SSR
- ✔️ **Modelos TypeScript:** `AnalysisJson` con estructura anidada real de Gemini (9 campos objeto), `BatchResult`, `GenerateRequest/Response`, `GenerateVariationRequest/Response`
- ✔️ **Servicios core:** `GeminiAnalysisService`, `ImageUploadService`, `ClipboardService` — todos `@Injectable({ providedIn: 'root' })`
- ✔️ **Sistema de diseño:** Tailwind v4 + variables CSS glassmorphism en `styles.css`. Tokens en `tailwind.config.js`
- ✔️ **DashboardComponent:** signals tipados, computed con JSDoc, métodos por evento (cero `.set()` inline en template)
- ✔️ **Componentes dumb:** `ImageUploadComponent` y `BatchResultCardComponent` extraídos de estructuras repetidas del dashboard
- ✔️ **Testing:** migración Karma/Jasmine → Jest + Spectator; 25+ tests en estructura espejo `src/app/test/`
- ✔️ **Angular wiring:** `app.routes.ts` lazy-load, `app.config.ts` con `provideHttpClient(withFetch())` + `provideClientHydration(withEventReplay())`

*Deuda técnica documentada:*
- Next.js en raíz del repo todavía presente (T-01 diferido hasta pasar verificación E2E)
- `AnalysisJson` usa estructura anidada — si Gemini cambia su schema, actualizar modelo e interfaz

*Próximos pasos:* paso 5-verify — `ng serve` + prueba del flujo completo + `ng build`
