// Shim: @angular/platform-browser-dynamic/testing fue eliminado en Angular 20.
// Re-exporta los equivalentes desde @angular/platform-browser/testing
// para compatibilidad con @ngneat/spectator@22 y jest-preset-angular@16.
const { BrowserTestingModule, platformBrowserTesting } = require('@angular/platform-browser/testing');

module.exports = {
  BrowserDynamicTestingModule: BrowserTestingModule,
  platformBrowserDynamicTesting: platformBrowserTesting,
};
