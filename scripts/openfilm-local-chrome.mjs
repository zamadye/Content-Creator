// OpenFilm 0.3.2 has no CLI browser selector. Adapt its shared browser launcher
// in memory, including Studio and render workers, without modifying npm files.
import { registerHooks } from 'node:module';

if (process.env.OPENFILM_BROWSER_CHANNEL) {
  registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      if (!url.endsWith('/openfilm/src/host.mjs')) return result;
      const source = String(result.source);
      const original = "export async function launch({ headed = false, channel = headed ? 'chromium' : null,";
      if (!source.includes(original)) {
        throw new Error('OpenFilm browser launcher changed; review scripts/openfilm-local-chrome.mjs.');
      }
      let adapted=source.replace(original,
        "export async function launch({ headed = process.env.OPENFILM_HEADED === '1', channel = process.env.OPENFILM_BROWSER_CHANNEL || (headed ? 'chromium' : null),");
      // Playwright prepares the full emulated viewport before capture. The raw
      // CDP shortcut used upstream can crop/scale a GUI window on Linux desktops.
      const capture="this.cdp.send('Page.captureScreenshot', { format, quality, clip, fromSurface: true, optimizeForSpeed: true })";
      if (!adapted.includes(capture)) throw new Error('OpenFilm capture changed; review the local Chrome adapter.');
      adapted=adapted.replace(capture,
        "this.page.screenshot({ type: format, quality: format === 'png' ? undefined : quality, clip: { x: 0, y: 0, width: this.meta.width, height: this.meta.height }, scale: 'device', animations: 'allow', caret: 'initial', timeout: CAPTURE_MS }).then(buffer => ({ data: buffer.toString('base64') }))");
      return {
        ...result,
        source: adapted,
      };
    },
  });
}
