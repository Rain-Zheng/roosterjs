import type { RewriteFromModel } from '../context/RewriteFromModel';
import type { BasePluginEvent } from './BasePluginEvent';

/**
 * Provides a chance for plugin to change the content before it is pasted into editor.
 */
export interface EditorReadyEvent extends RewriteFromModel, BasePluginEvent<'editorReady'> {}
