import { exportContent, exportHTMLContentAsync } from 'roosterjs-content-model-core';
import { ModelToTextCallbacks } from 'roosterjs-content-model-types';
import type { RibbonButton } from 'roosterjs-react';

/**
 * Key of localized strings of Zoom button
 */
export type ExportButtonStringKey =
    | 'buttonNameExport'
    | 'menuNameExportHTML'
    | 'menuNameExportText';

const callbacks: ModelToTextCallbacks = {
    onImage: () => '[Image]',
};

/**
 * "Export content" button on the format ribbon
 */
export const exportContentButton: RibbonButton<ExportButtonStringKey> = {
    key: 'buttonNameExport',
    unlocalizedText: 'Export',
    iconName: 'Export',
    flipWhenRtl: true,
    dropDownMenu: {
        items: {
            menuNameExportHTML: 'as HTML',
            menuNameExportText: 'as Plain Text',
        },
    },
    onClick: (editor, key) => {
        if (key == 'menuNameExportHTML') {
            exportHTMLContentAsync(editor).then(content => {
                const win = editor.getDocument().defaultView.open();
                win.document.write(editor.getTrustedHTMLHandler()(content));
            });
        } else if (key == 'menuNameExportText') {
            const win = editor.getDocument().defaultView.open();
            const html = `<pre>${exportContent(editor, 'PlainText', callbacks)}</pre>`;
            win.document.write(editor.getTrustedHTMLHandler()(html));
        }
    },
    commandBarProperties: {
        buttonStyles: {
            icon: { paddingBottom: '10px' },
        },
    },
};
