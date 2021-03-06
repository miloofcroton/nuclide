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

import type {NuclideDebuggerProvider} from 'nuclide-debugger-common';

import createPackage from 'nuclide-commons-atom/createPackage';
import {VsAdapterTypes} from 'nuclide-debugger-common';
import passesGK from '../../commons-node/passesGK';
import AutoGenLaunchAttachProvider from 'nuclide-debugger-common/AutoGenLaunchAttachProvider';
import HhvmLaunchAttachProvider from './HhvmLaunchAttachProvider';
import ReactNativeLaunchAttachProvider from './ReactNativeLaunchAttachProvider';
import UniversalDisposable from 'nuclide-commons/UniversalDisposable';
import fsPromise from 'nuclide-commons/fsPromise';
import {
  getOCamlAutoGenConfig,
  getPrepackAutoGenConfig,
  getNativeAutoGenConfig,
} from './utils';
// eslint-disable-next-line rulesdir/prefer-nuclide-uri
import path from 'path';

class Activation {
  _subscriptions: UniversalDisposable;

  constructor() {
    this._subscriptions = new UniversalDisposable();

    fsPromise.exists(path.join(__dirname, 'fb-marker')).then(exists => {
      const isOpenSource = !exists;
      this._registerReactNativeDebugProvider(isOpenSource);
      this._registerPrepackDebugProvider(isOpenSource);
      this._registerOcamlDebugProvider();
      this._registerLLDBProvider();
      this._registerGDBProvider();
      this._registerHHVMDebugProvider();
    });
  }

  _registerDebugProvider(provider: NuclideDebuggerProvider): void {
    this._subscriptions.add(
      atom.packages.serviceHub.provide('debugger.provider', '0.0.0', provider),
    );
  }

  async _registerReactNativeDebugProvider(
    isOpenSource: boolean,
  ): Promise<void> {
    if ((await passesGK('nuclide_debugger_reactnative')) || isOpenSource) {
      this._registerDebugProvider({
        name: 'React Native',
        getLaunchAttachProvider: connection => {
          return new ReactNativeLaunchAttachProvider(connection);
        },
      });
    }
  }

  async _registerPrepackDebugProvider(isOpenSource: boolean): Promise<void> {
    if ((await passesGK('nuclide_debugger_prepack')) || isOpenSource) {
      this._registerDebugProvider({
        name: 'Prepack',
        getLaunchAttachProvider: connection => {
          return new AutoGenLaunchAttachProvider(
            'Prepack',
            connection,
            getPrepackAutoGenConfig(),
          );
        },
      });
    }
  }

  async _registerOcamlDebugProvider(): Promise<void> {
    if (await passesGK('nuclide_debugger_ocaml')) {
      this._registerDebugProvider({
        name: 'OCaml',
        getLaunchAttachProvider: connection => {
          return new AutoGenLaunchAttachProvider(
            'OCaml',
            connection,
            getOCamlAutoGenConfig(),
          );
        },
      });
    }
  }

  _registerLLDBProvider() {
    this._registerDebugProvider({
      name: 'Native - LLDB (C/C++)',
      getLaunchAttachProvider: connection => {
        return new AutoGenLaunchAttachProvider(
          'Native - LLDB (C/C++)',
          connection,
          getNativeAutoGenConfig(VsAdapterTypes.NATIVE_LLDB),
        );
      },
    });
  }

  _registerGDBProvider() {
    this._registerDebugProvider({
      name: 'Native - GDB (C/C++)',
      getLaunchAttachProvider: connection => {
        return new AutoGenLaunchAttachProvider(
          'Native - GDB (C/C++)',
          connection,
          getNativeAutoGenConfig(VsAdapterTypes.NATIVE_GDB),
        );
      },
    });
  }

  async _registerHHVMDebugProvider(): Promise<void> {
    this._registerDebugProvider({
      name: 'Hack / PHP',
      getLaunchAttachProvider: connection => {
        return new HhvmLaunchAttachProvider('Hack / PHP', connection);
      },
    });
  }

  dispose(): void {
    this._subscriptions.dispose();
  }
}

createPackage(module.exports, Activation);
