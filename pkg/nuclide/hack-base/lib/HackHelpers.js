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

/**
 * Executes hh_client with proper arguments returning the result string or json object.
 */

var callHHClient = _asyncToGenerator(function* (args, errorStream, outputJson, processInput, filePath) {

  if (!hhPromiseQueue) {
    hhPromiseQueue = new _commons.PromiseQueue();
  }

  var hackExecOptions = yield (0, _hackConfig.getHackExecOptions)(filePath);
  if (!hackExecOptions) {
    return null;
  }
  var hackRoot = hackExecOptions.hackRoot;
  var hackCommand = hackExecOptions.hackCommand;

  (0, _assert2['default'])(hhPromiseQueue);
  return hhPromiseQueue.submit(_asyncToGenerator(function* (resolve, reject) {
    // Append args on the end of our commands.
    var defaults = ['--retries', '0', '--retry-if-init', 'false', '--from', 'nuclide'];
    if (outputJson) {
      defaults.unshift('--json');
    }

    var allArgs = defaults.concat(args);
    allArgs.push(hackRoot);

    var execResult = null;
    try {
      logger.debug('Calling Hack: ' + hackCommand + ' with ' + allArgs);
      execResult = yield (0, _commons.checkOutput)(hackCommand, allArgs, { stdin: processInput });
    } catch (err) {
      reject(err);
      return;
    }
    var _execResult = execResult;
    var stdout = _execResult.stdout;
    var stderr = _execResult.stderr;

    if (stderr.indexOf(HH_SERVER_INIT_MESSAGE) !== -1) {
      reject(new Error(HH_SERVER_INIT_MESSAGE + ': try: `arc build` or try again later!'));
      return;
    } else if (stderr.startsWith(HH_SERVER_BUSY_MESSAGE)) {
      reject(new Error(HH_SERVER_BUSY_MESSAGE + ': try: `arc build` or try again later!'));
      return;
    }

    var output = errorStream ? stderr : stdout;
    if (!outputJson) {
      resolve({ result: output, hackRoot: hackRoot });
      return;
    }
    try {
      resolve({ result: JSON.parse(output), hackRoot: hackRoot });
    } catch (err) {
      var errorMessage = 'hh_client error, args: [' + args.join(',') + ']\nstdout: ' + stdout + ', stderr: ' + stderr;
      logger.error(errorMessage);
      reject(new Error(errorMessage));
    }
  }));
});

exports.callHHClient = callHHClient;

var getSearchResults = _asyncToGenerator(function* (filePath, search, filterTypes, searchPostfix) {
  if (!search) {
    return null;
  }

  // `pendingSearchPromises` is used to temporally cache search result promises.
  // So, when a matching search query is done in parallel, it will wait and resolve
  // with the original search call.
  var searchPromise = pendingSearchPromises.get(search);
  if (!searchPromise) {
    searchPromise = callHHClient(
    /*args*/['--search' + (searchPostfix || ''), search],
    /*errorStream*/false,
    /*outputJson*/true,
    /*processInput*/null,
    /*file*/filePath);
    pendingSearchPromises.set(search, searchPromise);
  }

  var searchResponse = null;
  try {
    searchResponse = yield searchPromise;
  } catch (error) {
    throw error;
  } finally {
    pendingSearchPromises['delete'](search);
  }

  if (!searchResponse) {
    return null;
  }

  var _searchResponse = searchResponse;
  var searchResult = _searchResponse.result;
  var hackRoot = _searchResponse.hackRoot;

  var result = [];
  for (var entry of searchResult) {
    var resultFile = entry.filename;
    if (!resultFile.startsWith(hackRoot)) {
      // Filter out files out of repo results, e.g. hh internal files.
      continue;
    }
    result.push({
      line: entry.line - 1,
      column: entry.char_start - 1,
      name: entry.name,
      path: resultFile,
      length: entry.char_end - entry.char_start + 1,
      scope: entry.scope,
      additionalInfo: entry.desc
    });
  }

  if (filterTypes) {
    result = filterSearchResults(result, filterTypes);
  }
  return { hackRoot: hackRoot, result: result };
}

// Eventually this will happen on the hack side, but for now, this will do.
);

exports.getSearchResults = getSearchResults;
exports.symbolTypeToSearchTypes = symbolTypeToSearchTypes;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _commons = require('../../commons');

var _hackCommonLibConstants = require('../../hack-common/lib/constants');

