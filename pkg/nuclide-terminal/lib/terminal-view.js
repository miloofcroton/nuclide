/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */

import invariant from 'assert';
import {Emitter} from 'atom';
import {shell, clipboard} from 'electron';
import {
  observeAddedHostnames,
  observeRemovedHostnames,
} from 'nuclide-commons-atom/projects';
import {observableFromSubscribeFunction} from 'nuclide-commons/event';
import {Observable} from 'rxjs';
import url from 'url';
import {Terminal} from 'xterm';
import * as Fit from 'xterm/lib/addons/fit/fit';

import {getPtyServiceByNuclideUri} from './AtomServiceContainer';
import featureConfig from 'nuclide-commons-atom/feature-config';
import {ResizeObservable} from 'nuclide-commons-ui/observable-dom';
import performanceNow from 'nuclide-commons/performanceNow';
import {
  infoFromUri,
  uriFromInfo,
} from '../../commons-node/nuclide-terminal-uri';
import nuclideUri from 'nuclide-commons/nuclideUri';
import UniversalDisposable from 'nuclide-commons/UniversalDisposable';
import {track} from '../../nuclide-analytics';

import {removePrefixSink, patternCounterSink} from './sink';

import type {IconName} from 'nuclide-commons-ui/Icon';
import type {NuclideUri} from 'nuclide-commons/nuclideUri';
import type {Command, Pty, PtyClient, PtyInfo} from './pty-service/rpc-types';

import type {Sink} from './sink';

export const COLOR_CONFIGS = Object.freeze({
  // dark
  black: 'nuclide-terminal.black',
  red: 'nuclide-terminal.red',
  green: 'nuclide-terminal.green',
  blue: 'nuclide-terminal.blue',
  yellow: 'nuclide-terminal.yellow',
  cyan: 'nuclide-terminal.cyan',
  magenta: 'nuclide-terminal.magenta',
  white: 'nuclide-terminal.white',
  // bright
  brightBlack: 'nuclide-terminal.brightBlack',
  brightRed: 'nuclide-terminal.brightRed',
  brightGreen: 'nuclide-terminal.brightGreen',
  brightBlue: 'nuclide-terminal.brightBlue',
  brightYellow: 'nuclide-terminal.brightYellow',
  brightCyan: 'nuclide-terminal.brightCyan',
  brightMagenta: 'nuclide-terminal.brightMagenta',
  brightWhite: 'nuclide-terminal.brightWhite',
});
const PRESERVED_COMMANDS_CONFIG = 'nuclide-terminal.preservedCommands';
const SCROLLBACK_CONFIG = 'nuclide-terminal.scrollback';
const CURSOR_STYLE_CONFIG = 'nuclide-terminal.cursorStyle';
const CURSOR_BLINK_CONFIG = 'nuclide-terminal.cursorBlink';
const FONT_FAMILY_CONFIG = 'nuclide-terminal.fontFamily';
const FONT_SCALE_CONFIG = 'nuclide-terminal.fontScale';
const LINE_HEIGHT_CONFIG = 'nuclide-terminal.lineHeight';
const DOCUMENTATION_MESSAGE_CONFIG = 'nuclide-terminal.documentationMessage';
const ADD_ESCAPE_COMMAND = 'nuclide-terminal:add-escape-prefix';
const TMUX_CONTROLCONTROL_PREFIX = '\x1BP1000p';
export const URI_PREFIX = 'atom://nuclide-terminal-view';

export interface TerminalViewState {
  deserializer: 'TerminalView';
  paneUri: string;
}

type ProcessExitCallback = () => void;

export class TerminalView implements PtyClient {
  _paneUri: string;
  _cwd: ?NuclideUri;
  _path: ?NuclideUri;
  _command: ?Command;
  _useTitleAsPath: boolean;
  _title: string;
  _subscriptions: UniversalDisposable;
  _emitter: Emitter;
  _preservedCommands: Set<string>;
  _div: HTMLDivElement;
  _terminal: Object;
  _pty: ?Pty;
  _processOutput: Sink;
  _startTime: number;
  _bytesIn: number;
  _bytesOut: number;
  _focusStart: ?number;
  _focusDuration: number;
  _terminalInfo: nuclide$TerminalInfo;
  _processExitCallback: ProcessExitCallback;
  _isFirstOutput: boolean;
  _initialInput: string;

