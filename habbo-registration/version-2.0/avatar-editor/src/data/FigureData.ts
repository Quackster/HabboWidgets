import { FigureDataSet } from './FigureDataSet';
import { FigureDataColor } from './FigureDataColor';
import { FigureDataPart } from './FigureDataPart';

export class FigureData {
  private static instance: FigureData | null = null;

  private setTypeArr: Array<[string, boolean]> = [];
  private setArr: FigureDataSet[] = [];
  private paletteArr: FigureDataColor[] = [];
  private loaded = false;

  static getInstance(): FigureData {
    if (!FigureData.instance) {
      FigureData.instance = new FigureData();
    }
    return FigureData.instance;
  }

  async loadFromUrl(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[FigureData] Failed to load: ${url} (${response.status})`);
      return;
    }
    const text = await response.text();
    this.loadFromText(text);
  }

  loadFromText(text: string): void {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    this.parseXml(xml);
    console.log(`[FigureData] Loaded ${this.setArr.length} sets, ${this.paletteArr.length} colors, ${this.setTypeArr.length} set types`);
  }

  parseXml(xml: Document): void {
    const figuredata = xml.querySelector('figuredata');
    if (!figuredata) return;

    const setsNode = figuredata.querySelector('sets');
    if (setsNode) this.parseSets(setsNode);

    const colorsNode = figuredata.querySelector('colors');
    if (colorsNode) this.parseColors(colorsNode);

    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getSetTypes(): Array<[string, boolean]> {
    return this.setTypeArr;
  }

  getSetForId(id: number): FigureDataSet | null {
    for (const set of this.setArr) {
      if (set.getSetId() === id) {
        return set;
      }
    }
    return null;
  }

  getSetsForSetType(
    setType: string,
    gender: string,
    useExtendedSets = true,
    onlySelectableSets = true
  ): FigureDataSet[] {
    const sets: FigureDataSet[] = [];
    for (const set of this.setArr) {
      if (onlySelectableSets && !set.isSelectable()) continue;
      if (set.getSetType() !== setType) continue;
      if (set.getGender() !== gender && set.getGender() !== 'U') continue;
      if (!useExtendedSets && set.isClubOnly()) continue;
      sets.push(set);
    }
    return sets;
  }

  getPaletteIdForSetType(setType: string): number {
    for (const set of this.setArr) {
      if (set.getSetType() === setType) {
        return set.getPaletteId();
      }
    }
    return 1;
  }

  getPartsForSetId(setId: number): FigureDataPart[] {
    for (const set of this.setArr) {
      if (set.getSetId() === setId) {
        return set.getParts();
      }
    }
    return [];
  }

  getColorsForPaletteId(
    paletteId: number,
    useClub = true,
    onlySelectable = true
  ): FigureDataColor[] {
    const colors: FigureDataColor[] = [];
    for (const color of this.paletteArr) {
      if (onlySelectable && !color.isSelectable()) continue;
      if (color.getPaletteId() !== paletteId) continue;
      if (!useClub && color.isClubOnly()) continue;
      colors.push(color);
    }
    return colors;
  }

  getColorData(colorId: number): FigureDataColor | null {
    for (const color of this.paletteArr) {
      if (color.getID() === colorId) {
        return color;
      }
    }
    return null;
  }

  isSetTypeMandatory(setType: string): boolean {
    for (const [type, mandatory] of this.setTypeArr) {
      if (type === setType) {
        return mandatory;
      }
    }
    return false;
  }

  private parseColors(colorsNode: Element): void {
    this.paletteArr = [];
    const palettes = colorsNode.querySelectorAll('palette');
    for (const paletteNode of palettes) {
      const paletteId = parseInt(paletteNode.getAttribute('id') || '0', 10);
      const colorNodes = paletteNode.querySelectorAll('color');
      for (const colorNode of colorNodes) {
        const colorId = parseInt(colorNode.getAttribute('id') || '0', 10);
        const colorIndex = parseInt(colorNode.getAttribute('index') || '0', 10);
        const clubOnly = colorNode.getAttribute('club') === '1';
        const selectable = colorNode.getAttribute('selectable') === '1';
        const colorValue = colorNode.textContent || 'FFFFFF';
        this.paletteArr.push(
          new FigureDataColor(paletteId, colorValue, colorId, colorIndex, clubOnly, selectable)
        );
      }
    }
  }

  private parseSets(setsNode: Element): void {
    this.setArr = [];
    this.setTypeArr = [];
    const setTypeNodes = setsNode.querySelectorAll('settype');
    for (const setTypeNode of setTypeNodes) {
      const setType = setTypeNode.getAttribute('type') || '';
      const paletteId = parseInt(setTypeNode.getAttribute('paletteid') || '0', 10);
      const mandatory = setTypeNode.getAttribute('mandatory') === '1';
      this.setTypeArr.push([setType, mandatory]);

      const setNodes = setTypeNode.querySelectorAll('set');
      for (const setNode of setNodes) {
        const setId = parseInt(setNode.getAttribute('id') || '0', 10);
        const gender = setNode.getAttribute('gender') || 'U';
        const clubOnly = setNode.getAttribute('club') === '1';
        const colorable = setNode.getAttribute('colorable') === '1';
        const selectableAttr = setNode.getAttribute('selectable');
        const selectable = selectableAttr === null ? true : selectableAttr === '1';

        const parts: FigureDataPart[] = [];
        const partNodes = setNode.querySelectorAll(':scope > part');
        for (const partNode of partNodes) {
          const partId = parseInt(partNode.getAttribute('id') || '0', 10);
          const partType = partNode.getAttribute('type') || '';
          const partColorable = partNode.getAttribute('colorable') === '1';
          parts.push(new FigureDataPart(partId, partType, partColorable));
        }

        const hiddenLayers: string[] = [];
        const hiddenLayersNode = setNode.querySelector('hiddenlayers');
        if (hiddenLayersNode) {
          const layerNodes = hiddenLayersNode.querySelectorAll('layer');
          for (const layerNode of layerNodes) {
            const partType = layerNode.getAttribute('parttype') || '';
            hiddenLayers.push(partType);
          }
        }

        this.setArr.push(
          new FigureDataSet(
            setId, setType, paletteId, gender, parts,
            clubOnly, selectable, colorable, hiddenLayers
          )
        );
      }
    }
  }
}