var _hackConfig = require('./hack-config');

var HH_SERVER_INIT_MESSAGE = 'hh_server still initializing';
var HH_SERVER_BUSY_MESSAGE = 'hh_server is busy';
var logger = require('../../logging').getLogger();

var hhPromiseQueue = null;
var pendingSearchPromises = new Map();

var SYMBOL_CLASS_SEARCH_TYPES = Object.freeze([_hackCommonLibConstants.SearchResultType.CLASS, _hackCommonLibConstants.SearchResultType.ABSTRACT_CLASS, _hackCommonLibConstants.SearchResultType.TRAIT, _hackCommonLibConstants.SearchResultType.TYPEDEF, _hackCommonLibConstants.SearchResultType.INTERFACE]);
var SYMBOL_METHOD_SEARCH_TYPES = Object.freeze([_hackCommonLibConstants.SearchResultType.METHOD]);
var SYMBOL_FUNCTION_SEARCH_TYPES = Object.freeze([_hackCommonLibConstants.SearchResultType.FUNCTION]);function filterSearchResults(results, filter) {
  return results.filter(function (result) {
    var info = result.additionalInfo;
    var searchType = getSearchType(info);
    return filter.indexOf(searchType) !== -1;
  });
}

function getSearchType(info) {
  switch (info) {
    case 'typedef':
      return _hackCommonLibConstants.SearchResultType.TYPEDEF;
    case 'function':
      return _hackCommonLibConstants.SearchResultType.FUNCTION;
    case 'constant':
      return _hackCommonLibConstants.SearchResultType.CONSTANT;
    case 'trait':
      return _hackCommonLibConstants.SearchResultType.TRAIT;
    case 'interface':
      return _hackCommonLibConstants.SearchResultType.INTERFACE;
    case 'abstract class':
      return _hackCommonLibConstants.SearchResultType.ABSTRACT_CLASS;
    default:
      {
        if (info.startsWith('method') || info.startsWith('static method')) {
          return _hackCommonLibConstants.SearchResultType.METHOD;
        }
        if (info.startsWith('class var') || info.startsWith('static class var')) {
          return _hackCommonLibConstants.SearchResultType.CLASS_VAR;
        }
        return _hackCommonLibConstants.SearchResultType.CLASS;
      }
  }
}

