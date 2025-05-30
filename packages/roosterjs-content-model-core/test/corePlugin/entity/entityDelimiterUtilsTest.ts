import * as adjustSelectionAroundEntity from '../../../lib/corePlugin/entity/adjustSelectionAroundEntity';
import * as DelimiterFile from '../../../lib/corePlugin/entity/entityDelimiterUtils';
import * as entityUtils from 'roosterjs-content-model-dom/lib/domUtils/entityUtils';
import * as isNodeOfType from 'roosterjs-content-model-dom/lib/domUtils/isNodeOfType';
import { ContentModelDocument, DOMSelection, IEditor } from 'roosterjs-content-model-types';
import {
    handleDelimiterContentChangedEvent,
    handleDelimiterKeyDownEvent,
} from '../../../lib/corePlugin/entity/entityDelimiterUtils';
import {
    contentModelToDom,
    createEntity,
    createModelToDomContext,
} from 'roosterjs-content-model-dom';

const ZeroWidthSpace = '\u200B';
const BlockEntityContainer = '_E_EBlockEntityContainer';

describe('EntityDelimiterUtils |', () => {
    let queryElementsSpy: jasmine.Spy;
    let formatContentModelSpy: jasmine.Spy;
    let mockedEditor: any;

    beforeEach(() => {
        queryElementsSpy = jasmine.createSpy('queryElement');

        mockedEditor = (<any>{
            getDOMHelper: () => ({
                queryElements: queryElementsSpy,
                isNodeInEditor: () => true,
            }),
            getPendingFormat: <any>((): any => null),
        }) as Partial<IEditor>;
    });

    describe('contentChanged |', () => {
        it('remove invalid delimiters', () => {
            const div = document.createElement('div');
            const entityWrapper = document.createElement('span');
            entityWrapper.style.width = '100%';
            entityWrapper.style.display = 'inline-block';

            contentModelToDom(
                document,
                div,
                {
                    blockGroupType: 'Document',
                    blocks: [
                        {
                            blockType: 'Entity',
                            entityFormat: {
                                isReadonly: true,
                                entityType: 'Test',
                                id: 'Id',
                            },
                            format: {},
                            segmentType: 'Entity',
                            wrapper: entityWrapper,
                        },
                    ],
                },
                createModelToDomContext({
                    addDelimiterForEntity: true,
                })
            );
            queryElementsSpy.and.callFake(sel => div.querySelectorAll(sel));

            entityWrapper.remove();

            handleDelimiterContentChangedEvent(mockedEditor);

            expect(queryElementsSpy).toHaveBeenCalledTimes(2);
            expect(div.firstElementChild?.childElementCount).toEqual(0);
        });

        it('add delimiters', () => {
            const div = document.createElement('div');
            const entityWrapper = document.createElement('span');
            entityWrapper.style.width = '100%';
            entityWrapper.style.display = 'inline-block';

            contentModelToDom(
                document,
                div,
                {
                    blockGroupType: 'Document',
                    blocks: [
                        {
                            blockType: 'Entity',
                            entityFormat: {
                                isReadonly: true,
                                entityType: 'Test',
                                id: 'Id',
                            },
                            format: {},
                            segmentType: 'Entity',
                            wrapper: entityWrapper,
                        },
                    ],
                },
                createModelToDomContext({})
            );
            queryElementsSpy.and.callFake(sel => div.querySelectorAll(sel));

            handleDelimiterContentChangedEvent(mockedEditor);

            expect(queryElementsSpy).toHaveBeenCalledTimes(2);
            expect(entityWrapper.parentElement!.childElementCount).toEqual(3);
        });

        it('Remove delimiter info', () => {
            const div = document.createElement('div');
            const entityWrapper = document.createElement('span');
            entityWrapper.style.width = '100%';
            entityWrapper.style.display = 'inline-block';

            contentModelToDom(
                document,
                div,
                {
                    blockGroupType: 'Document',
                    blocks: [
                        {
                            blockType: 'Entity',
                            entityFormat: {
                                isReadonly: true,
                                entityType: 'Test',
                                id: 'Id',
                            },
                            format: {},
                            segmentType: 'Entity',
                            wrapper: entityWrapper,
                        },
                    ],
                },
                createModelToDomContext({
                    addDelimiterForEntity: true,
                })
            );
            queryElementsSpy.and.callFake(sel => div.querySelectorAll(sel));

            const invalidDelimiter = entityWrapper.previousElementSibling;
            invalidDelimiter?.appendChild(document.createTextNode('_'));

            handleDelimiterContentChangedEvent(mockedEditor);

            expect(queryElementsSpy).toHaveBeenCalledTimes(2);
            expect(entityWrapper.parentElement!.childElementCount).toEqual(4);
            expect(
                invalidDelimiter && entityUtils.isEntityDelimiter(<any>invalidDelimiter)
            ).toBeFalsy();
        });
    });

    describe('onKeyDown |', () => {
        let mockedSelection: DOMSelection;
        let rafSpy: jasmine.Spy;
        let takeSnapshotSpy: jasmine.Spy;
        let triggerEventSpy: jasmine.Spy;
        let findClosestElementAncestorSpy: jasmine.Spy;

        beforeEach(() => {
            mockedSelection = undefined!;
            rafSpy = jasmine.createSpy('requestAnimationFrame');
            formatContentModelSpy = jasmine.createSpy('formatContentModel');
            takeSnapshotSpy = jasmine.createSpy('takeSnapshot');
            triggerEventSpy = jasmine.createSpy('triggerEvent');
            findClosestElementAncestorSpy = jasmine
                .createSpy('findClosestElementAncestor')
                .and.callFake((node: HTMLElement, selector: string) => node.closest(selector));

            mockedEditor = (<any>{
                getDOMSelection: () => mockedSelection,
                getDocument: () =>
                    <any>{
                        defaultView: {
                            requestAnimationFrame: rafSpy,
                        },
                    },
                formatContentModel: formatContentModelSpy,
                getDOMHelper: () => ({
                    queryElements: queryElementsSpy,
                    isNodeInEditor: () => true,
                    findClosestElementAncestor: findClosestElementAncestorSpy,
                }),
                triggerEvent: triggerEventSpy,
                takeSnapshot: takeSnapshotSpy,
            }) as Partial<IEditor>;
            spyOn(DelimiterFile, 'preventTypeInDelimiter').and.callThrough();
        });

        it('Dont handle, no selection', () => {
            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'A',
                },
            });

            expect(rafSpy).not.toHaveBeenCalled();
            expect(DelimiterFile.preventTypeInDelimiter).not.toHaveBeenCalled();
        });

        it('Dont handle, image selection', () => {
            mockedSelection = <any>{
                type: 'image',
            };

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'A',
                },
            });

            expect(rafSpy).not.toHaveBeenCalled();
            expect(DelimiterFile.preventTypeInDelimiter).not.toHaveBeenCalled();
        });

        it('Dont handle, table selection', () => {
            mockedSelection = <any>{
                type: 'table',
            };

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'A',
                },
            });

            expect(rafSpy).not.toHaveBeenCalled();
            expect(DelimiterFile.preventTypeInDelimiter).not.toHaveBeenCalled();
        });

        it('Dont handle, range selection & no delimiter & no entity', () => {
            const parent = document.createElement('span');
            const el = document.createElement('span');
            const text = document.createTextNode('span');
            el.appendChild(text);
            parent.appendChild(el);
            el.classList.add('entityDelimiterBefore');
            mockedSelection = {
                type: 'range',
                range: <any>{
                    endContainer: text,
                    endOffset: 0,
                    collapsed: true,
                },
                isReverted: false,
            };
            spyOn(entityUtils, 'isEntityDelimiter').and.returnValue(false);
            spyOn(entityUtils, 'isEntityElement').and.returnValue(false);

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'A',
                },
            });

            expect(rafSpy).not.toHaveBeenCalled();
            expect(DelimiterFile.preventTypeInDelimiter).not.toHaveBeenCalled();
        });

        it('Handle, range selection & delimiter', () => {
            const parent = document.createElement('span');
            const el = document.createElement('span');
            const text = document.createTextNode('span');
            el.appendChild(text);
            parent.appendChild(el);
            el.classList.add('entityDelimiterBefore');
            mockedSelection = {
                type: 'range',
                range: <any>{
                    endContainer: text,
                    endOffset: 0,
                    collapsed: true,
                },
                isReverted: false,
            };
            spyOn(entityUtils, 'isEntityDelimiter').and.returnValue(true);
            spyOn(entityUtils, 'isEntityElement').and.returnValue(false);

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'A',
                },
            });

            expect(rafSpy).toHaveBeenCalled();
            expect(takeSnapshotSpy).toHaveBeenCalled();
        });

        it('Handle, range selection on upper container & delimiter', () => {
            const parent = document.createElement('span');
            const el = document.createElement('span');
            const text = document.createTextNode('span');
            el.appendChild(text);
            parent.appendChild(el);
            el.classList.add('entityDelimiterBefore');
            mockedSelection = {
                type: 'range',
                range: <any>{
                    endContainer: parent,
                    endOffset: 1,
                    collapsed: true,
                },
                isReverted: false,
            };
            spyOn(entityUtils, 'isEntityDelimiter').and.returnValue(true);
            spyOn(entityUtils, 'isEntityElement').and.returnValue(false);

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'A',
                },
            });

            expect(rafSpy).toHaveBeenCalled();
            expect(takeSnapshotSpy).toHaveBeenCalled();
        });

        it('Handle, range selection & delimiter before wrapped in block entity', () => {
            const div = document.createElement('div');
            const parent = document.createElement('span');
            const el = document.createElement('span');
            const text = document.createTextNode('span');
            el.appendChild(text);
            parent.appendChild(el);
            el.classList.add('entityDelimiterBefore');
            div.classList.add(BlockEntityContainer);
            div.appendChild(parent);

            const setStartBeforeSpy = jasmine.createSpy('setStartBeforeSpy');
            const setStartAfterSpy = jasmine.createSpy('setStartAfterSpy');
            const collapseSpy = jasmine.createSpy('collapseSpy');
            const preventDefaultSpy = jasmine.createSpy('preventDefaultSpy');

            mockedSelection = {
                type: 'range',
                range: <any>{
                    endContainer: text,
                    endOffset: 0,
                    collapsed: true,
                    setStartAfter: setStartAfterSpy,
                    setStartBefore: setStartBeforeSpy,
                    collapse: collapseSpy,
                },
                isReverted: false,
            };
            spyOn(entityUtils, 'isEntityDelimiter').and.returnValue(true);
            spyOn(entityUtils, 'isEntityElement').and.returnValue(false);

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'A',
                    preventDefault: preventDefaultSpy,
                },
            });

            expect(rafSpy).not.toHaveBeenCalled();
            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(setStartAfterSpy).not.toHaveBeenCalled();
            expect(setStartBeforeSpy).toHaveBeenCalled();
            expect(collapseSpy).toHaveBeenCalled();
            expect(formatContentModelSpy).toHaveBeenCalledWith(
                DelimiterFile.handleKeyDownInBlockDelimiter,
                {
                    selectionOverride: mockedSelection,
                }
            );
        });

        it('Handle, range selection & delimiter after wrapped in block entity', () => {
            const div = document.createElement('div');
            const parent = document.createElement('span');
            const el = document.createElement('span');
            const text = document.createTextNode('span');
            el.appendChild(text);
            parent.appendChild(el);
            el.classList.add('entityDelimiterAfter');
            div.classList.add(BlockEntityContainer);
            div.appendChild(parent);

            const setStartBeforeSpy = jasmine.createSpy('setStartBeforeSpy');
            const setStartAfterSpy = jasmine.createSpy('setStartAfterSpy');
            const collapseSpy = jasmine.createSpy('collapseSpy');
            const preventDefaultSpy = jasmine.createSpy('preventDefaultSpy');

            mockedSelection = {
                type: 'range',
                range: <any>{
                    endContainer: text,
                    endOffset: 0,
                    collapsed: true,
                    setStartAfter: setStartAfterSpy,
                    setStartBefore: setStartBeforeSpy,
                    collapse: collapseSpy,
                },
                isReverted: false,
            };
            spyOn(entityUtils, 'isEntityDelimiter').and.returnValue(true);
            spyOn(entityUtils, 'isEntityElement').and.returnValue(false);

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'A',
                    preventDefault: preventDefaultSpy,
                },
            });

            expect(rafSpy).not.toHaveBeenCalled();
            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(setStartAfterSpy).toHaveBeenCalled();
            expect(setStartBeforeSpy).not.toHaveBeenCalled();
            expect(collapseSpy).toHaveBeenCalled();
            expect(formatContentModelSpy).toHaveBeenCalledWith(
                DelimiterFile.handleKeyDownInBlockDelimiter,
                {
                    selectionOverride: mockedSelection,
                }
            );
        });

        it('Handle, range selection & delimiter before wrapped in block entity | Enter Key', () => {
            const div = document.createElement('div');
            const parent = document.createElement('span');
            const el = document.createElement('span');
            const text = document.createTextNode('span');
            el.appendChild(text);
            parent.appendChild(el);
            el.classList.add('entityDelimiterBefore');
            div.classList.add(BlockEntityContainer);
            div.appendChild(parent);

            const setStartBeforeSpy = jasmine.createSpy('setStartBeforeSpy');
            const setStartAfterSpy = jasmine.createSpy('setStartAfterSpy');
            const collapseSpy = jasmine.createSpy('collapseSpy');
            const preventDefaultSpy = jasmine.createSpy('preventDefaultSpy');

            mockedSelection = {
                type: 'range',
                range: <any>{
                    endContainer: text,
                    endOffset: 0,
                    collapsed: true,
                    setStartAfter: setStartAfterSpy,
                    setStartBefore: setStartBeforeSpy,
                    collapse: collapseSpy,
                },
                isReverted: false,
            };
            spyOn(entityUtils, 'isEntityDelimiter').and.returnValue(true);
            spyOn(entityUtils, 'isEntityElement').and.returnValue(false);

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'Enter',
                    preventDefault: preventDefaultSpy,
                },
            });

            expect(rafSpy).not.toHaveBeenCalled();
            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(setStartAfterSpy).not.toHaveBeenCalled();
            expect(setStartBeforeSpy).toHaveBeenCalled();
            expect(collapseSpy).toHaveBeenCalled();
            expect(formatContentModelSpy).toHaveBeenCalledWith(
                DelimiterFile.handleKeyDownInBlockDelimiter,
                {
                    selectionOverride: mockedSelection,
                }
            );
        });

        it('Handle, range selection & delimiter after wrapped in block entity | Enter key', () => {
            const div = document.createElement('div');
            const parent = document.createElement('span');
            const el = document.createElement('span');
            const text = document.createTextNode('span');
            el.appendChild(text);
            parent.appendChild(el);
            el.classList.add('entityDelimiterAfter');
            div.classList.add(BlockEntityContainer);
            div.appendChild(parent);

            const setStartBeforeSpy = jasmine.createSpy('setStartBeforeSpy');
            const setStartAfterSpy = jasmine.createSpy('setStartAfterSpy');
            const collapseSpy = jasmine.createSpy('collapseSpy');
            const preventDefaultSpy = jasmine.createSpy('preventDefaultSpy');

            mockedSelection = {
                type: 'range',
                range: <any>{
                    endContainer: text,
                    endOffset: 0,
                    collapsed: true,
                    setStartAfter: setStartAfterSpy,
                    setStartBefore: setStartBeforeSpy,
                    collapse: collapseSpy,
                },
                isReverted: false,
            };
            spyOn(entityUtils, 'isEntityDelimiter').and.returnValue(true);
            spyOn(entityUtils, 'isEntityElement').and.returnValue(false);

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: <any>{
                    ctrlKey: false,
                    altKey: false,
                    metaKey: false,
                    key: 'Enter',
                    preventDefault: preventDefaultSpy,
                },
            });

            expect(rafSpy).not.toHaveBeenCalled();
            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(setStartAfterSpy).toHaveBeenCalled();
            expect(setStartBeforeSpy).not.toHaveBeenCalled();
            expect(collapseSpy).toHaveBeenCalled();
            expect(formatContentModelSpy).toHaveBeenCalledWith(
                DelimiterFile.handleKeyDownInBlockDelimiter,
                {
                    selectionOverride: mockedSelection,
                }
            );
        });

        it('Handle, range expanded selection | EnterKey', () => {
            const div = document.createElement('div');
            const parent = document.createElement('span');
            const el = document.createElement('span');
            const textSpan = document.createElement('span');
            const text = document.createTextNode('span');
            textSpan.appendChild(text);
            textSpan.classList.add('_Entity');
            el.appendChild(textSpan);
            parent.appendChild(el);
            el.classList.add('entityDelimiterAfter');
            div.classList.add(BlockEntityContainer);
            div.appendChild(parent);

            const setStartBeforeSpy = jasmine.createSpy('setStartBeforeSpy');
            const setStartAfterSpy = jasmine.createSpy('setStartAfterSpy');
            const collapseSpy = jasmine.createSpy('collapseSpy');
            const preventDefaultSpy = jasmine.createSpy('preventDefaultSpy');

            mockedSelection = {
                type: 'range',
                range: <any>{
                    endContainer: text,
                    endOffset: 0,
                    collapsed: false,
                    setStartAfter: setStartAfterSpy,
                    setStartBefore: setStartBeforeSpy,
                    collapse: collapseSpy,
                    startContainer: textSpan,
                },
                isReverted: false,
            };
            spyOn(entityUtils, 'isEntityElement').and.returnValue(true);
            spyOn(isNodeOfType, 'isNodeOfType').and.returnValue(true);
            spyOn(mockedEditor, 'getDOMSelection').and.returnValue({
                type: 'range',
                range: mockedSelection.range,
            });
            spyOn(entityUtils, 'parseEntityFormat').and.returnValue({
                isReadonly: true,
                id: 'test',
                entityType: 'test',
            });
            spyOn(entityUtils, 'findClosestEntityWrapper').and.returnValue(textSpan);
            const mockedEvent = <any>{
                ctrlKey: false,
                altKey: false,
                metaKey: false,
                key: 'Enter',
                preventDefault: preventDefaultSpy,
            };

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: mockedEvent,
            });

            expect(rafSpy).not.toHaveBeenCalled();
            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(setStartAfterSpy).not.toHaveBeenCalled();
            expect(setStartBeforeSpy).not.toHaveBeenCalled();
            expect(collapseSpy).not.toHaveBeenCalled();
            expect(triggerEventSpy).toHaveBeenCalledWith('entityOperation', {
                operation: 'click',
                entity: {
                    id: 'test',
                    type: 'test',
                    isReadonly: true,
                    wrapper: textSpan,
                },
                rawEvent: mockedEvent,
            });
        });

        it('Handle, range selection | ArrowLeft Key', () => {
            mockedSelection = {
                type: 'range',
                range: <any>{
                    collapsed: true,
                },
                isReverted: false,
            };
            spyOn(mockedEditor, 'getDOMSelection').and.returnValue({
                type: 'range',
                range: mockedSelection.range,
            });
            const adjustSelectionAroundEntitySpy = spyOn(
                adjustSelectionAroundEntity,
                'adjustSelectionAroundEntity'
            );

            const mockedEvent = <any>{
                ctrlKey: false,
                altKey: false,
                metaKey: false,
                shiftKey: false,
                key: 'ArrowLeft',
            };

            rafSpy.and.callFake((callback: Function) => callback());

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: mockedEvent,
            });

            expect(adjustSelectionAroundEntitySpy).toHaveBeenCalledWith(
                mockedEditor,
                'ArrowLeft',
                false
            );
        });

        it('Do not Handle, range selection | Ctrl+ArrowLeft Key', () => {
            mockedSelection = {
                type: 'range',
                range: <any>{
                    collapsed: true,
                },
                isReverted: false,
            };
            spyOn(mockedEditor, 'getDOMSelection').and.returnValue({
                type: 'range',
                range: mockedSelection.range,
            });
            const adjustSelectionAroundEntitySpy = spyOn(
                adjustSelectionAroundEntity,
                'adjustSelectionAroundEntity'
            );

            const mockedEvent = <any>{
                ctrlKey: true,
                altKey: false,
                metaKey: false,
                shiftKey: false,
                key: 'ArrowLeft',
            };

            rafSpy.and.callFake((callback: Function) => callback());

            handleDelimiterKeyDownEvent(mockedEditor, {
                eventType: 'keyDown',
                rawEvent: mockedEvent,
            });

            expect(adjustSelectionAroundEntitySpy).not.toHaveBeenCalled();
        });
    });
});

