import * as dom from 'roosterjs-editor-dom';
import CorePastePlugin from '../../lib/corePlugins/corePaste/CorePastePlugin';
import Editor from '../../lib/editor/Editor';
import { ClipboardData } from 'roosterjs-editor-types';

describe('CorePastePlugin', () => {
    let plugin: CorePastePlugin;
    let handler: (event: Event) => void;
    let paste: jasmine.Spy;
    let tempNode: HTMLElement = null;

    const addDomEventHandler = {
        default: (name: string, handlerParam: (event: Event) => void) => {
            handler = handlerParam;
            return () => {
                handler = null;
            };
        },
    };

    beforeEach(() => {
        handler = null;
        plugin = new CorePastePlugin();
        spyOn(addDomEventHandler, 'default').and.callThrough();
        paste = jasmine.createSpy('paste');

        plugin.initialize(<Editor>(<any>{
            addDomEventHandler: addDomEventHandler.default,
            paste,
            getSelectionRange: (): Range => null,
            getCustomData: (key: string, getter: () => any) => getter(),
            insertNode: (node: HTMLElement) => {
                tempNode = node;
                document.body.appendChild(node);
            },
            runAsync: (callback: () => void) => {
                if (tempNode) {
                    tempNode.innerHTML = 'test html';
                }
                callback();
            },
            getDocument: () => document,
            select: () => {},
        }));
    });

    afterEach(() => {
        plugin.dispose();
        if (tempNode) {
            tempNode.parentNode.removeChild(tempNode);
            tempNode = null;
        }
    });

    it('init and dispose', () => {
        expect(addDomEventHandler.default).toHaveBeenCalled();
        expect((<jasmine.Spy>addDomEventHandler.default).calls.argsFor(0)[0]).toBe('paste');
    });

    it('trigger paste event for html', () => {
        const items: ClipboardData = {
            rawHtml: '',
            text: '',
            image: null,
            types: [],
        };
        spyOn(dom, 'extractClipboardEvent').and.callFake((event, callback) => {
            callback(items);
        });

        handler(<any>{});
        expect(paste).toHaveBeenCalledWith(items);
        expect(tempNode).toBeNull();
    });

    it('trigger paste event for image', () => {
        const items: ClipboardData = {
            rawHtml: '',
            text: '',
            image: <any>{},
            types: [],
        };
        spyOn(dom, 'extractClipboardEvent').and.callFake((event, callback) => {
            callback(items);
        });
        spyOn(dom, 'readFile').and.callFake((file, callback) => {
            callback('dataurl');
        });

        handler(<any>{});
        expect(paste).toHaveBeenCalledWith({
            ...items,
            imageDataUri: 'dataurl',
        });
        expect(tempNode).toBeNull();
    });

    it('trigger paste, simulate IE behavioar', () => {
        const items: ClipboardData = {
            rawHtml: undefined,
            text: '',
            image: <any>{},
            types: [],
        };
        const expected = { ...items };
        spyOn(dom, 'extractClipboardEvent').and.callFake((event, callback) => {
            callback(items);
        });
        spyOn(dom, 'readFile').and.callFake((file, callback) => {
            callback('dataurl');
        });

        handler(<any>{});
        expect(paste).toHaveBeenCalledWith({
            ...expected,
            rawHtml: 'test html',
            imageDataUri: 'dataurl',
        });
        expect(tempNode).not.toBeNull();
        expect(tempNode.innerHTML).toBe('');
    });
});
