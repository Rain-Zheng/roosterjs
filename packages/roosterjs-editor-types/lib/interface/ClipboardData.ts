/**
 * An object contains all related data for pasting
 */
export default interface ClipboardData {
    /**
     * An editor content snapshot before pasting happens. This is used for changing paste format
     */
    snapshotBeforePaste: string;

    /**
     * Types of content included by the original onpaste event
     */
    types: string[];

    /**
     * If the copied data contains image format, this will be the image blob. Otherwise it is null.
     */
    image: File;

    /**
     * BASE64 encoded data uri of the image if any
     */
    imageDataUri: string;

    /**
     * If the copied data contains plain text format, this will be the plain text string. Otherwise it is null.
     */
    text: string;

    /**
     * If the copied data contains HTML format, this will be the original html string without any processing. Otherwise it is null.
     */
    rawHtml: string;
}