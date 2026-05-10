import { Player } from '../core/Player';
import { PlayerListener, TraxSongModel } from '../core/types';
import { resolveAssetPath } from '../utils/assetPaths';

interface TraxPlayerUiOptions {
  container: HTMLElement;
  player: Player;
  assetsPath: string;
  songUrl: string;
  sampleUrl: string;
  onExportRequested(): void;
  onLoadRequested(songUrl: string, sampleUrl: string): void;
}

export class TraxPlayerUi implements PlayerListener {
  readonly root: HTMLElement;
  private songName!: HTMLElement;
  private songAuthor!: HTMLElement;
  private songPlayed!: HTMLElement;
  private songLength!: HTMLElement;
  private led!: HTMLImageElement;
  private playButton!: HTMLButtonElement;
  private volumeControl!: HTMLElement;
  private volumeMask!: HTMLElement;
  private volumeKnob!: HTMLImageElement;
  private contextMenu!: HTMLElement;
  private exportButton!: HTMLButtonElement;
  private status!: HTMLElement;
  private ledTimer = 0;
  private ledFrame = 0;
  private ledFrames: string[];
  private playImage: string;
  private stopImage: string;
  private isPlaying = false;

  constructor(private options: TraxPlayerUiOptions) {
    this.ledFrames = Array.from({ length: 53 }, (_item, index) =>
      this.asset(`flash/sprites/DefineSprite_48/${index + 1}.png`)
    );
    this.playImage = this.asset('flash/buttons/DefineButton2_51/1.png');
    this.stopImage = this.asset('flash/buttons/DefineButton2_54/1.png');
    this.root = this.render();
    this.options.container.appendChild(this.root);
    this.bindEvents();
    this.renderVolume();
    this.setReady(false);
  }

  onSongLoad(success: boolean, song: TraxSongModel): void {
    if (!success) {
      this.setError('Song load failed.');
      return;
    }

    this.root.querySelector('.trax-player-shell')?.classList.add('is-loaded');
    this.root.querySelector('.trax-player-shell')?.classList.remove('has-error');
    this.songName.textContent = song.name;
    this.songAuthor.textContent = song.author;
    this.songLength.textContent = `(${secondsToString(song.lengthSeconds)})`;
    this.setReady(true);
    this.setStatus('Ready.');
  }

  onSongPlaying(success: boolean): void {
    if (!success) {
      this.setError('Could not start playback.');
      return;
    }

    this.root.querySelector('.trax-player-shell')?.classList.add('is-playing');
    this.isPlaying = true;
    this.playButton.setAttribute('aria-label', 'Stop');
    this.playButton.style.backgroundImage = cssUrl(this.stopImage);
    this.startLed();
  }

  onTick(seconds: number): void {
    this.songPlayed.textContent = secondsToString(seconds);
  }

  onStop(): void {
    this.root.querySelector('.trax-player-shell')?.classList.remove('is-playing');
    this.isPlaying = false;
    this.playButton.setAttribute('aria-label', 'Play');
    this.playButton.style.backgroundImage = cssUrl(this.playImage);
    this.stopLed();
  }

  setLoading(message: string): void {
    this.setReady(false);
    this.root.querySelector('.trax-player-shell')?.classList.remove('is-loaded', 'has-error');
    this.songName.textContent = 'Loading...';
    this.songAuthor.textContent = '';
    this.songLength.textContent = '(00:00)';
    this.songPlayed.textContent = '00:00';
    this.setStatus(message);
  }

  setError(message: string): void {
    this.setReady(false);
    this.options.player.stopPlaying();
    this.root.querySelector('.trax-player-shell')?.classList.add('has-error');
    this.songName.textContent = 'Load failed';
    this.songAuthor.textContent = '';
    this.setStatus(message);
  }

  private render(): HTMLElement {
    const wrapper = document.createElement('main');
    wrapper.className = 'trax-page';
    wrapper.innerHTML = `
      <section class="trax-widget" aria-label="Habbo Trax Player">
        <div class="trax-player-shell">
          <img class="trax-top-panel" src="${this.asset('flash/images/1.png')}" alt="">
          <img class="trax-loading-card" src="${this.asset('flash/sprites/DefineSprite_78/1.png')}" alt="">
          <div class="trax-song-meta">
            <div class="trax-song-title" data-role="song-name">Loading...</div>
            <div class="trax-song-author" data-role="song-author"></div>
          </div>
          <div class="trax-time-row">
            <span data-role="song-played">00:00</span>
            <span data-role="song-length">(00:00)</span>
          </div>
          <div class="trax-volume-icon" aria-hidden="true">
            <img class="trax-volume-icon-base" src="${this.asset('flash/images/3.png')}" alt="">
            <span class="trax-volume-icon-mask" data-role="volume-mask">
              <img class="trax-volume-icon-lit" src="${this.asset('flash/images/7.png')}" alt="">
            </span>
          </div>
          <img class="trax-led" data-role="led" src="${this.ledFrames[0]}" alt="">
          <button class="trax-transport" data-role="play-button" type="button" aria-label="Play" style="background-image: ${cssUrl(this.playImage)}" disabled></button>
          <div class="trax-volume-control" data-role="volume-control" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-disabled="true">
            <img class="trax-volume-line" src="${this.asset('flash/sprites/DefineSprite_58/1.png')}" alt="">
            <img class="trax-volume-knob" data-role="volume-knob" src="${this.asset('flash/sprites/DefineSprite_61/1.png')}" alt="">
          </div>
        </div>
        <div class="trax-context-menu" data-role="context-menu" hidden>
          <button data-role="export-button" type="button">Export Trax song as MP3</button>
        </div>
        <p class="trax-status" data-role="status" role="status"></p>
      </section>
    `;

    this.songName = getRole(wrapper, 'song-name');
    this.songAuthor = getRole(wrapper, 'song-author');
    this.songPlayed = getRole(wrapper, 'song-played');
    this.songLength = getRole(wrapper, 'song-length');
    this.led = getRole(wrapper, 'led') as HTMLImageElement;
    this.playButton = getRole(wrapper, 'play-button') as HTMLButtonElement;
    this.volumeControl = getRole(wrapper, 'volume-control');
    this.volumeMask = getRole(wrapper, 'volume-mask');
    this.volumeKnob = getRole(wrapper, 'volume-knob') as HTMLImageElement;
    this.contextMenu = getRole(wrapper, 'context-menu');
    this.exportButton = getRole(wrapper, 'export-button') as HTMLButtonElement;
    this.status = getRole(wrapper, 'status');
    return wrapper;
  }

