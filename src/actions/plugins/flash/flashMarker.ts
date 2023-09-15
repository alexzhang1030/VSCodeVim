import { VimState } from '../../../state/vimState';
import { Match } from './flashMatch';
import * as vscode from 'vscode';
import { type DecorationOptions } from 'vscode';

let markerDecorations: MarkerDecoration[] = [];

export class MarkerDecoration {
  private textEditorDecorationType: vscode.TextEditorDecorationType;
  public range: vscode.Range;
  private editor: vscode.TextEditor;
  public label: string;
  constructor(range: vscode.Range, label: string, editor: vscode.TextEditor) {
    this.textEditorDecorationType = vscode.window.createTextEditorDecorationType({});
    this.range = range;
    this.editor = editor;
    this.label = label;
  }

  show() {
    this.editor.setDecorations(this.textEditorDecorationType, this.getRangesOrOptions());
  }

  dispose() {
    this.editor.setDecorations(this.textEditorDecorationType, []);
    this.textEditorDecorationType.dispose();
  }

  getJumpPosition() {
    return this.range.start;
  }

  getOperatorPosition(){
    return this.range.end;
  }

  setMarkerLabelBackgroundColor(backgroundColor: string) {
    this.markerLabelBackgroundColor = backgroundColor;
    this.show();
  }

  markEnterJump() {
    this.setMarkerLabelBackgroundColor('#ffb86c');
  }

  private markerLabelBackgroundColor: string = '#ccff88';
  private getRangesOrOptions(): DecorationOptions[] {
    const secondCharRenderOptions: vscode.ThemableDecorationInstanceRenderOptions = {
      before: {
        contentText: this.label,
        backgroundColor: this.markerLabelBackgroundColor,
        color: '#000000',
        margin: `0 -1ch 0 0; position: absolute;
            font-weight: normal;`,
        height: '100%',
      },
    };
    return [
      {
        range: this.range,
        renderOptions: { dark: secondCharRenderOptions, light: secondCharRenderOptions },
      },
    ];
  }
}

export function cleanAllFlashMarkerDecorations() {
  markerDecorations.forEach((marker) => {
    marker.dispose();
  });

  markerDecorations = [];
}

export function findMarkerDecorationByLabel(label: string) {
  return markerDecorations.find((m) => m.label === label);
}

export function getEnterJumpMarker(vimState: VimState) {
  const len = markerDecorations.length;
  for (let i = 0; i < len; i++) {
    const marker = markerDecorations[i];
    if (
      (marker.range.start.line === vimState.cursorStopPosition.line &&
        marker.range.start.character > vimState.cursorStopPosition.character) ||
      marker.range.start.line > vimState.cursorStopPosition.line
    ) {
      return marker;
    }
  }

  return markerDecorations[0];
}

export function createMarkerDecorations(
  matches: Match[],
  labels: string[],
  editor: vscode.TextEditor
) {
  markerDecorations = matches.map(({ range }, index) => {
    const label = labels[index] || '';
    const markerDecoration = new MarkerDecoration(range, label, editor);
    markerDecoration.show();
    return markerDecoration;
  });
}

export function createMarkerLabels(matches: Match[], vimState: VimState) {
  const nextSearchChatList = Array.from(
    new Set(
      matches.map(({ range }) => {
        return getNextSearchChat(range, vimState);
      })
    )
  )

  // TODO 下面这个需要可以通过配置来让用户设置
  return 'sklyuiopnm,qwertzxcvbahdgjf;'.split('').filter((s) => {

    return !nextSearchChatList.includes(s);
  });
}

function getNextSearchChat(range: vscode.Range, vimState: VimState) {
  const nextRange = new vscode.Range(
    range.end,
    new vscode.Position(range.end.line, range.end.character + 1)
  );
  return vimState.document.getText(nextRange).toLocaleLowerCase();
}