import { PluginSettingTab, Setting } from 'obsidian';
import type GraphvizPlugin from './main';
import { RestartModal } from './restartModal';
import { genCSS } from './palettegen';

const COLOR_PALETTES = [
	'gruvbox',
	'catppuccin',
	'dracula',
	'nord',
	'tokyo_night',
	'one_dark',
	'solarized',
	'everforest',
] as const;
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
	d2Path: string;
	seqdiagPath: string;
	actdiagPath: string;
	nwdiagPath: string;
	wavedromPath: string;
	bytefieldPath: string;
	vegaLitePath: string;
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
	d2Path: 'd2',
	seqdiagPath: 'seqdiag',
	actdiagPath: 'actdiag',
	nwdiagPath: 'nwdiag',
	wavedromPath: 'wavedrom-cli',
	bytefieldPath: 'bytefield-svg',
	vegaLitePath: 'vl2svg',
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

		new Setting(containerEl).setName('Color palette').addDropdown((drop) => {
			for (const palette of COLOR_PALETTES) {
				drop.addOption(palette, palette.replace('_', ' '));
			}
			drop.setValue(this.plugin.settings.colorPalette)
				.onChange(async (value) => {
					new RestartModal(this.app, (res) => {
						if (res) {
							this.plugin.settings.colorPalette = value as ColorPalette;
							this.plugin.saveSettings()
							genCSS(this.plugin, true)
						} else {
							drop.setValue(this.plugin.settings.colorPalette)
						}
					}).open();
				});
		});

		for (const setting of Object.keys(DEFAULT_SETTINGS) as (keyof PluginSettings)[]) {
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
							// biome-ignore lint/suspicious/noExplicitAny: <explanation>
							this.plugin.settings[setting] = value as any;
							await this.plugin.saveSettings();
						}),
				);
		}
	}
}