  constructor(paneUri: string) {
    if (Terminal.fit == null) {
      // The 'fit' add-on resizes the terminal based on the container size
      // and the font size such that the terminal fills the container.
      // Load the addon on-demand the first time we create a terminal.
      Terminal.applyAddon(Fit);
    }

    this._paneUri = paneUri;
    const info = infoFromUri(paneUri);
    this._terminalInfo = info;
    const cwd = (this._cwd = info.cwd == null ? null : info.cwd);
    this._command = info.command == null ? null : info.command;
    this._title = info.title == null ? 'terminal' : info.title;
    this._path = cwd;
    this._initialInput =
      info.initialInput == null ? '' : getSafeInitialInput(info.initialInput);
    this._processExitCallback = () => {};
    this._useTitleAsPath = false;

    this._startTime = performanceNow();
    this._bytesIn = 0;
    this._bytesOut = 0;
    this._focusStart = null;
    this._focusDuration = 0;
    this._isFirstOutput = true;

    const subscriptions = (this._subscriptions = new UniversalDisposable());
    this._processOutput = this._createOutputSink();

    this._emitter = new Emitter();
    subscriptions.add(this._emitter);

    subscriptions.add(
      featureConfig
        .observeAsStream(PRESERVED_COMMANDS_CONFIG)
        .subscribe((preserved: any) => {
          this._preservedCommands = new Set([
            ...(preserved || []),
            ...(info.preservedCommands || []),
          ]);
        }),
      atom.config.onDidChange('core.themes', this._syncAtomTheme.bind(this)),
      atom.themes.onDidChangeActiveThemes(this._syncAtomTheme.bind(this)),
    );

    subscriptions.add(
      // Skip the first value because the observe callback triggers once when
      // we begin observing, duplicating work in the constructor.
      ...Object.keys(COLOR_CONFIGS).map(color =>
        featureConfig
          .observeAsStream(COLOR_CONFIGS[color])
          .skip(1)
          .subscribe(this._syncAtomTheme.bind(this)),
      ),
    );

    const div = (this._div = document.createElement('div'));
    div.classList.add('terminal-pane');
    subscriptions.add(() => div.remove());

    const terminal = (this._terminal = new Terminal({
      cols: 512,
      rows: 512,
      cursorBlink: featureConfig.get(CURSOR_BLINK_CONFIG),
      cursorStyle: featureConfig.get(CURSOR_STYLE_CONFIG),
      scrollback: featureConfig.get(SCROLLBACK_CONFIG),
    }));
    (div: any).terminal = terminal;
    terminal.open(this._div);
    terminal.setHypertextLinkHandler(openLink);
    terminal.attachCustomKeyEventHandler(
      this._checkIfKeyBoundOrDivertToXTerm.bind(this),
    );
    this._subscriptions.add(() => terminal.destroy());
    registerLinkHandlers(terminal);

    if (featureConfig.get(DOCUMENTATION_MESSAGE_CONFIG)) {
      const docsUrl = 'https://nuclide.io/docs/features/terminal';
      terminal.writeln(`For more info check out the docs: ${docsUrl}`);
    }

    this._subscriptions.add(
      atom.commands.add(div, 'core:copy', () => {
        document.execCommand('copy');
      }),
      atom.commands.add(div, 'core:paste', () => {
        document.execCommand('paste');
      }),
      atom.commands.add(
        div,
        ADD_ESCAPE_COMMAND,
        this._addEscapePrefix.bind(this),
      ),
      atom.commands.add(div, 'nuclide-terminal:clear', this._clear.bind(this)),
      featureConfig
        .observeAsStream(CURSOR_STYLE_CONFIG)
        .skip(1)
        .subscribe(cursorStyle =>
          terminal.setOption('cursorStyle', cursorStyle),
        ),
      featureConfig
        .observeAsStream(CURSOR_BLINK_CONFIG)
        .skip(1)
        .subscribe(cursorBlink =>
          terminal.setOption('cursorBlink', cursorBlink),
        ),
      featureConfig
        .observeAsStream(SCROLLBACK_CONFIG)
        .skip(1)
        .subscribe(scrollback => terminal.setOption('scrollback', scrollback)),
      Observable.merge(
        observableFromSubscribeFunction(cb =>
          atom.config.onDidChange('editor.fontSize', cb),
        ),
        featureConfig.observeAsStream(FONT_SCALE_CONFIG).skip(1),
        featureConfig.observeAsStream(FONT_FAMILY_CONFIG).skip(1),
        featureConfig.observeAsStream(LINE_HEIGHT_CONFIG).skip(1),
        Observable.fromEvent(this._terminal, 'focus'),
        Observable.fromEvent(window, 'resize'),
        new ResizeObservable(this._div),
      ).subscribe(this._syncFontAndFit),
    );

    if (process.platform === 'win32') {
      // On Windows, add Putty-style highlight and right click to copy, right click to paste.
      this._subscriptions.add(
        Observable.fromEvent(div, 'contextmenu').subscribe(e => {
          // Note: Manipulating the clipboard directly because atom's core:copy and core:paste
          // commands are not working correctly with terminal selection.
          if (terminal.hasSelection()) {
            // $FlowFixMe: add types for clipboard
            clipboard.writeText(terminal.selectionManager.selectionText);
          } else {
            document.execCommand('paste');
          }
          terminal.selectionManager.clearSelection();
          terminal.focus();
          e.stopPropagation();
        }),
      );
    }

    if (cwd != null && nuclideUri.isRemote(cwd)) {
      this._subscriptions.add(
        observeRemovedHostnames().subscribe(hostname => {
          if (nuclideUri.getHostname(cwd) === hostname) {
            this._closeTab();
          }
        }),
      );
    }

    // div items don't support a 'focus' event, and we need to forward.
    (this._div: any).focus = () => terminal.focus();
    (this._div: any).blur = () => terminal.blur();

    this._spawn(cwd)
      .then(pty => this._onPtyFulfill(pty))
      .catch(error => this._onPtyFail(error));
  }

