Object.defineProperty(exports, '__esModule', {
  value: true
});

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createDecoratedClass = (function () { function defineProperties(target, descriptors, initializers) { for (var i = 0; i < descriptors.length; i++) { var descriptor = descriptors[i]; var decorators = descriptor.decorators; var key = descriptor.key; delete descriptor.key; delete descriptor.decorators; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor || descriptor.initializer) descriptor.writable = true; if (decorators) { for (var f = 0; f < decorators.length; f++) { var decorator = decorators[f]; if (typeof decorator === 'function') { descriptor = decorator(target, key, descriptor) || descriptor; } else { throw new TypeError('The decorator for method ' + descriptor.key + ' is of the invalid type ' + typeof decorator); } } if (descriptor.initializer !== undefined) { initializers[key] = descriptor; continue; } } Object.defineProperty(target, key, descriptor); } } return function (Constructor, protoProps, staticProps, protoInitializers, staticInitializers) { if (protoProps) defineProperties(Constructor.prototype, protoProps, protoInitializers); if (staticProps) defineProperties(Constructor, staticProps, staticInitializers); return Constructor; }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

exports.activate = activate;
exports.serialize = serialize;
exports.deactivate = deactivate;
exports.consumeRegisterExecutor = consumeRegisterExecutor;
exports.consumeDebuggerProvider = consumeDebuggerProvider;
exports.consumeEvaluationExpressionProvider = consumeEvaluationExpressionProvider;
exports.consumeToolBar = consumeToolBar;
exports.consumeNotifications = consumeNotifications;
exports.provideRemoteControlService = provideRemoteControlService;
exports.consumeDatatipService = consumeDatatipService;
exports.consumeRegisterNuxService = consumeRegisterNuxService;
exports.consumeTriggerNuxService = consumeTriggerNuxService;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _commonsNodeUniversalDisposable2;

function _commonsNodeUniversalDisposable() {
  return _commonsNodeUniversalDisposable2 = _interopRequireDefault(require('../../commons-node/UniversalDisposable'));
}

var _rxjsBundlesRxMinJs2;

function _rxjsBundlesRxMinJs() {
  return _rxjsBundlesRxMinJs2 = require('rxjs/bundles/Rx.min.js');
}

var _assert2;

function _assert() {
  return _assert2 = _interopRequireDefault(require('assert'));
}

var _classnames2;

function _classnames() {
  return _classnames2 = _interopRequireDefault(require('classnames'));
}

var _atom2;

function _atom() {
  return _atom2 = require('atom');
}

var _nuclideAnalytics2;

function _nuclideAnalytics() {
  return _nuclideAnalytics2 = require('../../nuclide-analytics');
}

var _RemoteControlService2;

function _RemoteControlService() {
  return _RemoteControlService2 = _interopRequireDefault(require('./RemoteControlService'));
}

var _DebuggerModel2;

function _DebuggerModel() {
  return _DebuggerModel2 = _interopRequireDefault(require('./DebuggerModel'));
}

var _DebuggerDatatip2;

function _DebuggerDatatip() {
  return _DebuggerDatatip2 = require('./DebuggerDatatip');
}

var _reactForAtom2;

function _reactForAtom() {
  return _reactForAtom2 = require('react-for-atom');
}

var _DebuggerLaunchAttachUI2;

function _DebuggerLaunchAttachUI() {
  return _DebuggerLaunchAttachUI2 = require('./DebuggerLaunchAttachUI');
}

var _commonsNodeNuclideUri2;

function _commonsNodeNuclideUri() {
  return _commonsNodeNuclideUri2 = _interopRequireDefault(require('../../commons-node/nuclideUri'));
}

var _nuclideRemoteConnection2;

function _nuclideRemoteConnection() {
  return _nuclideRemoteConnection2 = require('../../nuclide-remote-connection');
}

var _commonsNodePassesGK2;

function _commonsNodePassesGK() {
  return _commonsNodePassesGK2 = _interopRequireDefault(require('../../commons-node/passesGK'));
}

var _nuclideUiPanelComponent2;

function _nuclideUiPanelComponent() {
  return _nuclideUiPanelComponent2 = require('../../nuclide-ui/PanelComponent');
}

var _nuclideDebuggerBase2;

function _nuclideDebuggerBase() {
  return _nuclideDebuggerBase2 = require('../../nuclide-debugger-base');
}

var _NewDebuggerView2;

function _NewDebuggerView() {
  return _NewDebuggerView2 = require('./NewDebuggerView');
}

var _DebuggerControllerView2;

function _DebuggerControllerView() {
  return _DebuggerControllerView2 = _interopRequireDefault(require('./DebuggerControllerView'));
}

var _commonsAtomRange2;

function _commonsAtomRange() {
  return _commonsAtomRange2 = require('../../commons-atom/range');
}

var DATATIP_PACKAGE_NAME = 'nuclide-debugger-datatip';
var GK_DEBUGGER_UI_REVAMP = 'nuclide_debugger_ui_revamp';
var NUX_NEW_DEBUGGER_UI_ID = 4377;
var GK_NEW_DEBUGGER_UI_NUX = 'mp_nuclide_new_debugger_ui';
var NUX_NEW_DEBUGGER_UI_NAME = 'nuclide_new_debugger_ui';

var DebuggerView = (function (_React$Component) {
  _inherits(DebuggerView, _React$Component);

  function DebuggerView(props) {
    _classCallCheck(this, DebuggerView);

    _get(Object.getPrototypeOf(DebuggerView.prototype), 'constructor', this).call(this, props);
    this.state = {
      showOldView: !props.useRevampedUi
    };
    this._toggleOldView = this._toggleOldView.bind(this);
  }

  _createClass(DebuggerView, [{
    key: '_getUiTypeForAnalytics',
    value: function _getUiTypeForAnalytics() {
      return this.state.showOldView ? 'chrome-devtools' : 'nuclide';
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this = this;

      (0, (_nuclideAnalytics2 || _nuclideAnalytics()).track)('debugger-ui-mounted', {
        frontend: this._getUiTypeForAnalytics()
      });
      // Wait for UI to initialize and "calm down"
      this._nuxTimeout = setTimeout(function () {
        if (activation != null && !_this.state.showOldView) {
          activation.tryTriggerNux(NUX_NEW_DEBUGGER_UI_ID);
        }
      }, 2000);
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      if (prevState.showOldView !== this.state.showOldView) {
        (0, (_nuclideAnalytics2 || _nuclideAnalytics()).track)('debugger-ui-toggled', {
          frontend: this._getUiTypeForAnalytics()
        });
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      if (this._nuxTimeout) {
        clearTimeout(this._nuxTimeout);
      }
    }
  }, {
    key: '_toggleOldView',
    value: function _toggleOldView() {
      this.setState({
        showOldView: !this.state.showOldView
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var model = this.props.model;
      var showOldView = this.state.showOldView;

      return (_reactForAtom2 || _reactForAtom()).React.createElement(
        (_nuclideUiPanelComponent2 || _nuclideUiPanelComponent()).PanelComponent,
        { initialLength: 500, dock: 'right' },
        (_reactForAtom2 || _reactForAtom()).React.createElement(
          'div',
          { className: 'nuclide-debugger-root' },
          (_reactForAtom2 || _reactForAtom()).React.createElement(
            'div',
            { className: (0, (_classnames2 || _classnames()).default)({ 'nuclide-debugger-container-old-enabled': showOldView }) },
            (_reactForAtom2 || _reactForAtom()).React.createElement((_DebuggerControllerView2 || _DebuggerControllerView()).default, {
              store: model.getStore(),
              bridge: model.getBridge(),
              actions: model.getActions(),
              breakpointStore: model.getBreakpointStore(),
              showOldView: showOldView,
              toggleOldView: this._toggleOldView
            })
          ),
          !showOldView ? (_reactForAtom2 || _reactForAtom()).React.createElement((_NewDebuggerView2 || _NewDebuggerView()).NewDebuggerView, {
            model: model,
            watchExpressionListStore: model.getWatchExpressionListStore()
          }) : null
        )
      );
    }
  }]);

  return DebuggerView;
})((_reactForAtom2 || _reactForAtom()).React.Component);

function createDebuggerView(model, useRevampedUi) {
  var elem = document.createElement('div');
  elem.className = 'nuclide-debugger-container';
  (_reactForAtom2 || _reactForAtom()).ReactDOM.render((_reactForAtom2 || _reactForAtom()).React.createElement(DebuggerView, {
    model: model,
    useRevampedUi: useRevampedUi
  }), elem);
  return elem;
}

var Activation = (function () {
  function Activation(state) {
    var _this2 = this;

    _classCallCheck(this, Activation);

    this._model = new (_DebuggerModel2 || _DebuggerModel()).default(state);
    this._panel = null;
    this._launchAttachDialog = null;
    this._disposables = new (_atom2 || _atom()).CompositeDisposable(this._model,
    // Listen for removed connections and kill the debugger if it is using that connection.
    (_nuclideRemoteConnection2 || _nuclideRemoteConnection()).ServerConnection.onDidCloseServerConnection(function (connection) {
      var debuggerProcess = _this2._model.getStore().getDebuggerInstance();
      if (debuggerProcess == null) {
        return; // Nothing to do if we're not debugging.
      }
      var debuggeeTargetUri = debuggerProcess.getTargetUri();
      if ((_commonsNodeNuclideUri2 || _commonsNodeNuclideUri()).default.isLocal(debuggeeTargetUri)) {
        return; // Nothing to do if our debug session is local.
      }
      if ((_commonsNodeNuclideUri2 || _commonsNodeNuclideUri()).default.getHostname(debuggeeTargetUri) === connection.getRemoteHostname()) {
        _this2._model.getActions().stopDebugging();
      }
    }),

    // Commands.
    atom.commands.add('atom-workspace', {
      'nuclide-debugger:toggle': this._toggleLaunchAttachDialog.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:show': this._show.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:hide': this._hide.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:continue-debugging': this._continue.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:stop-debugging': this._stop.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:step-over': this._stepOver.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:step-into': this._stepInto.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:step-out': this._stepOut.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:toggle-breakpoint': this._toggleBreakpoint.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:toggle-launch-attach': this._toggleLaunchAttachDialog.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:remove-all-breakpoints': this._deleteAllBreakpoints.bind(this)
    }), atom.commands.add('atom-workspace', {
      'nuclide-debugger:add-to-watch': this._addToWatch.bind(this)
    }),

    // Context Menu Items.
    atom.contextMenu.add({
      '.nuclide-debugger-breakpoint': [{
        label: 'Remove All Breakpoints',
        command: 'nuclide-debugger:remove-all-breakpoints'
      }],
      'atom-text-editor': [{ type: 'separator' }, {
        label: 'Debugger',
        submenu: [{
          label: 'Toggle Breakpoint',
          command: 'nuclide-debugger:toggle-breakpoint'
        }, {
          label: 'Add to Watch',
          command: 'nuclide-debugger:add-to-watch'
        }]
      }, { type: 'separator' }]
    }));
    this._hideLaunchAttachDialog = this._hideLaunchAttachDialog.bind(this);
    this._setupView();
  }

  _createDecoratedClass(Activation, [{
    key: '_setupView',
    value: _asyncToGenerator(function* () {
      var useRevampedUi = yield (0, (_commonsNodePassesGK2 || _commonsNodePassesGK()).default)(GK_DEBUGGER_UI_REVAMP);
      this._disposables.add(atom.views.addViewProvider((_DebuggerModel2 || _DebuggerModel()).default, function (model) {
        return createDebuggerView(model, useRevampedUi);
      }));
    })
  }, {
    key: 'serialize',
    value: function serialize() {
      var state = {
        breakpoints: this.getModel().getBreakpointStore().getSerializedBreakpoints()
      };
      return state;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._disposables.dispose();
      if (this._panel) {
        this._panel.destroy();
      }
    }
  }, {
    key: 'getModel',
    value: function getModel() {
      return this._model;
    }
  }, {
    key: 'consumeRegisterNuxService',
    value: function consumeRegisterNuxService(addNewNux) {
      var disposable = addNewNux(createDebuggerNuxTourModel());
      this._disposables.add(disposable);
      return disposable;
    }
  }, {
    key: 'setTriggerNux',
    value: function setTriggerNux(triggerNux) {
      this._tryTriggerNux = triggerNux;
    }
  }, {
    key: 'tryTriggerNux',
    value: function tryTriggerNux(id) {
      if (this._tryTriggerNux != null) {
        this._tryTriggerNux(id);
      }
    }
  }, {
    key: '_show',
    value: function _show() {
      this._getPanel().show();
    }
  }, {
    key: '_hide',
    value: function _hide() {
      this._getPanel().hide();
    }
  }, {
    key: '_continue',
    value: function _continue() {
      // TODO(jeffreytan): when we figured out the launch lifecycle story
      // we may bind this to start-debugging too.
      this._model.getBridge().continue();
    }
  }, {
    key: '_stop',
    value: function _stop() {
      this._model.getActions().stopDebugging();
    }
  }, {
    key: '_stepOver',
    value: function _stepOver() {
      this._model.getBridge().stepOver();
    }
  }, {
    key: '_stepInto',
    value: function _stepInto() {
      this._model.getBridge().stepInto();
    }
  }, {
    key: '_stepOut',
    value: function _stepOut() {
      this._model.getBridge().stepOut();
    }
  }, {
    key: '_toggleBreakpoint',
    decorators: [(0, (_nuclideAnalytics2 || _nuclideAnalytics()).trackTiming)('nuclide-debugger-atom:toggleBreakpoint')],
    value: function _toggleBreakpoint() {
      var editor = atom.workspace.getActiveTextEditor();
      if (editor && editor.getPath()) {
        var filePath = editor.getPath();
        if (filePath) {
          var line = editor.getLastCursor().getBufferRow();
          this._model.getActions().toggleBreakpoint(filePath, line);
        }
      }
    }
  }, {
    key: '_deleteAllBreakpoints',
    value: function _deleteAllBreakpoints() {
      var actions = this._model.getActions();
      actions.deleteAllBreakpoints();
    }
  }, {
    key: '_toggleLaunchAttachDialog',
    value: function _toggleLaunchAttachDialog() {
      var dialog = this._getLaunchAttachDialog();
      if (dialog.isVisible()) {
        dialog.hide();
      } else {
        dialog.show();
      }
    }
  }, {
    key: '_hideLaunchAttachDialog',
    value: function _hideLaunchAttachDialog() {
      var dialog = this._getLaunchAttachDialog();
      if (dialog.isVisible()) {
        dialog.hide();
      }
    }
  }, {
    key: '_getLaunchAttachDialog',
    value: function _getLaunchAttachDialog() {
      var _this3 = this;

      if (!this._launchAttachDialog) {
        var component = (_reactForAtom2 || _reactForAtom()).React.createElement((_DebuggerLaunchAttachUI2 || _DebuggerLaunchAttachUI()).DebuggerLaunchAttachUI, {
          store: this._model.getDebuggerProviderStore(),
          debuggerActions: this._model.getActions()
        });
        var host = document.createElement('div');
        (_reactForAtom2 || _reactForAtom()).ReactDOM.render(component, host);
        this._launchAttachDialog = atom.workspace.addModalPanel({
          item: host,
          visible: false });

        // Hide first so that caller can toggle it visible.
        this._disposables.add(new (_atom2 || _atom()).Disposable(function () {
          if (_this3._launchAttachDialog != null) {
            _this3._launchAttachDialog.destroy();
            _this3._launchAttachDialog = null;
          }
        }), atom.commands.add('atom-workspace', 'core:cancel', this._hideLaunchAttachDialog));
      }
      (0, (_assert2 || _assert()).default)(this._launchAttachDialog);
      return this._launchAttachDialog;
    }

    /**
     * Lazy panel creation.
     */
  }, {
    key: '_getPanel',
    value: function _getPanel() {
      if (!this._panel) {
        var panel = atom.workspace.addRightPanel({
          item: this._model,
          visible: false,
          // Move this left of the toolbar, when it is on the right.
          priority: 150
        });
        // Flow doesn't track non-null when assigning into nullable directly.
        this._panel = panel;
        return panel;
      } else {
        return this._panel;
      }
    }
  }, {
    key: '_addToWatch',
    value: function _addToWatch() {
      var editor = atom.workspace.getActiveTextEditor();
      if (!editor) {
        return;
      }
      var selectedText = editor.getTextInBufferRange((0, (_commonsAtomRange2 || _commonsAtomRange()).trimRange)(editor, editor.getSelectedBufferRange()));
      var expr = (0, (_commonsAtomRange2 || _commonsAtomRange()).wordAtPosition)(editor, editor.getCursorBufferPosition());

      var watchExpression = selectedText || expr && expr.wordMatch[0];
      if (watchExpression) {
        this._model.getActions().addWatchExpression(watchExpression);
      }
    }
  }]);

  return Activation;
})();

function createDatatipProvider() {
  if (datatipProvider == null) {
    datatipProvider = {
      // Eligibility is determined online, based on registered EvaluationExpression providers.
      validForScope: function validForScope(scope) {
        return true;
      },
      providerName: DATATIP_PACKAGE_NAME,
      inclusionPriority: 1,
      datatip: function datatip(editor, position) {
        if (activation == null) {
          return Promise.resolve(null);
        }
        var model = activation.getModel();
        return (0, (_DebuggerDatatip2 || _DebuggerDatatip()).debuggerDatatip)(model, editor, position);
      }
    };
  }
  return datatipProvider;
}

var activation = null;
var datatipProvider = undefined;

function activate(state) {
  if (!activation) {
    activation = new Activation(state);
  }
}

function serialize() {
  if (activation) {
    return activation.serialize();
  } else {
    return {
      breakpoints: null
    };
  }
}

function deactivate() {
  if (activation) {
    activation.dispose();
    activation = null;
  }
}

function registerConsoleExecutor(watchExpressionStore, registerExecutor) {
  var disposables = new (_atom2 || _atom()).CompositeDisposable();
  var rawOutput = new (_rxjsBundlesRxMinJs2 || _rxjsBundlesRxMinJs()).Subject();
  var send = function send(expression) {
    disposables.add(new (_commonsNodeUniversalDisposable2 || _commonsNodeUniversalDisposable()).default(
    // We filter here because the first value in the BehaviorSubject is null no matter what, and
    // we want the console to unsubscribe the stream after the first non-null value.
    watchExpressionStore.evaluateConsoleExpression(expression).filter(function (result) {
      return result != null;
    }).first().subscribe(function (result) {
      return rawOutput.next(result);
    })));
    watchExpressionStore._triggerReevaluation();
  };
  var output = rawOutput.map(function (result) {
    (0, (_assert2 || _assert()).default)(result != null);
    return { data: result };
  });
  disposables.add(registerExecutor({
    id: 'debugger',
    name: 'Debugger',
    send: send,
    output: output,
    getProperties: watchExpressionStore.getProperties.bind(watchExpressionStore)
  }));
  return disposables;
}

function consumeRegisterExecutor(registerExecutor) {
  if (activation != null) {
    var _ret = (function () {
      var model = activation.getModel();
      var register = function register() {
        return registerConsoleExecutor(model.getWatchExpressionStore(), registerExecutor);
      };
      model.getActions().addConsoleRegisterFunction(register);
      return {
        v: new (_atom2 || _atom()).Disposable(function () {
          return model.getActions().removeConsoleRegisterFunction(register);
        })
      };
    })();

    if (typeof _ret === 'object') return _ret.v;
  } else {
    return new (_atom2 || _atom()).Disposable();
  }
}

function consumeDebuggerProvider(provider) {
  if (activation) {
    activation.getModel().getActions().addDebuggerProvider(provider);
  }
  return new (_atom2 || _atom()).Disposable(function () {
    if (activation) {
      activation.getModel().getActions().removeDebuggerProvider(provider);
    }
  });
}

function consumeEvaluationExpressionProvider(provider) {
  if (activation) {
    activation.getModel().getActions().addEvaluationExpressionProvider(provider);
  }
  return new (_atom2 || _atom()).Disposable(function () {
    if (activation) {
      activation.getModel().getActions().removeEvaluationExpressionProvider(provider);
    }
  });
}

function consumeToolBar(getToolBar) {
  var toolBar = getToolBar('nuclide-debugger');
  toolBar.addButton({
    icon: 'plug',
    callback: 'nuclide-debugger:toggle',
    tooltip: 'Toggle Debugger',
    priority: 100
  });
  var disposable = new (_atom2 || _atom()).Disposable(function () {
    toolBar.removeItems();
  });
  (0, (_assert2 || _assert()).default)(activation);
  activation._disposables.add(disposable);
  return disposable;
}

function consumeNotifications(raiseNativeNotification) {
  (0, (_nuclideDebuggerBase2 || _nuclideDebuggerBase()).setNotificationService)(raiseNativeNotification);
}

function provideRemoteControlService() {
  return new (_RemoteControlService2 || _RemoteControlService()).default(function () {
    return activation ? activation.getModel() : null;
  });
}

function consumeDatatipService(service) {
  var provider = createDatatipProvider();
  service.addProvider(provider);
  var disposable = new (_atom2 || _atom()).Disposable(function () {
    return service.removeProvider(provider);
  });
  (0, (_assert2 || _assert()).default)(activation);
  activation.getModel().getThreadStore().setDatatipService(service);
  activation._disposables.add(disposable);
  return disposable;
}

function createDebuggerNuxTourModel() {
  var welcomeToNewUiNux = {
    content: 'Welcome to the new Nuclide debugger UI!</br>' + 'We are evolving the debugger to integrate more closely with Nuclide.',
    selector: '.nuclide-debugger-container-new',
    position: 'left'
  };

  var toggleOldNewUiNux = {
    content: 'You can always switch back to the old UI.',
    selector: '.nuclide-debugger-toggle-old-ui-button',
    position: 'bottom'
  };

  var newDebuggerUINuxTour = {
    id: NUX_NEW_DEBUGGER_UI_ID,
    name: NUX_NEW_DEBUGGER_UI_NAME,
    nuxList: [welcomeToNewUiNux, toggleOldNewUiNux],
    gatekeeperID: GK_NEW_DEBUGGER_UI_NUX
  };

  return newDebuggerUINuxTour;
}

function consumeRegisterNuxService(addNewNux) {
  (0, (_assert2 || _assert()).default)(activation);
  return activation.consumeRegisterNuxService(addNewNux);
}

function consumeTriggerNuxService(tryTriggerNux) {
  if (activation != null) {
    activation.setTriggerNux(tryTriggerNux);
  }
}