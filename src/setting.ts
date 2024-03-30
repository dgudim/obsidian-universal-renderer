import { PluginSettingTab, Setting } from 'obsidian';
import type GraphvizPlugin from './main';

export type PluginSettings = {
  dotPath: string;
  pdflatexPath: string;
  pdf2svgPath: string;
  pdfCropPath: string;
  blockdiagPath: string;
  ditaaPath: string;
  asciidocPath: string;
  plantumlPath: string;
  typstPath: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  dotPath: 'dot',
  pdflatexPath: 'pdflatex',
  pdf2svgPath: 'pdf2svg',
  pdfCropPath: 'pdfcrop',
  blockdiagPath: 'blockdiag',
  ditaaPath: 'ditaa',
  asciidocPath: 'asciidoctor',
  plantumlPath: 'plantuml',
  typstPath: 'typst',
};

export class PluginSettingsTab extends PluginSettingTab {
  plugin: GraphvizPlugin;

  constructor(plugin: GraphvizPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    let setting: keyof typeof DEFAULT_SETTINGS; // extract all keys

    for (setting in DEFAULT_SETTINGS) {
      new Setting(containerEl).setName(setting)
        .addText(text => text.setPlaceholder(DEFAULT_SETTINGS[setting])
          .setValue(this.plugin.settings[setting])
          .onChange(async (value) => {
            this.plugin.settings[setting] = value;
            await this.plugin.saveSettings();
          }
          )
        );
    }
  }
}
