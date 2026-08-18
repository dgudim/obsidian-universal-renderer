import { Plugin } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	type PluginSettings,
	PluginSettingsTab,
} from './setting';
import { Processors, renderTypes } from './processors';
import { genCSS } from './palettegen';

export default class GraphvizPlugin extends Plugin {
	declare settings: PluginSettings;

	async onload() {
		this.settings = await this.loadSettings();
		this.addSettingTab(new PluginSettingsTab(this));
		const processors = new Processors(this);

		await genCSS(this);

		for (const type of renderTypes) {
			this.registerMarkdownCodeBlockProcessor(
				type,
				processors.getProcessorForType(type).bind(processors),
			);
		}
	}

	async onExternalSettingsChange() {
		this.settings = await this.loadSettings();
	}

	async loadSettings(): Promise<PluginSettings> {
		const saved: unknown = await this.loadData();
		if (saved && typeof saved === 'object') {
			return { ...DEFAULT_SETTINGS, ...(saved as Partial<PluginSettings>) };
		}
		return { ...DEFAULT_SETTINGS };
	}

	saveSettings(): Promise<void> {
		return this.saveData(this.settings);
	}
}
