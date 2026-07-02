import { HabbosV2Landing } from './HabbosV2Landing';
import { HabbosLandingConfig, readConfig } from './config';

declare global {
  interface Window {
    HabbosV2Landing: typeof HabbosV2Landing;
    HabboLandingWidget: typeof HabboLandingWidget;
  }
}

class HabboLandingWidget {
  private readonly widget: HabbosV2Landing;

  constructor(container: HTMLElement, options?: HabbosLandingConfig) {
    container.innerHTML = '';
    container.style.width = '396px';
    container.style.height = '377px';
    container.style.overflow = 'hidden';

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    this.widget = new HabbosV2Landing(canvas, readConfig(options));
    void this.widget.start();
  }

  stop(): void {
    this.widget.stop();
  }
}

window.HabbosV2Landing = HabbosV2Landing;
window.HabboLandingWidget = HabboLandingWidget;

function init(): void {
  const config = readConfig();
  const container = document.getElementById(config.container);
  if (!container) {
    console.error(`[HabbosV2Landing] No element with id="${config.container}" found.`);
    return;
  }

  new HabboLandingWidget(container, config);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