  _spawn(cwd: ?NuclideUri): Promise<Pty> {
    const command = this._command;
    const info: PtyInfo = {
      terminalType: 'xterm-256color',
      environment: this._terminalInfo.environmentVariables,
      ...(command == null ? {} : {command}),
    };
    const performSpawn = () => {
      this._setUseTitleAsPath(cwd);
      return getPtyServiceByNuclideUri(cwd).spawn(
        cwd != null ? {...info, cwd: nuclideUri.getPath(cwd)} : info,
        this,
      );
    };
    if (cwd == null || nuclideUri.isLocal(cwd)) {
      return performSpawn();
    } else {
      const cwdHostname = nuclideUri.getHostname(cwd);
      // Wait for the remote connection to be added before spawning.
      const hostnameAddedPromise = observeAddedHostnames()
        .filter(hostname => hostname === cwdHostname)
        .take(1)
        .toPromise();
      return hostnameAddedPromise.then(performSpawn);
    }
  }

  _setUseTitleAsPath(cwd: ?NuclideUri): void {
    getPtyServiceByNuclideUri(cwd)
      .useTitleAsPath(this)
      .then(value => (this._useTitleAsPath = value));
  }

  _onPtyFulfill(pty: Pty): void {
    invariant(this._pty == null);
    this._pty = pty;

    const now = performanceNow();
    this._focusStart = now;
    track('nuclide-terminal.started', {
      pane: this._paneUri,
      uri: this._cwd,
      startDelay: Math.round(now - this._startTime),
    });

    this._subscriptions.add(
      this.dispose.bind(this),
      Observable.fromEvent(this._terminal, 'data').subscribe(
        this._onInput.bind(this),
      ),
      Observable.fromEvent(this._terminal, 'title').subscribe(title => {
        this._setTitle(title);
        if (this._useTitleAsPath) {
          this._setPath(title);
        }
      }),
      Observable.interval(60 * 60 * 1000).subscribe(() =>
        track('nuclide-terminal.hourly', this._statistics()),
      ),
      Observable.fromEvent(this._terminal, 'focus').subscribe(
        this._focused.bind(this),
      ),
      Observable.fromEvent(this._terminal, 'blur').subscribe(
        this._blurred.bind(this),
      ),
    );
    this._syncFontAndFit();
  }

  _focused(): void {
    if (this._focusStart == null) {
      this._focusStart = performanceNow();
    }
  }

  _blurred(): void {
    const focusStart = this._focusStart;
    if (focusStart != null) {
      this._focusStart = null;
      this._focusDuration += performanceNow() - focusStart;
    }
  }

