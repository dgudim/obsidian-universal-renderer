import { ConfirmationModal, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import type GraphvizPlugin from './main';
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

type ExecutableSetting = Exclude<keyof PluginSettings, 'colorPalette'>;

const EXECUTABLES: { key: ExecutableSetting; name: string }[] = [
	{ key: 'dotPath', name: 'Graphviz' },
	{ key: 'pdflatexPath', name: 'pdfLaTeX' },
	{ key: 'pdf2svgPath', name: 'pdf2svg' },
	{ key: 'pdfCropPath', name: 'pdfcrop' },
	{ key: 'blockdiagPath', name: 'Blockdiag' },
	{ key: 'ditaaPath', name: 'Ditaa' },
	{ key: 'asciidocPath', name: 'AsciiDoc' },
	{ key: 'plantumlPath', name: 'PlantUML' },
	{ key: 'typstPath', name: 'Typst' },
	{ key: 'd2Path', name: 'D2' },
	{ key: 'seqdiagPath', name: 'Seqdiag' },
	{ key: 'actdiagPath', name: 'Actdiag' },
	{ key: 'nwdiagPath', name: 'Nwdiag' },
	{ key: 'wavedromPath', name: 'WaveDrom' },
	{ key: 'bytefieldPath', name: 'Bytefield' },
	{ key: 'vegaLitePath', name: 'Vega-Lite' },
];

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

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Color palette',
				desc: 'Requires an Obsidian restart to take effect.',
				render: (setting) => {
					setting.addDropdown((drop) => {
						for (const palette of COLOR_PALETTES) {
							drop.addOption(palette, palette.replaceAll('_', ' '));
						}
						drop.setValue(this.plugin.settings.colorPalette).onChange((value) => {
							new ConfirmationModal(this.app)
								.setTitle('Please restart Obsidian')
								.setContent('Changing the theme requires a restart.')
								.addButton((btn) =>
									btn
										.setButtonText('Restart later')
										.setCta()
										.onClick(async () => {
											this.plugin.settings.colorPalette = value as ColorPalette;
											await this.plugin.saveSettings();
											await genCSS(this.plugin, true);
										}),
								)
								.addCancelButton('Cancel')
								.setCloseCallback(() => {
									drop.setValue(this.plugin.settings.colorPalette);
								})
								.open();
						});
					});
				},
			},
			{
				type: 'group',
				heading: 'Executables',
				items: EXECUTABLES.map(({ key, name }) => ({
					name,
					desc: `Path to the ${DEFAULT_SETTINGS[key]} executable.`,
					control: {
						type: 'text' as const,
						key,
						placeholder: DEFAULT_SETTINGS[key],
					},
				})),
			},
		];
	}
}
