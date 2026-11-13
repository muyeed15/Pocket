import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000/',
});

const { window } = dom;

Object.assign(globalThis, {
  window,
  self: window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  SVGElement: window.SVGElement,
  Element: window.Element,
  Node: window.Node,
  Event: window.Event,
  KeyboardEvent: window.KeyboardEvent,
  MouseEvent: window.MouseEvent,
  PointerEvent: window.MouseEvent,
  FormData: window.FormData,
  getComputedStyle: window.getComputedStyle.bind(window),
});

Object.defineProperty(globalThis, 'navigator', {
  value: window.navigator,
  configurable: true,
});

export function installDom(): void {
  // Executed on module import via --import
}
