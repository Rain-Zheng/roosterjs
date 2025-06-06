import {
    copyFormat,
    createBr,
    createParagraph,
    normalizeParagraph,
    ParagraphFormats,
    setParagraphNotImplicit,
} from 'roosterjs-content-model-dom';
import type {
    InsertPoint,
    ShallowMutableContentModelParagraph,
} from 'roosterjs-content-model-types';

/**
 * @internal
 * Split the given paragraph from insert point into two paragraphs,
 * and move the selection marker to the beginning of the second paragraph
 * @param insertPoint The input insert point which includes the paragraph and selection marker
 * @param formatKeys The format that needs to be copied from the splitted paragraph, if not specified,  some default format will be copied
 * @returns The new paragraph it created
 */
export function splitParagraph(insertPoint: InsertPoint) {
    const { paragraph, marker } = insertPoint;
    const newParagraph: ShallowMutableContentModelParagraph = createParagraph(
        false /*isImplicit*/,
        {},
        paragraph.segmentFormat
    );

    copyFormat(newParagraph.format, paragraph.format, ParagraphFormats);

    const markerIndex = paragraph.segments.indexOf(marker);
    const segments = paragraph.segments.splice(
        markerIndex,
        paragraph.segments.length - markerIndex
    );

    if (paragraph.segments.length == 0) {
        paragraph.segments.push(createBr(marker.format));
    }

    newParagraph.segments.push(...segments);

    setParagraphNotImplicit(paragraph);

    insertPoint.paragraph = newParagraph;

    normalizeParagraph(paragraph);

    return newParagraph;
}