  _statistics(): Object {
    const now = performanceNow();
    const focusStart = this._focusStart;
    const focusDuration =
      this._focusDuration + (focusStart == null ? 0 : now - focusStart);
    const {query} = url.parse(this._paneUri, true);
    const id = query == null ? null : query.unique;

    return {
      id,
      uri: this._cwd,
      focusDuration: Math.round(focusDuration),
      duration: Math.round(now - this._startTime),
      bytesIn: this._bytesIn,
      bytesOut: this._bytesOut,
    };
  }

  _onPtyFail(error: Error) {
    this._terminal.writeln('Error starting process:');
    for (const line of String(error).split('\n')) {
      this._terminal.writeln(line);
    }
    track('nuclide-terminal.failed', {
      pane: this._paneUri,
      uri: this._cwd,
      startDelay: Math.round(performanceNow() - this._startTime),
      error: String(error),
    });
  }

  // Since changing the font settings may resize the contents, we have to
  // trigger a re-fit when updating font settings.
  _syncFontAndFit = (): void => {
    const scaledFont =
      parseFloat(featureConfig.get(FONT_SCALE_CONFIG)) *
      parseFloat(atom.config.get('editor.fontSize'));
    this._terminal.setOption('fontSize', scaledFont);
    this._terminal.setOption(
      'lineHeight',
      featureConfig.get(LINE_HEIGHT_CONFIG),
    );
    this._terminal.setOption(
      'fontFamily',
      featureConfig.get(FONT_FAMILY_CONFIG),
    );
    this._fitAndResize();
  };

  _fitAndResize(): void {
    // Force character measure before 'fit' runs.
    this._terminal.resize(this._terminal.cols, this._terminal.rows);
    this._terminal.fit();
    if (this._pty != null) {
      this._pty.resize(this._terminal.cols, this._terminal.rows);
    }
    this._syncAtomTheme();
    // documented workaround for https://github.com/xtermjs/xterm.js/issues/291
    // see https://github.com/Microsoft/vscode/commit/134cbec22f81d5558909040491286d72b547bee6
    this._terminal.emit('scroll', this._terminal.buffer.ydisp);
  }

  _syncAtomTheme(): void {
    const terminal = this._terminal;
    const div = this._div;
    terminal.setOption('theme', getTerminalTheme(div));
  }

  _clear(): void {
    this._terminal.clear();
  }

  _onInput(data: string): void {
    if (this._pty != null) {
      this._bytesIn += data.length;
      this._pty.writeInput(data);
    }
  }

  _setTitle(title: string) {
    this._title = title;
    this._emitter.emit('did-change-title', title);
  }

  _setPath(path: string) {
    this._path = path;
    this._emitter.emit('did-change-path', path);
  }

  _addEscapePrefix(event: Object): void {
    if (typeof event.originalEvent === 'object') {
      const keyEvent: Object = event.originalEvent;
      if (typeof keyEvent.key === 'string') {
        this._onInput(`\x1B${keyEvent.key}`);
      }
    }
  }

  _checkIfKeyBoundOrDivertToXTerm(event: Event): boolean {
    // Only allow input if we have somewhere to send it.
    if (this._pty == null) {
      return false;
    }

    const keystroke = atom.keymaps.keystrokeForKeyboardEvent(event);
    const bindings = atom.keymaps.findKeyBindings({
      keystrokes: keystroke,
      target: this._div,
    });
    const preserved = this._preservedCommands;

    if (
      preserved.has(ADD_ESCAPE_COMMAND) &&
      bindings.some(b => b.command === ADD_ESCAPE_COMMAND)
    ) {
      // Intercept the add escape binding and send escape directly, then
      // divert to xterm (to handle keys like Backspace).
      this._onInput('\x1B');
      return true;
    }

    const result = !bindings.some(b => preserved.has(b.command));
    // This facilitates debugging keystroke issues.  You can set a breakpoint
    // in the else block without stopping on modifier keys.
    if (
      keystroke === 'alt' ||
      keystroke === 'shift' ||
      keystroke === 'ctrl' ||
      keystroke === 'cmd'
    ) {
      return result;
    } else {
      return result;
    }
  }

