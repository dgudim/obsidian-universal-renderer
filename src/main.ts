import { FileSystemAdapter, Plugin } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	type PluginSettings,
	PluginSettingsTab,
} from './setting';
import { Processors, renderTypes } from './processors';
import * as fs from 'fs';
import { genCSS } from './palettegen';

export default class GraphvizPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		console.debug('Load universal renderer plugin');
		await this.loadSettings();
		this.addSettingTab(new PluginSettingsTab(this));
		const processors = new Processors(this);

		let colorCssPath = '';

		const adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			colorCssPath = `${adapter.getBasePath()}/${
				this.app.vault.configDir
			}/plugins/${this.manifest.id}/styles.css`;
		} else {
			throw TypeError('this.app.vault.adapter is not a FileSystemAdapter');
		}

		if (!fs.existsSync(colorCssPath)) {
			fs.writeFileSync(colorCssPath, genCSS());
		}

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

	async loadSettings(): Promise<void> {
		this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
		return Promise.resolve();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
