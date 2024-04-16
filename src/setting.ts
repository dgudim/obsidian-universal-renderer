import { PluginSettingTab, Setting } from 'obsidian';
import type GraphvizPlugin from './main';

const COLOR_PALETTES = <const>['gruvbox', 'catppuccin'];
export type ColorPalette = (typeof COLOR_PALETTES)[number];

export type PluginSettings = {
	colorPalette: ColorPalette;
	dotPath: string;
	pdflatexPath: string;
	pdf2svgPath: string;
	pdfCropPath: string;
	blockdiagPath: string;
	ditaaPath: string;
	asciidocPath: string;
	plantumlPath: string;
	typstPath: string;
};

export const DEFAULT_SETTINGS: PluginSettings = {
	colorPalette: 'gruvbox',
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

		new Setting(containerEl).setName('Color palette').addDropdown((drop) => {
			for (const palette of COLOR_PALETTES) {
				drop.addOption(palette, palette.replace('_', ' '));
			}
			drop
				.setValue(this.plugin.settings.colorPalette)
				.onChange(async (value) => {
					this.plugin.settings.colorPalette = value as ColorPalette;
					await this.plugin.saveSettings();
				});
		});

		for (setting in DEFAULT_SETTINGS) {
			if (setting === 'colorPalette') {
				continue;
			}
			const name = setting.split(/(?=[A-Z])/).join(' ');
			new Setting(containerEl)
				.setName(name[0].toUpperCase() + name.slice(1))
				.addText((text) =>
					text
						.setPlaceholder(DEFAULT_SETTINGS[setting])
						.setValue(this.plugin.settings[setting])
						.onChange(async (value) => {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							this.plugin.settings[setting] = value as any;
							await this.plugin.saveSettings();
						}),
				);
		}
	}
}
