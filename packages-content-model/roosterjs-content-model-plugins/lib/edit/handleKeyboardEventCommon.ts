import { normalizeContentModel } from 'roosterjs-content-model-dom';
import type {
    ContentModelDocument,
    DeleteResult,
    FormatWithContentModelContext,
    IStandaloneEditor,
} from 'roosterjs-content-model-types';

/**
 * @internal
 * @return True means content is changed, so need to rewrite content model to editor. Otherwise false
 */
export function handleKeyboardEventResult(
    editor: IStandaloneEditor,
    model: ContentModelDocument,
    rawEvent: KeyboardEvent | InputEvent,
    result: DeleteResult,
    context: FormatWithContentModelContext
): boolean {
    context.skipUndoSnapshot = true;
    context.clearModelCache = false;

    switch (result) {
        case 'notDeleted':
            // We have not delete anything, we will let browser handle this event, so that current cached model may be invalid
            context.clearModelCache = true;

            // Return false here since we didn't do any change to Content Model, so no need to rewrite with Content Model
            return false;

        case 'nothingToDelete':
            // We known there is nothing to delete, no need to let browser keep handling the event
            rawEvent.preventDefault();
            return false;

        case 'range':
        case 'singleChar':
            // We have deleted what we need from content model, no need to let browser keep handling the event
            rawEvent.preventDefault();
            normalizeContentModel(model);

            if (result == 'range') {
                // A range is about to be deleted, so add an undo snapshot immediately
                context.skipUndoSnapshot = false;
            }

            // Trigger an event to let plugins know the content is about to be changed by Content Model keyboard editing.
            // So plugins can do proper handling. e.g. UndoPlugin can decide whether take a snapshot before this change happens.
            editor.triggerEvent('beforeKeyboardEditing', {
                rawEvent: createCompatKeyboardEvent(rawEvent),
            });

            return true;
    }
}

/**
 * @internal
 */
export function shouldDeleteWord(rawEvent: KeyboardEvent | InputEvent, isMac: boolean) {
    if (rawEvent instanceof KeyboardEvent) {
        return (
            (isMac && rawEvent.altKey && !rawEvent.metaKey) ||
            (!isMac && rawEvent.ctrlKey && !rawEvent.altKey)
        );
    } else {
        return (
            rawEvent.inputType == 'deleteWordBackward' || rawEvent.inputType == 'deleteWordForward'
        );
    }
}

/**
 * @internal
 */
export function shouldDeleteAllSegmentsBefore(rawEvent: KeyboardEvent | InputEvent) {
    if (rawEvent instanceof KeyboardEvent) {
        return rawEvent.metaKey && !rawEvent.altKey;
    } else {
        return (
            rawEvent.inputType == 'deleteSoftLineBackward' ||
            rawEvent.inputType == 'deleteSoftLineForward'
        );
    }
}

/**
 * @internal
 */
export function isDeleteBefore(rawEvent: KeyboardEvent | InputEvent) {
    if (rawEvent instanceof KeyboardEvent) {
        return rawEvent.key == 'Backspace';
    } else {
        return (
            rawEvent.inputType == 'deleteContentBackward' ||
            rawEvent.inputType == 'deleteWordBackward' ||
            rawEvent.inputType == 'deleteSoftLineBackward'
        );
    }
}

/**
 * @internal
 */
export function isDeleteAfter(rawEvent: KeyboardEvent | InputEvent) {
    if (rawEvent instanceof KeyboardEvent) {
        return rawEvent.key == 'Delete';
    } else {
        return (
            rawEvent.inputType == 'deleteContentForward' ||
            rawEvent.inputType == 'deleteWordForward' ||
            rawEvent.inputType == 'deleteSoftLineForward'
        );
    }
}

function createCompatKeyboardEvent(rawEvent: KeyboardEvent | InputEvent): KeyboardEvent {
    if (rawEvent instanceof KeyboardEvent) {
        return rawEvent;
    } else {
        // For InputEvent, create a KeyboardEvent to be compatible with the beforeKeyboardEditing event
        const event = new KeyboardEvent('keydown', {
            key: isDeleteBefore(rawEvent) ? 'Backspace' : 'Delete',
            which: isDeleteBefore(rawEvent) ? 8 : 46,
        });
        return event;
    }
}
