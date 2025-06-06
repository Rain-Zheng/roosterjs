/**
 * Predefined experiment features
 * By default these features are not enabled. To enable them, pass the feature name into EditorOptions.experimentalFeatures
 * when create editor
 */
export type ExperimentalFeature =
    /**
     * When this feature is enabled, we will persist a content model in memory as long as we can,
     * and use cached element when write back if it is not changed.
     */
    | 'PersistCache'
    /**
     * @deprecated
     * Workaround for the Legacy Image Edit
     */
    | 'LegacyImageSelection'
    /**
     * @deprecated Please use the shouldHandleEnterKey option of the EditPlugin Options
     * Use Content Model handle ENTER key
     */
    | 'HandleEnterKey'
    /**
     *  Prevent default browser behavior for copy/cut event,
     *  and set the clipboard data with custom implementation.
     */
    | 'CustomCopyCut';
