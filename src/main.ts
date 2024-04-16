import { Plugin } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	type PluginSettings,
	PluginSettingsTab,
} from './setting';
import { Processors, renderTypes } from './processors';
import { genCSS } from './palettegen';

export default class GraphvizPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		console.debug('Load universal renderer plugin');
		this.settings = await this.loadSettings();
		this.addSettingTab(new PluginSettingsTab(this));
		const processors = new Processors(this);

		await genCSS(this);

		this.app.workspace.onLayoutReady(() => {
			for (const type of renderTypes) {
				this.registerMarkdownCodeBlockProcessor(
					type,
					processors.getProcessorForType(type).bind(processors),
				);
			}
		});
	}

	onunload() {
		console.debug('Unload universal renderer plugin');
	}

	async loadSettings(): Promise<PluginSettings> {
		return { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
	}

	saveSettings(): Promise<void> {
		return this.saveData(this.settings);
	}
}
