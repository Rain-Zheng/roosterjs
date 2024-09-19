import { handleBlock, handleBlockAsync } from '../handlers/handleBlock';
import {
    handleBlockGroupChildren,
    handleBlockGroupChildrenAsync,
} from '../handlers/handleBlockGroupChildren';
import { handleBr } from '../handlers/handleBr';
import { handleDivider } from '../handlers/handleDivider';
import { handleEntityBlock, handleEntitySegment } from '../handlers/handleEntity';
import {
    handleFormatContainer,
    handleFormatContainerAsync,
} from '../handlers/handleFormatContainer';
import {
    handleGeneralBlock,
    handleGeneralBlockAsync,
    handleGeneralSegment,
} from '../handlers/handleGeneralModel';
import { handleImage } from '../handlers/handleImage';
import { handleList } from '../handlers/handleList';
import { handleListItem, handleListItemAsync } from '../handlers/handleListItem';
import { handleParagraph } from '../handlers/handleParagraph';
import { handleSegment } from '../handlers/handleSegment';
import { handleSegmentDecorator } from '../handlers/handleSegmentDecorator';
import { handleTable } from '../handlers/handleTable';
import { handleText } from '../handlers/handleText';
import type {
    AsyncContentModelHandlerMap,
    ContentModelHandlerMap,
} from 'roosterjs-content-model-types';

/**
 * @internal
 */
export const defaultContentModelHandlers: ContentModelHandlerMap = {
    block: handleBlock,
    blockGroupChildren: handleBlockGroupChildren,
    br: handleBr,
    entityBlock: handleEntityBlock,
    entitySegment: handleEntitySegment,
    generalBlock: handleGeneralBlock,
    generalSegment: handleGeneralSegment,
    divider: handleDivider,
    image: handleImage,
    list: handleList,
    listItem: handleListItem,
    paragraph: handleParagraph,
    formatContainer: handleFormatContainer,
    segment: handleSegment,
    segmentDecorator: handleSegmentDecorator,
    table: handleTable,
    text: handleText,
};

/**
 * @internal
 */
export const defaultAsyncContentModelHandlers: AsyncContentModelHandlerMap = {
    blockAsync: handleBlockAsync,
    blockGroupChildrenAsync: handleBlockGroupChildrenAsync,
    generalBlockAsync: handleGeneralBlockAsync,
    listItemAsync: handleListItemAsync,
    formatContainerAsync: handleFormatContainerAsync,
};