describe('preventTypeInDelimiter', () => {
    let mockedEditor: any;
    let mockedModel: ContentModelDocument;
    let context: any;

    beforeEach(() => {
        context = {};

        mockedModel = {
            blockGroupType: 'Document',
            blocks: [],
        };
        mockedEditor = {
            formatContentModel: formatter => {
                formatter(mockedModel, context);
            },
        } as Partial<IEditor>;
    });

    it('handle delimiter after entity', () => {
        const entityWrapper = document.createElement('span');
        entityWrapper.className = BlockEntityContainer;

        mockedModel = {
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        createEntity(entityWrapper, true),
                        {
                            segmentType: 'Text',
                            format: {},
                            text: 'a' + ZeroWidthSpace,
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        };

        const root = document.createElement('div');
        contentModelToDom(
            document,
            root,
            mockedModel,
            createModelToDomContext({
                addDelimiterForEntity: true,
            })
        );

        DelimiterFile.preventTypeInDelimiter(
            entityWrapper.nextElementSibling as HTMLElement,
            mockedEditor
        );

        expect(mockedModel).toEqual({
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                isReadonly: true,
                                id: undefined,
                                entityType: undefined,
                            },
                            wrapper: entityWrapper,
                        },
                        {
                            segmentType: 'Text',
                            format: {},
                            text: 'a',
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        });
        expect(context).toEqual({
            skipUndoSnapshot: true,
        });
    });

    it('handle delimiter before entity', () => {
        const entityWrapper = document.createElement('span');
        entityWrapper.className = BlockEntityContainer;

        mockedModel = {
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Text',
                            format: {},
                            text: ZeroWidthSpace + 'Test',
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                        createEntity(entityWrapper, true),
                    ],
                    format: {},
                },
            ],
            format: {},
        };

        const root = document.createElement('div');
        contentModelToDom(
            document,
            root,
            mockedModel,
            createModelToDomContext({
                addDelimiterForEntity: true,
            })
        );

        DelimiterFile.preventTypeInDelimiter(
            entityWrapper.previousElementSibling as HTMLElement,
            mockedEditor
        );

        expect(mockedModel).toEqual({
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Text',
                            format: {},
                            text: 'Test',
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                isReadonly: true,
                                id: undefined,
                                entityType: undefined,
                            },
                            wrapper: entityWrapper,
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        });
        expect(context).toEqual({
            skipUndoSnapshot: true,
        });
    });
});

