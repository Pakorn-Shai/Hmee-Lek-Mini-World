"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const packageJSON = require('../package.json');
async function showWarning(message) {
    console.warn(`[Hmee Lek Scene Builder] ${message}`);
    if (Editor.Dialog?.warn) {
        await Editor.Dialog.warn(message);
    }
}
async function showInfo(message) {
    console.log(`[Hmee Lek Scene Builder] ${message}`);
    if (Editor.Dialog?.info) {
        await Editor.Dialog.info(message);
    }
}
module.exports = {
    load() {
        console.log('[Hmee Lek Scene Builder] loaded');
    },
    unload() {
        console.log('[Hmee Lek Scene Builder] unloaded');
    },
    methods: {
        async buildBubbleStageSelect() {
            console.log('[Hmee Lek Tools] Requesting StageSelect build');
            let result;
            try {
                result = (await Editor.Message.request('scene', 'execute-scene-script', {
                    name: packageJSON.name,
                    method: 'buildBubbleStageSelect',
                    args: [],
                }));
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                await showWarning(`Failed to run StageSelect scene builder: ${message}`);
                return;
            }
            if (!result) {
                await showWarning('Scene builder did not return a result. Check the Cocos Console for details.');
                return;
            }
            if (!result.ok) {
                await showWarning(result.warning ?? 'Build Bubble Stage Select stopped.');
                return;
            }
            const missing = result.missingAssets?.length
                ? ` Missing assets: ${result.missingAssets.join(', ')}.`
                : '';
            await showInfo(`Built StageSelect generated UI. Created ${result.createdNodes ?? 0} nodes.${missing} Press Ctrl + S to save the scene.`);
        },
    },
};