function symbolTypeToSearchTypes(symbolType) {
  switch (symbolType) {
    case _hackCommonLibConstants.SymbolType.CLASS:
      return SYMBOL_CLASS_SEARCH_TYPES;
    case _hackCommonLibConstants.SymbolType.METHOD:
      return SYMBOL_METHOD_SEARCH_TYPES;
    case _hackCommonLibConstants.SymbolType.FUNCTION:
      return SYMBOL_FUNCTION_SEARCH_TYPES;
    default:
      return null;
  }
}
//# sourceMappingURL=data:application/json;base64,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QUFpQixTQUFTLENBQUM7U0FDbkM7QUFDRCxlQUFPLHlDQUFpQixLQUFLLENBQUM7T0FDL0I7QUFBQSxHQUNGO0NBQ0Y7O0FBRU0sU0FBUyx1QkFBdUIsQ0FDckMsVUFBMkIsRUFDSTtBQUMvQixVQUFRLFVBQVU7QUFDaEIsU0FBSyxtQ0FBVyxLQUFLO0FBQ25CLGFBQU8seUJBQXlCLENBQUM7QUFBQSxBQUNuQyxTQUFLLG1DQUFXLE1BQU07QUFDcEIsYUFBTywwQkFBMEIsQ0FBQztBQUFBLEFBQ3BDLFNBQUssbUNBQVcsUUFBUTtBQUN0QixhQUFPLDRCQUE0QixDQUFDO0FBQUEsQUFDdEM7QUFDRSxhQUFPLElBQUksQ0FBQztBQUFBLEdBQ2Y7Q0FDRiIsImZpbGUiOiJIYWNrSGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtIYWNrU2VhcmNoUG9zaXRpb259IGZyb20gJy4vSGFja1NlcnZpY2UnO1xuaW1wb3J0IHR5cGUge0hhY2tTZWFyY2hSZXN1bHQsIEhIU2VhcmNoUG9zaXRpb259IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHR5cGUge1NlYXJjaFJlc3VsdFR5cGVWYWx1ZSwgU3ltYm9sVHlwZVZhbHVlfSBmcm9tICcuLi8uLi9oYWNrLWNvbW1vbi9saWIvY29uc3RhbnRzJztcblxuaW1wb3J0IGludmFyaWFudCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHtjaGVja091dHB1dCwgUHJvbWlzZVF1ZXVlfSBmcm9tICcuLi8uLi9jb21tb25zJztcbmltcG9ydCB7U2VhcmNoUmVzdWx0VHlwZSwgU3ltYm9sVHlwZX0gZnJvbSAnLi4vLi4vaGFjay1jb21tb24vbGliL2NvbnN0YW50cyc7XG5pbXBvcnQge2dldEhhY2tFeGVjT3B0aW9uc30gZnJvbSAnLi9oYWNrLWNvbmZpZyc7XG5cbmNvbnN0IEhIX1NFUlZFUl9JTklUX01FU1NBR0UgPSAnaGhfc2VydmVyIHN0aWxsIGluaXRpYWxpemluZyc7XG5jb25zdCBISF9TRVJWRVJfQlVTWV9NRVNTQUdFID0gJ2hoX3NlcnZlciBpcyBidXN5JztcbmNvbnN0IGxvZ2dlciA9IHJlcXVpcmUoJy4uLy4uL2xvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcblxubGV0IGhoUHJvbWlzZVF1ZXVlOiA/UHJvbWlzZVF1ZXVlID0gbnVsbDtcbmNvbnN0IHBlbmRpbmdTZWFyY2hQcm9taXNlczogTWFwPHN0cmluZywgUHJvbWlzZT4gPSBuZXcgTWFwKCk7XG5cbmNvbnN0IFNZTUJPTF9DTEFTU19TRUFSQ0hfVFlQRVMgPSBPYmplY3QuZnJlZXplKFtcbiAgU2VhcmNoUmVzdWx0VHlwZS5DTEFTUyxcbiAgU2VhcmNoUmVzdWx0VHlwZS5BQlNUUkFDVF9DTEFTUyxcbiAgU2VhcmNoUmVzdWx0VHlwZS5UUkFJVCxcbiAgU2VhcmNoUmVzdWx0VHlwZS5UWVBFREVGLFxuICBTZWFyY2hSZXN1bHRUeXBlLklOVEVSRkFDRSxcbl0pO1xuY29uc3QgU1lNQk9MX01FVEhPRF9TRUFSQ0hfVFlQRVMgPSBPYmplY3QuZnJlZXplKFtTZWFyY2hSZXN1bHRUeXBlLk1FVEhPRF0pO1xuY29uc3QgU1lNQk9MX0ZVTkNUSU9OX1NFQVJDSF9UWVBFUyA9IE9iamVjdC5mcmVlemUoW1NlYXJjaFJlc3VsdFR5cGUuRlVOQ1RJT05dKTtcblxuIC8qKlxuICAqIEV4ZWN1dGVzIGhoX2NsaWVudCB3aXRoIHByb3BlciBhcmd1bWVudHMgcmV0dXJuaW5nIHRoZSByZXN1bHQgc3RyaW5nIG9yIGpzb24gb2JqZWN0LlxuICAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGxISENsaWVudChcbiAgYXJnczogQXJyYXk8c3RyaW5nPixcbiAgZXJyb3JTdHJlYW06IGJvb2xlYW4sXG4gIG91dHB1dEpzb246IGJvb2xlYW4sXG4gIHByb2Nlc3NJbnB1dDogP3N0cmluZyxcbiAgZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8P3toYWNrUm9vdDogc3RyaW5nLCByZXN1bHQ6IHN0cmluZyB8IE9iamVjdH0+IHtcblxuICBpZiAoIWhoUHJvbWlzZVF1ZXVlKSB7XG4gICAgaGhQcm9taXNlUXVldWUgPSBuZXcgUHJvbWlzZVF1ZXVlKCk7XG4gIH1cblxuICBjb25zdCBoYWNrRXhlY09wdGlvbnMgPSBhd2FpdCBnZXRIYWNrRXhlY09wdGlvbnMoZmlsZVBhdGgpO1xuICBpZiAoIWhhY2tFeGVjT3B0aW9ucykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IHtoYWNrUm9vdCwgaGFja0NvbW1hbmR9ID0gaGFja0V4ZWNPcHRpb25zO1xuXG4gIGludmFyaWFudChoaFByb21pc2VRdWV1ZSk7XG4gIHJldHVybiBoaFByb21pc2VRdWV1ZS5zdWJtaXQoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIC8vIEFwcGVuZCBhcmdzIG9uIHRoZSBlbmQgb2Ygb3VyIGNvbW1hbmRzLlxuICAgIGNvbnN0IGRlZmF1bHRzID0gWyctLXJldHJpZXMnLCAnMCcsICctLXJldHJ5LWlmLWluaXQnLCAnZmFsc2UnLCAnLS1mcm9tJywgJ251Y2xpZGUnXTtcbiAgICBpZiAob3V0cHV0SnNvbikge1xuICAgICAgZGVmYXVsdHMudW5zaGlmdCgnLS1qc29uJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYWxsQXJncyA9IGRlZmF1bHRzLmNvbmNhdChhcmdzKTtcbiAgICBhbGxBcmdzLnB1c2goaGFja1Jvb3QpO1xuXG4gICAgbGV0IGV4ZWNSZXN1bHQgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICBsb2dnZXIuZGVidWcoYENhbGxpbmcgSGFjazogJHtoYWNrQ29tbWFuZH0gd2l0aCAke2FsbEFyZ3N9YCk7XG4gICAgICBleGVjUmVzdWx0ID0gYXdhaXQgY2hlY2tPdXRwdXQoaGFja0NvbW1hbmQsIGFsbEFyZ3MsIHtzdGRpbjogcHJvY2Vzc0lucHV0fSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZWplY3QoZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qge3N0ZG91dCwgc3RkZXJyfSA9IGV4ZWNSZXN1bHQ7XG4gICAgaWYgKHN0ZGVyci5pbmRleE9mKEhIX1NFUlZFUl9JTklUX01FU1NBR0UpICE9PSAtMSkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihgJHtISF9TRVJWRVJfSU5JVF9NRVNTQUdFfTogdHJ5OiBcXGBhcmMgYnVpbGRcXGAgb3IgdHJ5IGFnYWluIGxhdGVyIWApKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKHN0ZGVyci5zdGFydHNXaXRoKEhIX1NFUlZFUl9CVVNZX01FU1NBR0UpKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKGAke0hIX1NFUlZFUl9CVVNZX01FU1NBR0V9OiB0cnk6IFxcYGFyYyBidWlsZFxcYCBvciB0cnkgYWdhaW4gbGF0ZXIhYCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG91dHB1dCA9IGVycm9yU3RyZWFtID8gc3RkZXJyIDogc3Rkb3V0O1xuICAgIGlmICghb3V0cHV0SnNvbikge1xuICAgICAgcmVzb2x2ZSh7cmVzdWx0OiBvdXRwdXQsIGhhY2tSb290fSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICByZXNvbHZlKHtyZXN1bHQ6IEpTT04ucGFyc2Uob3V0cHV0KSwgaGFja1Jvb3R9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9IGBoaF9jbGllbnQgZXJyb3IsIGFyZ3M6IFske2FyZ3Muam9pbignLCcpfV1cbnN0ZG91dDogJHtzdGRvdXR9LCBzdGRlcnI6ICR7c3RkZXJyfWA7XG4gICAgICBsb2dnZXIuZXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKSk7XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNlYXJjaFJlc3VsdHMoXG4gICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICBzZWFyY2g6IHN0cmluZyxcbiAgICBmaWx0ZXJUeXBlcz86ID9BcnJheTxTZWFyY2hSZXN1bHRUeXBlVmFsdWU+LFxuICAgIHNlYXJjaFBvc3RmaXg/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8P0hhY2tTZWFyY2hSZXN1bHQ+IHtcbiAgaWYgKCFzZWFyY2gpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIGBwZW5kaW5nU2VhcmNoUHJvbWlzZXNgIGlzIHVzZWQgdG8gdGVtcG9yYWxseSBjYWNoZSBzZWFyY2ggcmVzdWx0IHByb21pc2VzLlxuICAvLyBTbywgd2hlbiBhIG1hdGNoaW5nIHNlYXJjaCBxdWVyeSBpcyBkb25lIGluIHBhcmFsbGVsLCBpdCB3aWxsIHdhaXQgYW5kIHJlc29sdmVcbiAgLy8gd2l0aCB0aGUgb3JpZ2luYWwgc2VhcmNoIGNhbGwuXG4gIGxldCBzZWFyY2hQcm9taXNlID0gcGVuZGluZ1NlYXJjaFByb21pc2VzLmdldChzZWFyY2gpO1xuICBpZiAoIXNlYXJjaFByb21pc2UpIHtcbiAgICBzZWFyY2hQcm9taXNlID0gY2FsbEhIQ2xpZW50KFxuICAgICAgICAvKmFyZ3MqLyBbJy0tc2VhcmNoJyArIChzZWFyY2hQb3N0Zml4IHx8ICcnKSwgc2VhcmNoXSxcbiAgICAgICAgLyplcnJvclN0cmVhbSovIGZhbHNlLFxuICAgICAgICAvKm91dHB1dEpzb24qLyB0cnVlLFxuICAgICAgICAvKnByb2Nlc3NJbnB1dCovIG51bGwsXG4gICAgICAgIC8qZmlsZSovIGZpbGVQYXRoLFxuICAgICk7XG4gICAgcGVuZGluZ1NlYXJjaFByb21pc2VzLnNldChzZWFyY2gsIHNlYXJjaFByb21pc2UpO1xuICB9XG5cbiAgbGV0IHNlYXJjaFJlc3BvbnNlOiA/e2hhY2tSb290OiBzdHJpbmc7IHJlc3VsdDogQXJyYXk8SEhTZWFyY2hQb3NpdGlvbj59ID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBzZWFyY2hSZXNwb25zZSA9IChcbiAgICAgICgoYXdhaXQgc2VhcmNoUHJvbWlzZSk6IGFueSk6IHtoYWNrUm9vdDogc3RyaW5nOyByZXN1bHQ6IEFycmF5PEhIU2VhcmNoUG9zaXRpb24+fVxuICAgICk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZmluYWxseSB7XG4gICAgcGVuZGluZ1NlYXJjaFByb21pc2VzLmRlbGV0ZShzZWFyY2gpO1xuICB9XG5cbiAgaWYgKCFzZWFyY2hSZXNwb25zZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3Qge3Jlc3VsdDogc2VhcmNoUmVzdWx0LCBoYWNrUm9vdH0gPSBzZWFyY2hSZXNwb25zZTtcbiAgbGV0IHJlc3VsdDogQXJyYXk8SGFja1NlYXJjaFBvc2l0aW9uPiA9IFtdO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIHNlYXJjaFJlc3VsdCkge1xuICAgIGNvbnN0IHJlc3VsdEZpbGUgPSBlbnRyeS5maWxlbmFtZTtcbiAgICBpZiAoIXJlc3VsdEZpbGUuc3RhcnRzV2l0aChoYWNrUm9vdCkpIHtcbiAgICAgIC8vIEZpbHRlciBvdXQgZmlsZXMgb3V0IG9mIHJlcG8gcmVzdWx0cywgZS5nLiBoaCBpbnRlcm5hbCBmaWxlcy5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICByZXN1bHQucHVzaCh7XG4gICAgICBsaW5lOiBlbnRyeS5saW5lIC0gMSxcbiAgICAgIGNvbHVtbjogZW50cnkuY2hhcl9zdGFydCAtIDEsXG4gICAgICBuYW1lOiBlbnRyeS5uYW1lLFxuICAgICAgcGF0aDogcmVzdWx0RmlsZSxcbiAgICAgIGxlbmd0aDogZW50cnkuY2hhcl9lbmQgLSBlbnRyeS5jaGFyX3N0YXJ0ICsgMSxcbiAgICAgIHNjb3BlOiBlbnRyeS5zY29wZSxcbiAgICAgIGFkZGl0aW9uYWxJbmZvOiBlbnRyeS5kZXNjLFxuICAgIH0pO1xuICB9XG5cbiAgaWYgKGZpbHRlclR5cGVzKSB7XG4gICAgcmVzdWx0ID0gZmlsdGVyU2VhcmNoUmVzdWx0cyhyZXN1bHQsIGZpbHRlclR5cGVzKTtcbiAgfVxuICByZXR1cm4ge2hhY2tSb290LCByZXN1bHR9O1xufVxuXG4vLyBFdmVudHVhbGx5IHRoaXMgd2lsbCBoYXBwZW4gb24gdGhlIGhhY2sgc2lkZSwgYnV0IGZvciBub3csIHRoaXMgd2lsbCBkby5cbmZ1bmN0aW9uIGZpbHRlclNlYXJjaFJlc3VsdHMoXG4gIHJlc3VsdHM6IEFycmF5PEhhY2tTZWFyY2hQb3NpdGlvbj4sXG4gIGZpbHRlcjogQXJyYXk8U2VhcmNoUmVzdWx0VHlwZVZhbHVlPixcbik6IEFycmF5PEhhY2tTZWFyY2hQb3NpdGlvbj4ge1xuICByZXR1cm4gcmVzdWx0cy5maWx0ZXIocmVzdWx0ID0+IHtcbiAgICBjb25zdCBpbmZvID0gcmVzdWx0LmFkZGl0aW9uYWxJbmZvO1xuICAgIGNvbnN0IHNlYXJjaFR5cGUgPSBnZXRTZWFyY2hUeXBlKGluZm8pO1xuICAgIHJldHVybiBmaWx0ZXIuaW5kZXhPZihzZWFyY2hUeXBlKSAhPT0gLTE7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRTZWFyY2hUeXBlKGluZm86IHN0cmluZyk6IFNlYXJjaFJlc3VsdFR5cGVWYWx1ZSB7XG4gIHN3aXRjaCAoaW5mbykge1xuICAgIGNhc2UgJ3R5cGVkZWYnOlxuICAgICAgcmV0dXJuIFNlYXJjaFJlc3VsdFR5cGUuVFlQRURFRjtcbiAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICByZXR1cm4gU2VhcmNoUmVzdWx0VHlwZS5GVU5DVElPTjtcbiAgICBjYXNlICdjb25zdGFudCc6XG4gICAgICByZXR1cm4gU2VhcmNoUmVzdWx0VHlwZS5DT05TVEFOVDtcbiAgICBjYXNlICd0cmFpdCc6XG4gICAgICByZXR1cm4gU2VhcmNoUmVzdWx0VHlwZS5UUkFJVDtcbiAgICBjYXNlICdpbnRlcmZhY2UnOlxuICAgICAgcmV0dXJuIFNlYXJjaFJlc3VsdFR5cGUuSU5URVJGQUNFO1xuICAgIGNhc2UgJ2Fic3RyYWN0IGNsYXNzJzpcbiAgICAgIHJldHVybiBTZWFyY2hSZXN1bHRUeXBlLkFCU1RSQUNUX0NMQVNTO1xuICAgIGRlZmF1bHQ6IHtcbiAgICAgIGlmIChpbmZvLnN0YXJ0c1dpdGgoJ21ldGhvZCcpIHx8IGluZm8uc3RhcnRzV2l0aCgnc3RhdGljIG1ldGhvZCcpKSB7XG4gICAgICAgIHJldHVybiBTZWFyY2hSZXN1bHRUeXBlLk1FVEhPRDtcbiAgICAgIH1cbiAgICAgIGlmIChpbmZvLnN0YXJ0c1dpdGgoJ2NsYXNzIHZhcicpIHx8IGluZm8uc3RhcnRzV2l0aCgnc3RhdGljIGNsYXNzIHZhcicpKSB7XG4gICAgICAgIHJldHVybiBTZWFyY2hSZXN1bHRUeXBlLkNMQVNTX1ZBUjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBTZWFyY2hSZXN1bHRUeXBlLkNMQVNTO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3ltYm9sVHlwZVRvU2VhcmNoVHlwZXMoXG4gIHN5bWJvbFR5cGU6IFN5bWJvbFR5cGVWYWx1ZSxcbik6ID9BcnJheTxTZWFyY2hSZXN1bHRUeXBlVmFsdWU+IHtcbiAgc3dpdGNoIChzeW1ib2xUeXBlKSB7XG4gICAgY2FzZSBTeW1ib2xUeXBlLkNMQVNTOlxuICAgICAgcmV0dXJuIFNZTUJPTF9DTEFTU19TRUFSQ0hfVFlQRVM7XG4gICAgY2FzZSBTeW1ib2xUeXBlLk1FVEhPRDpcbiAgICAgIHJldHVybiBTWU1CT0xfTUVUSE9EX1NFQVJDSF9UWVBFUztcbiAgICBjYXNlIFN5bWJvbFR5cGUuRlVOQ1RJT046XG4gICAgICByZXR1cm4gU1lNQk9MX0ZVTkNUSU9OX1NFQVJDSF9UWVBFUztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==