describe('handleKeyDownInBlockDelimiter', () => {
    it('handle after block entity', () => {
        const model: ContentModelDocument = {
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                    ],
                    format: {},
                },
                {
                    segmentType: 'Entity',
                    blockType: 'Entity',
                    format: {},
                    entityFormat: {
                        entityType: '',
                        isReadonly: false,
                    },
                    wrapper: <any>{},
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                    ],
                    format: {},
                    segmentFormat: {},
                    isImplicit: true,
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        };

        DelimiterFile.handleKeyDownInBlockDelimiter(model, <any>{});

        expect(model).toEqual({
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                    ],
                    format: {},
                },
                {
                    segmentType: 'Entity',
                    blockType: 'Entity',
                    format: {},
                    entityFormat: {
                        entityType: '',
                        isReadonly: false,
                    },
                    wrapper: jasmine.anything(),
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                    ],
                    format: {},
                    segmentFormat: {},
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        });
    });

    it('handle before block entity', () => {
        const model: ContentModelDocument = {
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                    ],
                    format: {},
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                    ],
                    format: {},
                    isImplicit: true,
                },
                {
                    segmentType: 'Entity',
                    blockType: 'Entity',
                    format: {},
                    entityFormat: {
                        entityType: '',
                        isReadonly: false,
                    },
                    wrapper: <any>{},
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        };

        DelimiterFile.handleKeyDownInBlockDelimiter(model, <any>{});

        expect(model).toEqual({
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                    ],
                    format: {},
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                    ],
                    format: {},
                    segmentFormat: {},
                },
                {
                    segmentType: 'Entity',
                    blockType: 'Entity',
                    format: {},
                    entityFormat: {
                        entityType: '',
                        isReadonly: false,
                    },
                    wrapper: jasmine.anything(),
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        });
    });
});

