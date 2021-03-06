var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('preact'),
    h = _require.h,
    Component = _require.Component;

var AuthView = require('./AuthView');
var Browser = require('./Browser');
var LoaderView = require('./Loader');
var generateFileID = require('@uppy/utils/lib/generateFileID');
var getFileType = require('@uppy/utils/lib/getFileType');
var isPreviewSupported = require('@uppy/utils/lib/isPreviewSupported');

/**
 * Array.prototype.findIndex ponyfill for old browsers.
 */
function findIndex(array, predicate) {
  for (var i = 0; i < array.length; i++) {
    if (predicate(array[i])) return i;
  }
  return -1;
}

var CloseWrapper = function (_Component) {
  _inherits(CloseWrapper, _Component);

  function CloseWrapper() {
    _classCallCheck(this, CloseWrapper);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  CloseWrapper.prototype.componentWillUnmount = function componentWillUnmount() {
    this.props.onUnmount();
  };

  CloseWrapper.prototype.render = function render() {
    return this.props.children[0];
  };

  return CloseWrapper;
}(Component);

/**
 * Class to easily generate generic views for Provider plugins
 */


module.exports = function () {
  /**
   * @param {object} instance of the plugin
   */
  function ProviderView(plugin, opts) {
    _classCallCheck(this, ProviderView);

    this.plugin = plugin;
    this.Provider = plugin[plugin.id];

    // set default options
    var defaultOptions = {
      viewType: 'list',
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true

      // merge default options with the ones set by user
    };this.opts = _extends({}, defaultOptions, opts);

    // Logic
    this.addFile = this.addFile.bind(this);
    this.filterItems = this.filterItems.bind(this);
    this.filterQuery = this.filterQuery.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    this.getFolder = this.getFolder.bind(this);
    this.getNextFolder = this.getNextFolder.bind(this);
    this.logout = this.logout.bind(this);
    this.checkAuth = this.checkAuth.bind(this);
    this.handleAuth = this.handleAuth.bind(this);
    this.handleDemoAuth = this.handleDemoAuth.bind(this);
    this.sortByTitle = this.sortByTitle.bind(this);
    this.sortByDate = this.sortByDate.bind(this);
    this.isActiveRow = this.isActiveRow.bind(this);
    this.isChecked = this.isChecked.bind(this);
    this.toggleCheckbox = this.toggleCheckbox.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.donePicking = this.donePicking.bind(this);
    this.cancelPicking = this.cancelPicking.bind(this);
    this.clearSelection = this.clearSelection.bind(this);

    // Visual
    this.render = this.render.bind(this);

    this.clearSelection();
  }

  ProviderView.prototype.tearDown = function tearDown() {
    // Nothing.
  };

  ProviderView.prototype._updateFilesAndFolders = function _updateFilesAndFolders(res, files, folders) {
    res.items.forEach(function (item) {
      if (item.isFolder) {
        folders.push(item);
      } else {
        files.push(item);
      }
    });

    this.plugin.setPluginState({ folders: folders, files: files });
  };

  ProviderView.prototype.checkAuth = function checkAuth() {
    var _this2 = this;

    this.plugin.setPluginState({ checkAuthInProgress: true });
    this.Provider.checkAuth().then(function (authenticated) {
      _this2.plugin.setPluginState({ checkAuthInProgress: false });
      _this2.plugin.onAuth(authenticated);
    }).catch(function (err) {
      _this2.plugin.setPluginState({ checkAuthInProgress: false });
      _this2.handleError(err);
    });
  };

  /**
   * Based on folder ID, fetch a new folder and update it to state
   * @param  {String} id Folder id
   * @return {Promise}   Folders/files in folder
   */


  ProviderView.prototype.getFolder = function getFolder(id, name) {
    var _this3 = this;

    return this._loaderWrapper(this.Provider.list(id), function (res) {
      var folders = [];
      var files = [];
      var updatedDirectories = void 0;

      var state = _this3.plugin.getPluginState();
      var index = findIndex(state.directories, function (dir) {
        return id === dir.id;
      });

      if (index !== -1) {
        updatedDirectories = state.directories.slice(0, index + 1);
      } else {
        updatedDirectories = state.directories.concat([{ id: id, title: name }]);
      }

      _this3.username = _this3.username ? _this3.username : res.username;
      _this3.nextPagePath = res.nextPagePath;
      _this3._updateFilesAndFolders(res, files, folders);
      _this3.plugin.setPluginState({ directories: updatedDirectories });
    }, this.handleError);
  };

  /**
   * Fetches new folder
   * @param  {Object} Folder
   * @param  {String} title Folder title
   */


  ProviderView.prototype.getNextFolder = function getNextFolder(folder) {
    this.getFolder(folder.requestPath, folder.name);
    this.lastCheckbox = undefined;
  };

  ProviderView.prototype.addFile = function addFile(file) {
    var tagFile = {
      id: this.providerFileToId(file),
      source: this.plugin.id,
      data: file,
      name: file.name || file.id,
      type: file.mimeType,
      isRemote: true,
      body: {
        fileId: file.id
      },
      remote: {
        serverUrl: this.plugin.opts.serverUrl,
        url: '' + this.Provider.fileUrl(file.requestPath),
        body: {
          fileId: file.id
        },
        providerOptions: this.Provider.opts
      }
    };

    var fileType = getFileType(tagFile);
    // TODO Should we just always use the thumbnail URL if it exists?
    if (fileType && isPreviewSupported(fileType)) {
      tagFile.preview = file.thumbnail;
    }
    this.plugin.uppy.log('Adding remote file');
    try {
      this.plugin.uppy.addFile(tagFile);
    } catch (err) {
      // Nothing, restriction errors handled in Core
    }
  };

  ProviderView.prototype.removeFile = function removeFile(id) {
    var _plugin$getPluginStat = this.plugin.getPluginState(),
        currentSelection = _plugin$getPluginStat.currentSelection;

    this.plugin.setPluginState({
      currentSelection: currentSelection.filter(function (file) {
        return file.id !== id;
      })
    });
  };

  /**
   * Removes session token on client side.
   */


  ProviderView.prototype.logout = function logout() {
    var _this4 = this;

    this.Provider.logout(location.href).then(function (res) {
      if (res.ok) {
        var newState = {
          authenticated: false,
          files: [],
          folders: [],
          directories: []
        };
        _this4.plugin.setPluginState(newState);
      }
    }).catch(this.handleError);
  };

  ProviderView.prototype.filterQuery = function filterQuery(e) {
    var state = this.plugin.getPluginState();
    this.plugin.setPluginState(_extends({}, state, {
      filterInput: e ? e.target.value : ''
    }));
  };

  ProviderView.prototype.toggleSearch = function toggleSearch(inputEl) {
    var state = this.plugin.getPluginState();

    this.plugin.setPluginState({
      isSearchVisible: !state.isSearchVisible,
      filterInput: ''
    });
  };

  ProviderView.prototype.filterItems = function filterItems(items) {
    var state = this.plugin.getPluginState();
    if (state.filterInput === '') {
      return items;
    }
    return items.filter(function (folder) {
      return folder.name.toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1;
    });
  };

  ProviderView.prototype.sortByTitle = function sortByTitle() {
    var state = _extends({}, this.plugin.getPluginState());
    var files = state.files,
        folders = state.folders,
        sorting = state.sorting;


    var sortedFiles = files.sort(function (fileA, fileB) {
      if (sorting === 'titleDescending') {
        return fileB.name.localeCompare(fileA.name);
      }
      return fileA.name.localeCompare(fileB.name);
    });

    var sortedFolders = folders.sort(function (folderA, folderB) {
      if (sorting === 'titleDescending') {
        return folderB.name.localeCompare(folderA.name);
      }
      return folderA.name.localeCompare(folderB.name);
    });

    this.plugin.setPluginState(_extends({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: sorting === 'titleDescending' ? 'titleAscending' : 'titleDescending'
    }));
  };

  ProviderView.prototype.sortByDate = function sortByDate() {
    var state = _extends({}, this.plugin.getPluginState());
    var files = state.files,
        folders = state.folders,
        sorting = state.sorting;


    var sortedFiles = files.sort(function (fileA, fileB) {
      var a = new Date(fileA.modifiedDate);
      var b = new Date(fileB.modifiedDate);

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }
      return a > b ? 1 : a < b ? -1 : 0;
    });

    var sortedFolders = folders.sort(function (folderA, folderB) {
      var a = new Date(folderA.modifiedDate);
      var b = new Date(folderB.modifiedDate);

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }

      return a > b ? 1 : a < b ? -1 : 0;
    });

    this.plugin.setPluginState(_extends({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: sorting === 'dateDescending' ? 'dateAscending' : 'dateDescending'
    }));
  };

  ProviderView.prototype.sortBySize = function sortBySize() {
    var state = _extends({}, this.plugin.getPluginState());
    var files = state.files,
        sorting = state.sorting;

    // check that plugin supports file sizes

    if (!files.length || !this.plugin.getItemData(files[0]).size) {
      return;
    }

    var sortedFiles = files.sort(function (fileA, fileB) {
      var a = fileA.size;
      var b = fileB.size;

      if (sorting === 'sizeDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }
      return a > b ? 1 : a < b ? -1 : 0;
    });

    this.plugin.setPluginState(_extends({}, state, {
      files: sortedFiles,
      sorting: sorting === 'sizeDescending' ? 'sizeAscending' : 'sizeDescending'
    }));
  };

  ProviderView.prototype.isActiveRow = function isActiveRow(file) {
    return this.plugin.getPluginState().activeRow === this.plugin.getItemId(file);
  };

  ProviderView.prototype.isChecked = function isChecked(file) {
    var _plugin$getPluginStat2 = this.plugin.getPluginState(),
        currentSelection = _plugin$getPluginStat2.currentSelection;

    return currentSelection.some(function (item) {
      return item === file;
    });
  };

  /**
   * Adds all files found inside of specified folder.
   *
   * Uses separated state while folder contents are being fetched and
   * mantains list of selected folders, which are separated from files.
   */


  ProviderView.prototype.addFolder = function addFolder(folder) {
    var _this5 = this;

    var folderId = this.providerFileToId(folder);
    var state = this.plugin.getPluginState();
    var folders = state.selectedFolders || {};
    if (folderId in folders && folders[folderId].loading) {
      return;
    }
    folders[folderId] = { loading: true, files: [] };
    this.plugin.setPluginState({ selectedFolders: folders });
    return this.Provider.list(folder.requestPath).then(function (res) {
      var files = [];
      res.items.forEach(function (item) {
        if (!item.isFolder) {
          _this5.addFile(item);
          files.push(_this5.providerFileToId(item));
        }
      });
      state = _this5.plugin.getPluginState();
      state.selectedFolders[folderId] = { loading: false, files: files };
      _this5.plugin.setPluginState({ selectedFolders: folders });
      var dashboard = _this5.plugin.uppy.getPlugin('Dashboard');
      var message = void 0;
      if (files.length) {
        message = dashboard.i18n('folderAdded', {
          smart_count: files.length, folder: folder.name
        });
      } else {
        message = dashboard.i18n('emptyFolderAdded');
      }
      _this5.plugin.uppy.info(message);
    }).catch(function (e) {
      state = _this5.plugin.getPluginState();
      delete state.selectedFolders[folderId];
      _this5.plugin.setPluginState({ selectedFolders: state.selectedFolders });
      _this5.handleError(e);
    });
  };

  /**
   * Toggles file/folder checkbox to on/off state while updating files list.
   *
   * Note that some extra complexity comes from supporting shift+click to
   * toggle multiple checkboxes at once, which is done by getting all files
   * in between last checked file and current one.
   */


  ProviderView.prototype.toggleCheckbox = function toggleCheckbox(e, file) {
    e.stopPropagation();
    e.preventDefault();

    var _plugin$getPluginStat3 = this.plugin.getPluginState(),
        folders = _plugin$getPluginStat3.folders,
        files = _plugin$getPluginStat3.files;

    var items = this.filterItems(folders.concat(files));

    // Shift-clicking selects a single consecutive list of items
    // starting at the previous click and deselects everything else.
    if (this.lastCheckbox && e.shiftKey) {
      var _currentSelection = void 0;
      var prevIndex = items.indexOf(this.lastCheckbox);
      var currentIndex = items.indexOf(file);
      if (prevIndex < currentIndex) {
        _currentSelection = items.slice(prevIndex, currentIndex + 1);
      } else {
        _currentSelection = items.slice(currentIndex, prevIndex + 1);
      }
      this.plugin.setPluginState({ currentSelection: _currentSelection });
      return;
    }

    this.lastCheckbox = file;

    var _plugin$getPluginStat4 = this.plugin.getPluginState(),
        currentSelection = _plugin$getPluginStat4.currentSelection;

    if (this.isChecked(file)) {
      this.plugin.setPluginState({
        currentSelection: currentSelection.filter(function (item) {
          return item !== file;
        })
      });
    } else {
      this.plugin.setPluginState({
        currentSelection: currentSelection.concat([file])
      });
    }
  };

  ProviderView.prototype.providerFileToId = function providerFileToId(file) {
    return generateFileID({
      data: file,
      name: file.name || file.id,
      type: file.mimeType
    });
  };

  ProviderView.prototype.handleDemoAuth = function handleDemoAuth() {
    var state = this.plugin.getPluginState();
    this.plugin.setPluginState({}, state, {
      authenticated: true
    });
  };

  ProviderView.prototype.handleAuth = function handleAuth() {
    var _this6 = this;

    var authState = btoa(JSON.stringify({ origin: location.origin }));
    var link = this.Provider.authUrl() + '?state=' + authState;

    var authWindow = window.open(link, '_blank');
    var handleToken = function handleToken(e) {
      if (!_this6._isOriginAllowed(e.origin, _this6.plugin.opts.serverPattern) || e.source !== authWindow) {
        _this6.plugin.uppy.log('rejecting event from ' + e.origin + ' vs allowed pattern ' + _this6.plugin.opts.serverPattern);
        return;
      }
      authWindow.close();
      window.removeEventListener('message', handleToken);
      _this6.Provider.setAuthToken(e.data.token);
      _this6._loaderWrapper(_this6.Provider.checkAuth(), _this6.plugin.onAuth, _this6.handleError);
    };
    window.addEventListener('message', handleToken);
  };

  ProviderView.prototype._isOriginAllowed = function _isOriginAllowed(origin, allowedOrigin) {
    var getRegex = function getRegex(value) {
      if (typeof value === 'string') {
        return new RegExp('^' + value + '$');
      } else if (value instanceof RegExp) {
        return value;
      }
    };

    var patterns = Array.isArray(allowedOrigin) ? allowedOrigin.map(getRegex) : [getRegex(allowedOrigin)];
    return patterns.filter(function (pattern) {
      return pattern !== null;
    }).some(function (pattern) {
      return pattern.test(origin);
    });
  };

  ProviderView.prototype.handleError = function handleError(error) {
    var uppy = this.plugin.uppy;
    var message = uppy.i18n('companionError');
    uppy.log(error.toString());
    uppy.info({ message: message, details: error.toString() }, 'error', 5000);
  };

  ProviderView.prototype.handleScroll = function handleScroll(e) {
    var _this7 = this;

    var scrollPos = e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight);
    var path = this.nextPagePath ? this.nextPagePath : null;

    if (scrollPos < 50 && path && !this._isHandlingScroll) {
      this.Provider.list(path).then(function (res) {
        var _plugin$getPluginStat5 = _this7.plugin.getPluginState(),
            files = _plugin$getPluginStat5.files,
            folders = _plugin$getPluginStat5.folders;

        _this7._updateFilesAndFolders(res, files, folders);
      }).catch(this.handleError).then(function () {
        _this7._isHandlingScroll = false;
      }); // always called

      this._isHandlingScroll = true;
    }
  };

  ProviderView.prototype.donePicking = function donePicking() {
    var _this8 = this;

    var _plugin$getPluginStat6 = this.plugin.getPluginState(),
        currentSelection = _plugin$getPluginStat6.currentSelection;

    var promises = currentSelection.map(function (file) {
      if (file.isFolder) {
        return _this8.addFolder(file);
      } else {
        return _this8.addFile(file);
      }
    });

    this._loaderWrapper(Promise.all(promises), function () {
      _this8.clearSelection();
    }, function () {});
  };

  ProviderView.prototype.cancelPicking = function cancelPicking() {
    this.clearSelection();

    var dashboard = this.plugin.uppy.getPlugin('Dashboard');
    if (dashboard) dashboard.hideAllPanels();
  };

  ProviderView.prototype.clearSelection = function clearSelection() {
    this.plugin.setPluginState({ currentSelection: [] });
  };

  // displays loader view while asynchronous request is being made.


  ProviderView.prototype._loaderWrapper = function _loaderWrapper(promise, then, catch_) {
    var _this9 = this;

    promise.then(function (result) {
      _this9.plugin.setPluginState({ loading: false });
      then(result);
    }).catch(function (err) {
      _this9.plugin.setPluginState({ loading: false });
      catch_(err);
    });
    this.plugin.setPluginState({ loading: true });
  };

  ProviderView.prototype.render = function render(state) {
    var _plugin$getPluginStat7 = this.plugin.getPluginState(),
        authenticated = _plugin$getPluginStat7.authenticated,
        checkAuthInProgress = _plugin$getPluginStat7.checkAuthInProgress,
        loading = _plugin$getPluginStat7.loading;

    if (loading) {
      return h(
        CloseWrapper,
        { onUnmount: this.clearSelection },
        h(LoaderView, null)
      );
    }

    if (!authenticated) {
      return h(
        CloseWrapper,
        { onUnmount: this.clearSelection },
        h(AuthView, {
          pluginName: this.plugin.title,
          pluginIcon: this.plugin.icon,
          demo: this.plugin.opts.demo,
          checkAuth: this.checkAuth,
          handleAuth: this.handleAuth,
          handleDemoAuth: this.handleDemoAuth,
          checkAuthInProgress: checkAuthInProgress })
      );
    }

    var browserProps = _extends({}, this.plugin.getPluginState(), {
      username: this.username,
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      filterItems: this.filterItems,
      filterQuery: this.filterQuery,
      toggleSearch: this.toggleSearch,
      sortByTitle: this.sortByTitle,
      sortByDate: this.sortByDate,
      logout: this.logout,
      demo: this.plugin.opts.demo,
      isActiveRow: this.isActiveRow,
      isChecked: this.isChecked,
      toggleCheckbox: this.toggleCheckbox,
      handleScroll: this.handleScroll,
      done: this.donePicking,
      cancel: this.cancelPicking,
      title: this.plugin.title,
      viewType: this.opts.viewType,
      showTitles: this.opts.showTitles,
      showFilter: this.opts.showFilter,
      showBreadcrumbs: this.opts.showBreadcrumbs,
      pluginIcon: this.plugin.icon,
      i18n: this.plugin.uppy.i18n
    });

    return h(
      CloseWrapper,
      { onUnmount: this.clearSelection },
      h(Browser, browserProps)
    );
  };

  return ProviderView;
}();