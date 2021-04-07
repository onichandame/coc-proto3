import { window, commands, workspace, languages, ExtensionContext } from 'coc.nvim';

import { PROTO3_MODE } from './proto3Mode';
import { Proto3CompletionItemProvider } from './proto3Suggest';
import { Proto3Compiler } from './proto3Compiler';
import { Proto3LanguageDiagnosticProvider } from './proto3Diagnostic';
import { Proto3Configuration } from './proto3Configuration';
import { Proto3DefinitionProvider } from './proto3Definition';

export async function activate(context: ExtensionContext): Promise<void> {
  context.subscriptions.push(
    languages.registerCompletionItemProvider(`proto3`, `proto3`, `proto`, new Proto3CompletionItemProvider(), ['.']),
    languages.registerDefinitionProvider([PROTO3_MODE], new Proto3DefinitionProvider()),
    commands.registerCommand(`proto3.compile.one`, async () => {
      const doc = (await workspace.getCurrentState()).document;
      const folder = workspace.getWorkspaceFolder(doc.uri);
      const compiler = new Proto3Compiler(folder);
      compiler.compileAProto(doc);
    }),
    commands.registerCommand(`proto3.compile.all`, async () => {
      const doc = (await workspace.getCurrentState()).document;
      const folder = workspace.getWorkspaceFolder(doc.uri);
      const compiler = new Proto3Compiler(folder);
      compiler.compileAllProtos();
    }),
  );
  workspace.onDidSaveTextDocument((doc) => {
    if (doc.languageId === `proto`) {
      const folder = workspace.getWorkspaceFolder(doc.uri);
      if (Proto3Configuration.Instance(folder).compileOnSave) {
        const diagnostics = new Proto3LanguageDiagnosticProvider();
        const compiler = new Proto3Compiler(folder);
        diagnostics.createDiagnostics(doc, compiler);
        compiler.compileAProto(doc);
      }
    }
  });
}
