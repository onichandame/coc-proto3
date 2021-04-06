import { window, workspace, languages, ExtensionContext } from 'coc.nvim';

import { PROTO3_MODE } from './proto3Mode';
import { Proto3CompletionItemProvider } from './proto3Suggest';
import { Proto3Compiler } from './proto3Compiler';
import { Proto3DefinitionProvider } from './proto3Definition';

export async function activate(context: ExtensionContext): Promise<void> {
  context.subscriptions.push(
    languages.registerCompletionItemProvider(`proto3`, `proto3`, `proto`, new Proto3CompletionItemProvider(), ['.']),
    languages.registerDefinitionProvider([PROTO3_MODE], new Proto3DefinitionProvider())
  );
  workspace.onDidSaveTextDocument((e) => {
    if (e.languageId === `proto`) {
      const folder = workspace.getWorkspaceFolder(e.uri);
    }
  });
}