  private bindEvents(): void {
    this.playButton.addEventListener('click', () => {
      if (this.isPlaying) {
        this.options.player.stopPlaying();
        return;
      }

      void this.options.player.startPlaying();
    });
    this.volumeControl.addEventListener('pointerdown', (event) => this.beginVolumeDrag(event));
    this.volumeControl.addEventListener('keydown', (event) => this.onVolumeKeyDown(event));
    this.root.addEventListener('contextmenu', (event) => this.openContextMenu(event));
    this.exportButton.addEventListener('click', () => {
      this.closeContextMenu();
      this.options.onExportRequested();
    });
    document.addEventListener('pointerdown', (event) => {
      if (!this.contextMenu.hidden && !this.contextMenu.contains(event.target as Node)) {
        this.closeContextMenu();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeContextMenu();
      }
    });
  }

  setExporting(isExporting: boolean): void {
    this.exportButton.disabled = isExporting;
    this.exportButton.textContent = isExporting ? 'Exporting...' : 'Export Trax song as MP3';
    this.setStatus(isExporting ? 'Exporting MP3...' : this.status.textContent || '');
  }

  setStatus(message: string): void {
    this.status.textContent = message;
  }

  private beginVolumeDrag(event: PointerEvent): void {
    if (this.volumeControl.getAttribute('aria-disabled') === 'true') {
      return;
    }

    event.preventDefault();
    this.volumeControl.setPointerCapture(event.pointerId);
    this.updateVolumeFromPointer(event);

    const move = (moveEvent: PointerEvent) => this.updateVolumeFromPointer(moveEvent);
    const end = (endEvent: PointerEvent) => {
      this.volumeControl.releasePointerCapture(endEvent.pointerId);
      this.volumeControl.removeEventListener('pointermove', move);
      this.volumeControl.removeEventListener('pointerup', end);
      this.volumeControl.removeEventListener('pointercancel', end);
    };

    this.volumeControl.addEventListener('pointermove', move);
    this.volumeControl.addEventListener('pointerup', end);
    this.volumeControl.addEventListener('pointercancel', end);
  }

  private updateVolumeFromPointer(event: PointerEvent): void {
    const rect = this.volumeControl.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    this.options.player.setVolume(ratio * 100);
    this.renderVolume();
  }

  private onVolumeKeyDown(event: KeyboardEvent): void {
    if (this.volumeControl.getAttribute('aria-disabled') === 'true') {
      return;
    }

    const steps: Record<string, number> = {
      ArrowLeft: -5,
      ArrowDown: -5,
      ArrowRight: 5,
      ArrowUp: 5,
      PageDown: -10,
      PageUp: 10,
    };

    if (event.key === 'Home') {
      event.preventDefault();
      this.options.player.setVolume(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.options.player.setVolume(100);
    } else if (Object.prototype.hasOwnProperty.call(steps, event.key)) {
      event.preventDefault();
      this.options.player.setVolume(this.options.player.getVolume() + steps[event.key]);
    }
    this.renderVolume();
  }

  private renderVolume(): void {
    const knobMax = 54;
    const value = this.options.player.getVolume();
    this.volumeKnob.style.left = `${Math.round((value / 100) * knobMax)}px`;
    this.volumeMask.style.width = `${Math.round(value * 0.63)}px`;
    this.volumeControl.setAttribute('aria-valuenow', String(value));
  }

  private setReady(isReady: boolean): void {
    this.playButton.disabled = !isReady;
    this.volumeControl.setAttribute('aria-disabled', String(!isReady));
  }

  private startLed(): void {
    this.stopLed();
    this.ledFrame = 0;
    this.ledTimer = window.setInterval(() => {
      this.led.src = this.ledFrames[this.ledFrame % this.ledFrames.length];
      this.ledFrame += 1;
    }, 80);
  }

  private stopLed(): void {
    window.clearInterval(this.ledTimer);
    this.ledTimer = 0;
    this.led.src = this.ledFrames[0];
  }

  private asset(path: string): string {
    return resolveAssetPath(this.options.assetsPath, path);
  }

  private openContextMenu(event: MouseEvent): void {
    event.preventDefault();

    const rect = this.root.getBoundingClientRect();
    this.contextMenu.style.left = `${event.clientX - rect.left}px`;
    this.contextMenu.style.top = `${event.clientY - rect.top}px`;
    this.contextMenu.hidden = false;
    this.exportButton.focus();
  }

  private closeContextMenu(): void {
    this.contextMenu.hidden = true;
  }
}

function getRole<T extends HTMLElement = HTMLElement>(root: HTMLElement, role: string): T {
  const element = root.querySelector(`[data-role="${role}"]`);
  if (!element) {
    throw new Error(`Missing UI role ${role}`);
  }
  return element as T;
}

function secondsToString(value: number): string {
  const seconds = Math.max(0, Math.floor(value));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function cssUrl(value: string): string {
  return `url('${value.replace(/'/g, "\\'")}')`;
}
