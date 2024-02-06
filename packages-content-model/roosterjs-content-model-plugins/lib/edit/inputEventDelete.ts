import { ChangeSource, deleteSelection } from 'roosterjs-content-model-core';
import { deleteAllSegmentBefore } from './deleteSteps/deleteAllSegmentBefore';
import { deleteList } from './deleteSteps/deleteList';
import { isNodeOfType } from 'roosterjs-content-model-dom';
import {
    handleKeyboardEventResult,
    shouldDeleteAllSegmentsBefore,
    shouldDeleteWord,
} from './handleKeyboardEventCommon';
import {
    backwardDeleteWordSelection,
    forwardDeleteWordSelection,
} from './deleteSteps/deleteWordSelection';
import {
    backwardDeleteCollapsedSelection,
    forwardDeleteCollapsedSelection,
} from './deleteSteps/deleteCollapsedSelection';
import type {
    DOMSelection,
    DeleteSelectionStep,
    IStandaloneEditor,
} from 'roosterjs-content-model-types';

/**
 * @internal
 * Do input event handling for deleteContent, deleteWord and deleteSoftLine types
 * @param editor The Content Model Editor
 * @param rawEvent DOM input event
 */
export function inputEventDelete(editor: IStandaloneEditor, rawEvent: InputEvent) {
    const selection = editor.getDOMSelection();

    if (shouldDeleteWithContentModel(selection, rawEvent)) {
        editor.formatContentModel(
            (model, context) => {
                const result = deleteSelection(
                    model,
                    getDeleteSteps(rawEvent, !!editor.getEnvironment().isMac),
                    context
                ).deleteResult;

                return handleKeyboardEventResult(editor, model, rawEvent, result, context);
            },
            {
                rawEvent,
                changeSource: ChangeSource.Keyboard,
                getChangeData: () => rawEvent.inputType,
                apiName: isDeleteAfter(rawEvent) ? 'handleDeleteKey' : 'handleBackspaceKey',
            }
        );

        return true;
    }
}

function getDeleteSteps(rawEvent: InputEvent, isMac: boolean): (DeleteSelectionStep | null)[] {
    const isForward = isDeleteAfter(rawEvent);
    const deleteAllSegmentBeforeStep =
        shouldDeleteAllSegmentsBefore(rawEvent) && !isForward ? deleteAllSegmentBefore : null;
    const deleteWordSelection = shouldDeleteWord(rawEvent, isMac)
        ? isForward
            ? forwardDeleteWordSelection
            : backwardDeleteWordSelection
        : null;
    const deleteCollapsedSelection = isForward
        ? forwardDeleteCollapsedSelection
        : backwardDeleteCollapsedSelection;
    const deleteListStep = !isForward ? deleteList : null;
    return [
        deleteAllSegmentBeforeStep,
        deleteWordSelection,
        deleteCollapsedSelection,
        deleteListStep,
    ];
}

function shouldDeleteWithContentModel(selection: DOMSelection | null, rawEvent: InputEvent) {
    if (!selection) {
        return false; // Nothing to delete
    } else if (selection.type != 'range' || !selection.range.collapsed) {
        return true; // Selection is not collapsed, need to delete all selections
    } else {
        const range = selection.range;

        // When selection is collapsed and is in middle of text node, no need to use Content Model to delete
        return !(
            isNodeOfType(range.startContainer, 'TEXT_NODE') &&
            (rawEvent.inputType == 'deleteContentForward' ||
                rawEvent.inputType == 'deleteContentBackward') &&
            (canDeleteBefore(rawEvent, range) || canDeleteAfter(rawEvent, range))
        );
    }
}

function canDeleteBefore(rawEvent: InputEvent, range: Range) {
    return isDeleteBefore(rawEvent) && range.startOffset > 1;
}

function canDeleteAfter(rawEvent: InputEvent, range: Range) {
    return (
        isDeleteAfter(rawEvent) &&
        range.startOffset < (range.startContainer.nodeValue?.length ?? 0) - 1
    );
}

function isDeleteBefore(rawEvent: InputEvent) {
    return (
        rawEvent.inputType == 'deleteContentBackward' ||
        rawEvent.inputType == 'deleteWordBackward' ||
        rawEvent.inputType == 'deleteSoftLineBackward'
    );
}

function isDeleteAfter(rawEvent: InputEvent) {
    return (
        rawEvent.inputType == 'deleteContentForward' ||
        rawEvent.inputType == 'deleteWordForward' ||
        rawEvent.inputType == 'deleteSoftLineForward'
    );
}