  _createOutputSink(): Sink {
    let tmuxLines = 0;
    let lines = 0;
    let firstChar: ?string = null;
    let warned = false;
    return removePrefixSink(
      TMUX_CONTROLCONTROL_PREFIX,
      patternCounterSink(
        '\n%',
        n => ++tmuxLines < 2,
        patternCounterSink(
          '\n',
          n => ++lines < 2,
          data => {
            if (firstChar == null && data.length > 0) {
              firstChar = data.charAt(0);
            }
            if (
              firstChar === '%' &&
              tmuxLines === lines &&
              tmuxLines >= 2 &&
              !warned
            ) {
              warned = true;
              atom.notifications.addWarning('Tmux control protocol detected', {
                detail:
                  'The terminal output looks like you might be using tmux with -C or -CC.  ' +
                  'Nuclide terminal can be used with tmux, but not with the -C or -CC options.  ' +
                  'In your ~/.bashrc or similar, you can avoid invocations of tmux -C (or -CC) ' +
                  'in Nuclide terminal by checking:\n' +
                  '  if [ "$TERM_PROGRAM" != nuclide ]; then\n' +
                  '    tmux -C ...\n' +
                  '  fi',
                dismissable: true,
              });
            }
            this._terminal.write(data);
          },
        ),
      ),
    );
  }

  _closeTab(): void {
    const pane = atom.workspace.paneForItem(this);
    if (pane != null) {
      pane.destroyItem(this);
    }
  }

  onOutput(data: string): void {
    this._bytesOut += data.length;
    this._processOutput(data);

    if (this._isFirstOutput) {
      this._isFirstOutput = false;
      this._onInput(this._initialInput);
    }
  }

  onExit(code: number, signal: number): void {
    const terminal = this._terminal;
    track('nuclide-terminal.exit', {...this._statistics(), code, signal});

    if (code === 0 && !this._terminalInfo.remainOnCleanExit) {
      this._closeTab();
      return;
    }

    terminal.writeln('');
    terminal.writeln('');
    const command = this._terminalInfo.command;
    const process =
      command == null ? 'Process' : `${command.file} ${command.args.join(' ')}`;
    terminal.writeln(`${process} exited with error code '${code}'.`);
    if (signal !== 0) {
      terminal.writeln(`  killed by signal '${signal}'.`);
    }
    terminal.writeln('');

    this._disableTerminal();
  }

  _disableTerminal() {
    this.dispose();
    this._terminal.blur();

    // Disable terminal's ability to capture input once in error state.
    (this._div: any).focus = () => {};
    (this._div: any).blur = () => {};
  }

  setProcessExitCallback(callback: ProcessExitCallback): void {
    this._processExitCallback = callback;
  }

  terminateProcess(): void {
    if (this._pty != null) {
      this._disableTerminal();
      this._terminal.writeln('');
      this._terminal.writeln('Process terminated.');
      this._terminal.writeln('');
    }
  }

  copy(): TerminalView {
    const paneUri = uriFromInfo(this._terminalInfo);
    return new TerminalView(paneUri);
  }

  // Remote connection is closing--note the window remains open to show error
  // output if the process exit code was not 0.
  dispose(): void {
    if (this._pty != null) {
      this._pty.dispose();
      this._pty = null;
    }

    this._processExitCallback();
    this._processExitCallback = () => {};
  }

  // Window is closing, so close everything.
  destroy(): void {
    this._subscriptions.dispose();
  }

  getTitle(): string {
    return this._title;
  }

  getIconName(): IconName {
    return (this._terminalInfo.icon: any);
  }

  getURI(): string {
    return this._paneUri;
  }

  getDefaultLocation(): string {
    return this._terminalInfo.defaultLocation;
  }

  getElement(): any {
    return this._div;
  }

  getPath(): ?NuclideUri {
    return this._path;
  }

  onDidChangePath(callback: (v: ?string) => mixed): IDisposable {
    return this.on('did-change-path', callback);
  }

  onDidChangeTitle(callback: (v: ?string) => mixed): IDisposable {
    return this.on('did-change-title', callback);
  }

  on(name: string, callback: (v: any) => mixed): IDisposable {
    return this._emitter.on(name, callback);
  }

  serialize(): TerminalViewState {
    return {
      deserializer: 'TerminalView',
      paneUri: this._paneUri,
    };
  }
}

export function deserializeTerminalView(
  state: TerminalViewState,
): TerminalView {
  // Convert from/to uri to generate a new unique id.
  const info = infoFromUri(state.paneUri, true);
  const paneUri = uriFromInfo(info);
  return new TerminalView(paneUri);
}

