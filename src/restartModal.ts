import { type App, Modal, Setting } from "obsidian";

export class RestartModal extends Modal {

    onResult: (response: boolean) => void;

    constructor(app: App, onResult: (response: boolean) => void) {
        super(app);
        this.onResult = onResult;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h1", { text: "Please restart obsidian" });
        contentEl.createEl("p", { text: "Changing the theme requires a restart" })

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Cancel")
                    .onClick(() => {
                        this.close();
                        return this.onResult(false);
                    }))
            .addButton((btn) =>
                btn
                    .setButtonText("Restart later")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        return this.onResult(true);
                    }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}