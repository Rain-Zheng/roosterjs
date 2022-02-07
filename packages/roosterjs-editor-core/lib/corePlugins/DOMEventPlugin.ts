import { arrayPush, Browser, isCharacterValue } from 'roosterjs-editor-dom';
import {
    ChangeSource,
    ContextMenuProvider,
    DOMEventHandler,
    DOMEventPluginState,
    EditorOptions,
    EditorPlugin,
    IEditor,
    Keys,
    PluginEventType,
    PluginWithState,
} from 'roosterjs-editor-types';

/**
 * @internal
 * DOMEventPlugin handles customized DOM events, including:
 * 1. Keyboard event
 * 2. Mouse event
 * 3. IME state
 * 4. Drop event
 * 5. Focus and blur event
 * 6. Input event
 * 7. Scroll event
 * It contains special handling for Safari since Safari cannot get correct selection when onBlur event is triggered in editor.
 */
export default class DOMEventPlugin implements PluginWithState<DOMEventPluginState> {
    private editor: IEditor;
    private disposer: () => void;
    private state: DOMEventPluginState;

    /**
     * Construct a new instance of DOMEventPlugin
     * @param options The editor options
     * @param contentDiv The editor content DIV
     */
    constructor(options: EditorOptions, contentDiv: HTMLDivElement) {
        this.state = {
            isInIME: false,
            scrollContainer: options.scrollContainer || contentDiv,
            selectionRange: null,
            stopPrintableKeyboardEventPropagation: !options.allowKeyboardEventPropagation,
            contextMenuProviders:
                options.plugins?.filter<ContextMenuProvider<any>>(isContextMenuProvider) || [],
            tableSelectionRange: null,
        };
    }

    /**
     * Get a friendly name of  this plugin
     */
    getName() {
        return 'DOMEvent';
    }

    /**
     * Initialize this plugin. This should only be called from Editor
     * @param editor Editor instance
     */
    initialize(editor: IEditor) {
        this.editor = editor;

        const document = this.editor.getDocument();
        const eventHandlers: Record<string, DOMEventHandler> = {
            // 1. Keyboard event
            keypress: this.getEventHandler(PluginEventType.KeyPress),
            keydown: this.getEventHandler(PluginEventType.KeyDown),
            keyup: this.getEventHandler(PluginEventType.KeyUp),

            // 2. Mouse event
            mousedown: PluginEventType.MouseDown,
            contextmenu: this.onContextMenuEvent,

            // 3. IME state management
            compositionstart: () => (this.state.isInIME = true),
            compositionend: (rawEvent: CompositionEvent) => {
                this.state.isInIME = false;
                editor.triggerPluginEvent(PluginEventType.CompositionEnd, {
                    rawEvent,
                });
            },

            // 4. Drop event
            drop: this.onDrop,

            // 5. Focus management
            focus: this.onFocus,

            // 6. Input event
            [Browser.isIE ? 'textinput' : 'input']: this.getEventHandler(PluginEventType.Input),
        };

        // 7. onBlur handlers
        if (Browser.isSafari) {
            document.addEventListener('mousedown', this.onMouseDownDocument, true /*useCapture*/);
            document.addEventListener('keydown', this.onKeyDownDocument);
            document.defaultView?.addEventListener('blur', this.cacheSelection);
        } else {
            eventHandlers[Browser.isIEOrEdge ? 'beforedeactivate' : 'blur'] = this.cacheSelection;
        }

        this.disposer = editor.addDomEventHandler(eventHandlers);

        // 8. Scroll event
        this.state.scrollContainer.addEventListener('scroll', this.onScroll);
        document.defaultView?.addEventListener('scroll', this.onScroll);
        document.defaultView?.addEventListener('resize', this.onScroll);
    }

    /**
     * Dispose this plugin
     */
    dispose() {
        const document = this.editor.getDocument();
        if (Browser.isSafari) {
            document.removeEventListener(
                'mousedown',
                this.onMouseDownDocument,
                true /*useCapture*/
            );
            document.removeEventListener('keydown', this.onKeyDownDocument);
            document.defaultView?.removeEventListener('blur', this.cacheSelection);
        }

        document.defaultView?.removeEventListener('resize', this.onScroll);
        document.defaultView?.removeEventListener('scroll', this.onScroll);
        this.state.scrollContainer.removeEventListener('scroll', this.onScroll);
        this.disposer();
        this.disposer = null;
        this.editor = null;
    }

    /**
     * Get plugin state object
     */
    getState() {
        return this.state;
    }

    private onDrop = (e: UIEvent) => {
        this.editor.runAsync(editor => {
            editor.addUndoSnapshot(() => {}, ChangeSource.Drop);
        });
    };

    private onFocus = () => {
        this.editor.select(this.state.selectionRange);
        this.state.selectionRange = null;
    };
    private onKeyDownDocument = (event: KeyboardEvent) => {
        if (event.which == Keys.TAB && !event.defaultPrevented) {
            this.cacheSelection();
        }
    };

    private onMouseDownDocument = (event: MouseEvent) => {
        if (!this.state.selectionRange && !this.editor.contains(event.target as Node)) {
            this.cacheSelection();
        }
    };

    private cacheSelection = () => {
        if (!this.state.selectionRange) {
            this.state.selectionRange = this.editor.getSelectionRange(false /*tryGetFromCache*/);
        }
    };
    private onScroll = (e: UIEvent) => {
        this.editor.triggerPluginEvent(PluginEventType.Scroll, {
            rawEvent: e,
            scrollContainer: this.state.scrollContainer,
        });
    };

    private getEventHandler(eventType: PluginEventType): DOMEventHandler {
        return this.state.stopPrintableKeyboardEventPropagation
            ? {
                  pluginEventType: eventType,
                  beforeDispatch:
                      eventType == PluginEventType.Input ? this.onInputEvent : this.onKeyboardEvent,
              }
            : eventType;
    }

    private onKeyboardEvent = (event: KeyboardEvent) => {
        if (isCharacterValue(event)) {
            event.stopPropagation();
        }
    };

    private onInputEvent = (event: InputEvent) => {
        event.stopPropagation();
    };

    private onContextMenuEvent = (event: MouseEvent) => {
        const allItems: any[] = [];
        const searcher = this.editor.getContentSearcherOfCursor();
        const elementBeforeCursor = searcher?.getInlineElementBefore();

        let eventTargetNode = event.target as Node;
        if (event.button != 2) {
            eventTargetNode = elementBeforeCursor?.getContainerNode();
        }
        this.state.contextMenuProviders.forEach(provider => {
            const items = provider.getContextMenuItems(eventTargetNode);
            if (items?.length > 0) {
                if (allItems.length > 0) {
                    allItems.push(null);
                }
                arrayPush(allItems, items);
            }
        });
        this.editor.triggerPluginEvent(PluginEventType.ContextMenu, {
            rawEvent: event,
            items: allItems,
        });
    };
}

function isContextMenuProvider(source: EditorPlugin): source is ContextMenuProvider<any> {
    return !!(<ContextMenuProvider<any>>source)?.getContextMenuItems;
}
