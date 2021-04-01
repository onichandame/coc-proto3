import { TextDocument, Position, Range } from 'coc.nvim';

export const getWordAtPosition = (doc: TextDocument, pos: Position) => {
  const wordBoundary = /\W/;
  const firstHalfWords = doc.getText(Range.create(Position.create(pos.line, 0), pos)).split(wordBoundary);
  const secondHalfWords = doc
    .getText(Range.create(pos, Position.create(pos.line, Number.MAX_VALUE)))
    .split(wordBoundary);
  const firstHalfWordLength = firstHalfWords[firstHalfWords.length - 1].length;
  const secondHalfWordLength = secondHalfWords[secondHalfWords.length - 1].length;
  return doc.getText(
    Range.create(pos.line, pos.character - firstHalfWordLength, pos.line, pos.character + secondHalfWordLength)
  );
};
