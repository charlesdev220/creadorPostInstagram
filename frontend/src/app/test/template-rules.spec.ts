import { readFileSync } from 'fs';
import { join } from 'path';

// Paths absolutos desde la raíz del proyecto (frontend/)
const DASHBOARD_HTML = join(
  __dirname,
  '../features/dashboard/dashboard.component.html'
);
const DASHBOARD_CSS = join(
  __dirname,
  '../features/dashboard/dashboard.component.css'
);
const GLOBAL_STYLES = join(__dirname, '../../styles.css');

const html          = readFileSync(DASHBOARD_HTML, 'utf-8');
const componentCss  = readFileSync(DASHBOARD_CSS, 'utf-8');
const globalStyles  = readFileSync(GLOBAL_STYLES, 'utf-8');

describe('Template rules — dashboard.component.html', () => {

  // T-12 — UC-15: no hex directo en el template ────────────────────────────
  it('UC-15: no debe contener valores hex directos (#RRGGBB / #RGB)', () => {
    // La única excepción permitida son hex en comentarios HTML <!-- -->
    // Se elimina comentarios del HTML antes de verificar
    const htmlSinComentarios = html.replace(/<!--[\s\S]*?-->/g, '');
    expect(htmlSinComentarios).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });

  // T-13 — UC-14: no .set() inline en el template ──────────────────────────
  it('UC-14: no debe llamar .set() directamente en el template', () => {
    expect(html).not.toMatch(/\.set\(/);
  });

  // T-14 — UC-17: no style="opacity en el template ─────────────────────────
  it('UC-17: no debe contener style="opacity en atributos inline', () => {
    expect(html).not.toMatch(/style="opacity/);
  });

  // T-46 — UC-16: .glass-panel en styles.css, no en dashboard.component.css ─
  it('UC-16: .glass-panel debe declararse en styles.css global, no en dashboard.component.css', () => {
    expect(globalStyles).toContain('.glass-panel');
    expect(componentCss).not.toContain('.glass-panel');
  });

});
