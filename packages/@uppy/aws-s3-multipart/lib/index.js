var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require("@uppy/core"),
    Plugin = _require.Plugin;

var _require2 = require("@uppy/companion-client"),
    Socket = _require2.Socket,
    RequestClient = _require2.RequestClient;

var emitSocketProgress = require("@uppy/utils/lib/emitSocketProgress");
var getSocketHost = require("@uppy/utils/lib/getSocketHost");
var limitPromises = require("@uppy/utils/lib/limitPromises");
var Uploader = require("./MultipartUploader");

/**
 * Create a wrapper around an event emitter with a `remove` method to remove
 * all events that were added using the wrapped emitter.
 */
function createEventTracker(emitter) {
  var events = [];
  return {
    on: function on(event, fn) {
      events.push([event, fn]);
      return emitter.on(event, fn);
    },
    remove: function remove() {
      events.forEach(function (_ref) {
        var event = _ref[0],
            fn = _ref[1];

        emitter.off(event, fn);
      });
    }
  };
}

function assertServerError(res) {
  if (res && res.error) {
    var error = new Error(res.message);
    _extends(error, res.error);
    throw error;
  }
  return res;
}

module.exports = function (_Plugin) {
  _inherits(AwsS3Multipart, _Plugin);

  function AwsS3Multipart(uppy, opts) {
    _classCallCheck(this, AwsS3Multipart);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.type = "uploader";
    _this.id = "AwsS3Multipart";
    _this.title = "AWS S3 Multipart";
    _this.client = new RequestClient(uppy, opts);

    var defaultOptions = {
      timeout: 30 * 1000,
      limit: 0,
      createMultipartUpload: _this.createMultipartUpload.bind(_this),
      listParts: _this.listParts.bind(_this),
      prepareUploadPart: _this.prepareUploadPart.bind(_this),
      abortMultipartUpload: _this.abortMultipartUpload.bind(_this),
      completeMultipartUpload: _this.completeMultipartUpload.bind(_this)
    };

    _this.opts = _extends({}, defaultOptions, opts);

    _this.upload = _this.upload.bind(_this);

    if (typeof _this.opts.limit === "number" && _this.opts.limit !== 0) {
      _this.limitRequests = limitPromises(_this.opts.limit);
    } else {
      _this.limitRequests = function (fn) {
        return fn;
      };
    }

    _this.uploaders = Object.create(null);
    _this.uploaderEvents = Object.create(null);
    _this.uploaderSockets = Object.create(null);
    return _this;
  }

  /**
   * Clean up all references for a file's upload: the MultipartUploader instance,
   * any events related to the file, and the Companion WebSocket connection.
   */


  AwsS3Multipart.prototype.resetUploaderReferences = function resetUploaderReferences(fileID) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (this.uploaders[fileID]) {
      this.uploaders[fileID].abort({ really: opts.abort || false });
      this.uploaders[fileID] = null;
    }
    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID].remove();
      this.uploaderEvents[fileID] = null;
    }
    if (this.uploaderSockets[fileID]) {
      this.uploaderSockets[fileID].close();
      this.uploaderSockets[fileID] = null;
    }
  };

  AwsS3Multipart.prototype.assertHost = function assertHost() {
    if (!this.opts.serverUrl) {
      throw new Error("Expected a `serverUrl` option containing a Companion address.");
    }
  };

  AwsS3Multipart.prototype.createMultipartUpload = function createMultipartUpload(file, numParts) {
    this.assertHost();

    return this.client.post("getSignedMultipart", {
      fileName: file.name,
      cType: file.type,
      numParts: numParts
    }).then(assertServerError);
  };

  AwsS3Multipart.prototype.listParts = function listParts(file, _ref2) {
    var key = _ref2.key,
        uploadId = _ref2.uploadId;

    this.assertHost();

    var filename = encodeURIComponent(key);
    return this.client.get("s3/multipart/" + uploadId + "?key=" + filename).then(assertServerError);
  };

  AwsS3Multipart.prototype.prepareUploadPart = function prepareUploadPart(file, _ref3) {
    var _this2 = this;

    var key = _ref3.key,
        uploadId = _ref3.uploadId,
        number = _ref3.number;

    this.assertHost();

    return new Promise(function (resolve, reject) {
      if (!_this2.part || !_this2.parts.length || !_this2.parts[number - 1]) {
        reject(new Error("No part at " + index + " found for upload..."));
      } else {
        resolve(!_this2.parts[number - 1]);
      }
    });

    // const filename = encodeURIComponent(key)
    // return this.client.get(`s3/multipart/${uploadId}/${number}?key=${filename}`)
    //   .then(assertServerError)
  };

  AwsS3Multipart.prototype.completeMultipartUpload = function completeMultipartUpload(file, _ref4) {
    var url = _ref4.url,
        parts = _ref4.parts;

    this.assertHost();
    //const filename = encodeURIComponent(key)
    //const uploadIdEnc = encodeURIComponent(uploadId)
    return this.client.post(url, { parts: parts }).then(assertServerError);
  };

  AwsS3Multipart.prototype.abortMultipartUpload = function abortMultipartUpload(file, _ref5) {
    var url = _ref5.url;

    this.assertHost();

    //const filename = encodeURIComponent(key)
    //const uploadIdEnc = encodeURIComponent(uploadId)
    return this.client.delete(url).then(assertServerError);
  };

  AwsS3Multipart.prototype.uploadFile = function uploadFile(file) {
    var _this3 = this;

    return new Promise(function (resolve, reject) {
      var upload = new Uploader(file.data, _extends({
        // .bind to pass the file object to each handler.
        createMultipartUpload: _this3.limitRequests(_this3.opts.createMultipartUpload.bind(_this3, file)),
        listParts: _this3.limitRequests(_this3.opts.listParts.bind(_this3, file)),
        prepareUploadPart: _this3.opts.prepareUploadPart.bind(_this3, file),
        completeMultipartUpload: _this3.limitRequests(_this3.opts.completeMultipartUpload.bind(_this3, file)),
        abortMultipartUpload: _this3.limitRequests(_this3.opts.abortMultipartUpload.bind(_this3, file)),

        limit: _this3.opts.limit || 5,
        chunkSize: _this3.opts.chunkSize,
        onStart: function onStart(data) {
          var cFile = _this3.uppy.getFile(file.id);
          _this3.uppy.setFileState(file.id, {
            s3Multipart: _extends({}, cFile.s3Multipart, {
              key: data.key,
              uploadId: data.uploadId,
              parts: []
            })
          });
        },
        onProgress: function onProgress(bytesUploaded, bytesTotal) {
          _this3.uppy.emit("upload-progress", file, {
            uploader: _this3,
            bytesUploaded: bytesUploaded,
            bytesTotal: bytesTotal
          });
        },
        onError: function onError(err) {
          _this3.uppy.log(err);
          _this3.uppy.emit("upload-error", file, err);
          err.message = "Failed because: " + err.message;

          _this3.resetUploaderReferences(file.id);
          reject(err);
        },
        onSuccess: function onSuccess(result) {
          _this3.uppy.emit("upload-success", file, upload, result.location);

          if (result.location) {
            _this3.uppy.log("Download " + upload.file.name + " from " + result.location);
          }

          _this3.resetUploaderReferences(file.id);
          resolve(upload);
        },
        onPartComplete: function onPartComplete(part) {
          // Store completed parts in state.
          var cFile = _this3.uppy.getFile(file.id);
          if (!cFile) {
            return;
          }
          _this3.uppy.setFileState(file.id, {
            s3Multipart: _extends({}, cFile.s3Multipart, {
              parts: [].concat(cFile.s3Multipart.parts, [part])
            })
          });

          _this3.uppy.emit("s3-multipart:part-uploaded", cFile, part);
        }
      }, file.s3Multipart));

      _this3.uploaders[file.id] = upload;
      _this3.uploaderEvents[file.id] = createEventTracker(_this3.uppy);

      _this3.onFileRemove(file.id, function (removed) {
        _this3.resetUploaderReferences(file.id, { abort: true });
        resolve("upload " + removed.id + " was removed");
      });

      _this3.onFilePause(file.id, function (isPaused) {
        if (isPaused) {
          upload.pause();
        } else {
          upload.start();
        }
      });

      _this3.onPauseAll(file.id, function () {
        upload.pause();
      });

      _this3.onResumeAll(file.id, function () {
        upload.start();
      });

      if (!file.isPaused) {
        upload.start();
      }

      if (!file.isRestored) {
        _this3.uppy.emit("upload-started", file, upload);
      }
    });
  };

  AwsS3Multipart.prototype.uploadRemote = function uploadRemote(file) {
    var _this4 = this;

    this.resetUploaderReferences(file.id);

    return new Promise(function (resolve, reject) {
      if (file.serverToken) {
        return _this4.connectToServerSocket(file).then(function () {
          return resolve();
        }).catch(reject);
      }

      _this4.uppy.emit("upload-started", file);

      fetch(file.remote.url, {
        method: "post",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(_extends({}, file.remote.body, {
          protocol: "s3-multipart",
          size: file.data.size,
          metadata: file.meta
        }))
      }).then(function (res) {
        if (res.status < 200 || res.status > 300) {
          return reject(res.statusText);
        }

        return res.json().then(function (data) {
          _this4.uppy.setFileState(file.id, { serverToken: data.token });
          return _this4.uppy.getFile(file.id);
        });
      }).then(function (file) {
        return _this4.connectToServerSocket(file);
      }).then(function () {
        resolve();
      }).catch(function (err) {
        reject(new Error(err));
      });
    });
  };

  AwsS3Multipart.prototype.connectToServerSocket = function connectToServerSocket(file) {
    var _this5 = this;

    return new Promise(function (resolve, reject) {
      var token = file.serverToken;
      var host = getSocketHost(file.remote.serverUrl);
      var socket = new Socket({ target: host + "/api/" + token });
      _this5.uploaderSockets[socket] = socket;
      _this5.uploaderEvents[file.id] = createEventTracker(_this5.uppy);

      _this5.onFileRemove(file.id, function (removed) {
        _this5.resetUploaderReferences(file.id, { abort: true });
        resolve("upload " + file.id + " was removed");
      });

      _this5.onFilePause(file.id, function (isPaused) {
        socket.send(isPaused ? "pause" : "resume", {});
      });

      _this5.onPauseAll(file.id, function () {
        return socket.send("pause", {});
      });

      _this5.onResumeAll(file.id, function () {
        if (file.error) {
          socket.send("pause", {});
        }
        socket.send("resume", {});
      });

      _this5.onRetry(file.id, function () {
        socket.send("pause", {});
        socket.send("resume", {});
      });

      _this5.onRetryAll(file.id, function () {
        socket.send("pause", {});
        socket.send("resume", {});
      });

      if (file.isPaused) {
        socket.send("pause", {});
      }

      socket.on("progress", function (progressData) {
        return emitSocketProgress(_this5, progressData, file);
      });

      socket.on("error", function (errData) {
        _this5.uppy.emit("upload-error", file, new Error(errData.error));
        reject(new Error(errData.error));
      });

      socket.on("success", function (data) {
        _this5.uppy.emit("upload-success", file, data, data.url);
        resolve();
      });
    });
  };

  AwsS3Multipart.prototype.upload = function upload(fileIDs) {
    var _this6 = this;

    if (fileIDs.length === 0) return Promise.resolve();

    var promises = fileIDs.map(function (id) {
      var file = _this6.uppy.getFile(id);
      if (file.isRemote) {
        return _this6.uploadRemote(file);
      }
      return _this6.uploadFile(file);
    });

    return Promise.all(promises);
  };

  AwsS3Multipart.prototype.onFileRemove = function onFileRemove(fileID, cb) {
    this.uploaderEvents[fileID].on("file-removed", function (file) {
      if (fileID === file.id) cb(file.id);
    });
  };

  AwsS3Multipart.prototype.onFilePause = function onFilePause(fileID, cb) {
    this.uploaderEvents[fileID].on("upload-pause", function (targetFileID, isPaused) {
      if (fileID === targetFileID) {
        // const isPaused = this.uppy.pauseResume(fileID)
        cb(isPaused);
      }
    });
  };

  AwsS3Multipart.prototype.onRetry = function onRetry(fileID, cb) {
    this.uploaderEvents[fileID].on("upload-retry", function (targetFileID) {
      if (fileID === targetFileID) {
        cb();
      }
    });
  };

  AwsS3Multipart.prototype.onRetryAll = function onRetryAll(fileID, cb) {
    var _this7 = this;

    this.uploaderEvents[fileID].on("retry-all", function (filesToRetry) {
      if (!_this7.uppy.getFile(fileID)) return;
      cb();
    });
  };

  AwsS3Multipart.prototype.onPauseAll = function onPauseAll(fileID, cb) {
    var _this8 = this;

    this.uploaderEvents[fileID].on("pause-all", function () {
      if (!_this8.uppy.getFile(fileID)) return;
      cb();
    });
  };

  AwsS3Multipart.prototype.onResumeAll = function onResumeAll(fileID, cb) {
    var _this9 = this;

    this.uploaderEvents[fileID].on("resume-all", function () {
      if (!_this9.uppy.getFile(fileID)) return;
      cb();
    });
  };

  AwsS3Multipart.prototype.install = function install() {
    var _this10 = this;

    var _uppy$getState = this.uppy.getState(),
        capabilities = _uppy$getState.capabilities;

    this.uppy.setState({
      capabilities: _extends({}, capabilities, {
        resumableUploads: true
      })
    });
    this.uppy.addUploader(this.upload);

    this.uppy.on("cancel-all", function () {
      _this10.uppy.getFiles().forEach(function (file) {
        _this10.resetUploaderReferences(file.id, { abort: true });
      });
    });
  };

  AwsS3Multipart.prototype.uninstall = function uninstall() {
    this.uppy.setState({
      capabilities: _extends({}, this.uppy.getState().capabilities, {
        resumableUploads: false
      })
    });
    this.uppy.removeUploader(this.upload);
  };

  return AwsS3Multipart;
}(Plugin);