function registerLinkHandlers(terminal: Terminal): void {
  const diffPattern = toString(
    featureConfig.get('atom-ide-console.diffUrlPattern'),
  );
  const taskPattern = toString(
    featureConfig.get('atom-ide-console.taskUrlPattern'),
  );
  const bindings = [
    {
      // Diff (e.g. 'D1234') with word boundary on either side.
      regex: /\bD[1-9][0-9]{3,}\b/,
      matchIndex: 0,
      urlPattern: diffPattern,
    },
    {
      // Paste (e.g. 'P1234') with word boundary on either side.
      regex: /\bP[1-9][0-9]{3,}\b/,
      matchIndex: 0,
      urlPattern: diffPattern,
    },
    {
      // Task (e.g. 't1234' or 'T1234') with word boundary on either side.
      // Note the [tT] is not included in the resulting URL.
      regex: /\b[tT]([1-9][0-9]{3,})\b/,
      matchIndex: 1,
      urlPattern: taskPattern,
    },
    {
      // Task (e.g. '#1234') preceded by beginning-of-line or whitespace and followed
      // by word boundary.  Unfortunately, since '#' is punctuation, the point before
      // it is not normally a word boundary, so this has to be registered separately.
      regex: /(^|\s)#([1-9][0-9]{3,})\b/,
      matchIndex: 2,
      urlPattern: taskPattern,
    },
  ];

  for (const {regex, matchIndex, urlPattern} of bindings) {
    terminal.linkifier.registerLinkMatcher(
      regex,
      (event, match) => {
        const replacedUrl = urlPattern.replace('%s', match);
        if (replacedUrl !== '') {
          shell.openExternal(replacedUrl);
        }
      },
      {matchIndex},
    );
  }
}

function openLink(event: Event, link: string): void {
  shell.openExternal(trimTrailingDot(link));
}

function trimTrailingDot(s: string): string {
  return s.endsWith('.') ? s.substring(0, s.length - 1) : s;
}

function toString(value: mixed): string {
  return typeof value === 'string' ? value : '';
}

// As a precaution, we should not let any undisplayable or potentially unsafe characters through
export function getSafeInitialInput(initialInput: string): string {
  for (let i = 0; i < initialInput.length; i++) {
    const code = initialInput.charCodeAt(i);
    // ASCII codes under 32 and 127 are control characters (potentially dangerous)
    // ASCII codes 128-165 are extended ASCII characters that have uses in other languages
    if (code < 32 || code === 127 || code > 165) {
      atom.notifications.addWarning(
        'Initial input for terminal unable to be prefilled',
        {
          detail: `Potentially malicious characters were found in the prefill command: ${initialInput}`,
          dismissable: true,
        },
      );
      return '';
    }
  }
  return initialInput;
}

function getTerminalColors(): {[$Keys<typeof COLOR_CONFIGS>]: string} {
  const colorsMap = {};
  for (const color of Object.keys(COLOR_CONFIGS)) {
    const configValue: ?(string | atom$Color) = (featureConfig.get(
      COLOR_CONFIGS[color],
    ): any);
    // config value may be string when Atom deserializes the terminal package
    // on startup, and it may be undefined if this is the first time the package
    // is being deserialized after the config was added.
    if (configValue != null) {
      if (typeof configValue === 'string') {
        colorsMap[color] = configValue;
      } else {
        colorsMap[color] = configValue.toHexString();
      }
    }
  }
  return colorsMap;
}

function getTerminalTheme(div: HTMLDivElement): any {
  const style = window.getComputedStyle(div);
  const foreground = convertRgbToHash(style.getPropertyValue('color'));
  const background = convertRgbToHash(
    style.getPropertyValue('background-color'),
  );
  // return type: https://git.io/vxooH
  return {
    foreground,
    background,
    cursor: foreground,
    ...getTerminalColors(),
  };
}

// Terminal only allows colors of the form '#rrggbb' or '#rgb' and falls back
// to black otherwise. https://git.io/vNE8a  :-(
const rgbRegex = / *rgb *\( *([0-9]+) *, *([0-9]+) *, *([0-9]+) *\) */;
function convertRgbToHash(rgb: string): string {
  const matches = rgb.match(rgbRegex);
  if (matches == null) {
    return rgb;
  }
  return (
    '#' +
    matches
      .slice(1, 4)
      .map(Number)
      .map(n => (n < 0x10 ? '0' : '') + n.toString(16))
      .join('')
  );
}
