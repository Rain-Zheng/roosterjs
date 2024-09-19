import { contentModelToDomAsync, createModelToDomContext } from 'roosterjs-content-model-dom';
import type {
    IEditor,
    ModelToDomOption,
    ModelToTextCallbacks,
} from 'roosterjs-content-model-types';

/**
 * Export html text asynchronously by processing content model blocks in batches
 * @param editor The editor to get content from
 * @param options @optional Options for Model to DOM conversion
 */
export async function exportHTMLContentAsync(
    editor: IEditor,
    optionsOrCallbacks?: ModelToDomOption | ModelToTextCallbacks
): Promise<string> {
    const model = editor.getContentModelCopy('clean');
    const doc = editor.getDocument();
    const div = doc.createElement('div');

    await contentModelToDomAsync(
        doc,
        div,
        model,
        createModelToDomContext(undefined /*editorContext*/, optionsOrCallbacks as ModelToDomOption)
    );

    editor.triggerEvent('extractContentWithDom', { clonedRoot: div }, true /*broadcast*/);

    return div.innerHTML;
}