describe('handleEnterInlineEntity', () => {
    it('handle after entity', () => {
        const model: ContentModelDocument = {
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                entityType: '',
                                isReadonly: true,
                            },
                            wrapper: <any>{},
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        };

        const result = DelimiterFile.handleEnterInlineEntity(model, <any>{});

        expect(result).toBeTrue();
        expect(model).toEqual({
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                entityType: '',
                                isReadonly: true,
                            },
                            wrapper: jasmine.anything(),
                        },
                    ],
                    format: {},
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        });
    });

    it('handle after entity under list item', () => {
        const model: ContentModelDocument = {
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'BlockGroup',
                    blockGroupType: 'ListItem',
                    format: {},
                    formatHolder: {
                        format: {},
                        segmentType: 'SelectionMarker',
                    },
                    levels: [
                        {
                            dataset: {},
                            listType: 'UL',
                            format: {},
                        },
                    ],
                    blocks: [
                        {
                            blockType: 'Paragraph',
                            segments: [
                                {
                                    segmentType: 'Text',
                                    text: '_',
                                    format: {},
                                },
                                {
                                    segmentType: 'Entity',
                                    blockType: 'Entity',
                                    format: {},
                                    entityFormat: {
                                        entityType: '',
                                        isReadonly: true,
                                    },
                                    wrapper: <any>{},
                                },
                                {
                                    segmentType: 'SelectionMarker',
                                    isSelected: true,
                                    format: {},
                                },
                                {
                                    segmentType: 'Text',
                                    text: '_',
                                    format: {},
                                },
                            ],
                            format: {},
                        },
                    ],
                },
            ],
            format: {},
        };

        const result = DelimiterFile.handleEnterInlineEntity(model, <any>{});

        expect(result).toBeFalse();
        expect(model).toEqual({
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'BlockGroup',
                    blockGroupType: 'ListItem',
                    format: {},
                    formatHolder: {
                        format: {},
                        segmentType: 'SelectionMarker',
                    },
                    levels: [
                        {
                            dataset: {},
                            listType: 'UL',
                            format: {},
                        },
                    ],
                    blocks: [
                        {
                            blockType: 'Paragraph',
                            segments: [
                                {
                                    segmentType: 'Text',
                                    text: '_',
                                    format: {},
                                },
                                {
                                    segmentType: 'Entity',
                                    blockType: 'Entity',
                                    format: {},
                                    entityFormat: {
                                        entityType: '',
                                        isReadonly: true,
                                    },
                                    wrapper: <any>{},
                                },
                                {
                                    segmentType: 'SelectionMarker',
                                    isSelected: true,
                                    format: {},
                                },
                                {
                                    segmentType: 'Text',
                                    text: '_',
                                    format: {},
                                },
                            ],
                            format: {},
                        },
                    ],
                },
            ],
            format: {},
        });
    });

    it('handle before entity', () => {
        const model: ContentModelDocument = {
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                entityType: '',
                                isReadonly: true,
                            },
                            wrapper: <any>{},
                        },
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        };

        const result = DelimiterFile.handleEnterInlineEntity(model, <any>{});

        expect(result).toBeTrue();
        expect(model).toEqual({
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                    ],
                    format: {},
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                entityType: '',
                                isReadonly: true,
                            },
                            wrapper: jasmine.anything(),
                        },
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        });
    });

    it('handle before entity as first segment', () => {
        const model: ContentModelDocument = {
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                entityType: '',
                                isReadonly: true,
                            },
                            wrapper: <any>{},
                        },
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        };

        const result = DelimiterFile.handleEnterInlineEntity(model, <any>{});

        expect(result).toBeTrue();
        expect(model).toEqual({
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [],
                    format: {},
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                entityType: '',
                                isReadonly: true,
                            },
                            wrapper: jasmine.anything(),
                        },
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        });
    });

    it('handle after entity as last segment', () => {
        const model: ContentModelDocument = {
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },
                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                entityType: '',
                                isReadonly: true,
                            },
                            wrapper: <any>{},
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        };

        const result = DelimiterFile.handleEnterInlineEntity(model, <any>{});

        expect(result).toBeTrue();
        expect(model).toEqual({
            blockGroupType: 'Document',
            blocks: [
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Text',
                            text: '_',
                            format: {},
                        },

                        {
                            segmentType: 'Entity',
                            blockType: 'Entity',
                            format: {},
                            entityFormat: {
                                entityType: '',
                                isReadonly: true,
                            },
                            wrapper: jasmine.anything(),
                        },
                    ],

                    format: {},
                },
                {
                    blockType: 'Paragraph',
                    segments: [
                        {
                            segmentType: 'Br',
                            format: {},
                        },
                        {
                            segmentType: 'SelectionMarker',
                            isSelected: true,
                            format: {},
                        },
                    ],
                    format: {},
                },
            ],
            format: {},
        });
    });
});
