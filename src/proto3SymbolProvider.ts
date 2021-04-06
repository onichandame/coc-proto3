import { window, DocumentSymbolProvider, Location, Range, SymbolInformation } from 'coc.nvim';
import { tokenize } from 'protobufjs';

export class Proto3DocumentSymbolProvider implements DocumentSymbolProvider {
  constructor(private state: 'free' | 'rpc' | 'message' = 'free') {}

  provideDocumentSymbols: DocumentSymbolProvider['provideDocumentSymbols'] = (doc) => {
    window.showMessage(`hi symbol`);
    const ret: SymbolInformation[] = [];

    const tokenizer = tokenize(doc.getText(), false);
    while (true) {
      const tok = tokenizer.next();
      if (tok === null) {
        break;
      }

      switch (tok) {
        case 'message':
          this.state = 'message';
          break;

        case 'rpc':
          this.state = 'rpc';
          break;

        default:
          if (this.state === 'free') {
            continue;
          }

          if (!/^[a-zA-Z_]+\w*/.test(tok)) {
            // identifier expected but found other token
            this.state = 'free';
            continue;
          }

          const location = Location.create(
            doc.uri,
            Range.create(tokenizer.line - 1, 0, Number.MAX_VALUE, Number.MAX_VALUE)
          );
          const kind = this.state === 'message' ? 11 : 9;
          ret.push({ kind, location, name: tok });
          this.state = 'free';
          break;
      }
    }

    return ret;
  };
}
