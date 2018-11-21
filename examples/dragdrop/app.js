(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */

var fingerprint = require('./lib/fingerprint.js');
var pad = require('./lib/pad.js');

var c = 0,
  blockSize = 4,
  base = 36,
  discreteValues = Math.pow(base, blockSize);

function randomBlock () {
  return pad((Math.random() *
    discreteValues << 0)
    .toString(base), blockSize);
}

function safeCounter () {
  c = c < discreteValues ? c : 0;
  c++; // this is not subliminal
  return c - 1;
}

function cuid () {
  // Starting with a lowercase letter makes
  // it HTML element ID friendly.
  var letter = 'c', // hard-coded allows for sequential access

    // timestamp
    // warning: this exposes the exact date and time
    // that the uid was created.
    timestamp = (new Date().getTime()).toString(base),

    // Prevent same-machine collisions.
    counter = pad(safeCounter().toString(base), blockSize),

    // A few chars to generate distinct ids for different
    // clients (so different computers are far less
    // likely to generate the same id)
    print = fingerprint(),

    // Grab some more chars from Math.random()
    random = randomBlock() + randomBlock();

  return letter + timestamp + counter + print + random;
}

cuid.slug = function slug () {
  var date = new Date().getTime().toString(36),
    counter = safeCounter().toString(36).slice(-4),
    print = fingerprint().slice(0, 1) +
      fingerprint().slice(-1),
    random = randomBlock().slice(-2);

  return date.slice(-2) +
    counter + print + random;
};

cuid.isCuid = function isCuid (stringToCheck) {
  if (typeof stringToCheck !== 'string') return false;
  if (stringToCheck.startsWith('c')) return true;
  return false;
};

cuid.isSlug = function isSlug (stringToCheck) {
  if (typeof stringToCheck !== 'string') return false;
  var stringLength = stringToCheck.length;
  if (stringLength >= 7 && stringLength <= 10) return true;
  return false;
};

cuid.fingerprint = fingerprint;

module.exports = cuid;

},{"./lib/fingerprint.js":2,"./lib/pad.js":3}],2:[function(require,module,exports){
var pad = require('./pad.js');

var env = typeof window === 'object' ? window : self;
var globalCount = Object.keys(env).length;
var mimeTypesLength = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
var clientId = pad((mimeTypesLength +
  navigator.userAgent.length).toString(36) +
  globalCount.toString(36), 4);

module.exports = function fingerprint () {
  return clientId;
};

},{"./pad.js":3}],3:[function(require,module,exports){
module.exports = function pad (num, size) {
  var s = '000000000' + num;
  return s.substr(s.length - size);
};

},{}],4:[function(require,module,exports){
module.exports = dragDrop

var flatten = require('flatten')
var parallel = require('run-parallel')

function dragDrop (elem, listeners) {
  if (typeof elem === 'string') {
    var selector = elem
    elem = window.document.querySelector(elem)
    if (!elem) {
      throw new Error('"' + selector + '" does not match any HTML elements')
    }
  }

  if (!elem) {
    throw new Error('"' + elem + '" is not a valid HTML element')
  }

  if (typeof listeners === 'function') {
    listeners = { onDrop: listeners }
  }

  var timeout

  elem.addEventListener('dragenter', onDragEnter, false)
  elem.addEventListener('dragover', onDragOver, false)
  elem.addEventListener('dragleave', onDragLeave, false)
  elem.addEventListener('drop', onDrop, false)

  // Function to remove drag-drop listeners
  return function remove () {
    removeDragClass()
    elem.removeEventListener('dragenter', onDragEnter, false)
    elem.removeEventListener('dragover', onDragOver, false)
    elem.removeEventListener('dragleave', onDragLeave, false)
    elem.removeEventListener('drop', onDrop, false)
  }

  function onDragEnter (e) {
    if (listeners.onDragEnter) {
      listeners.onDragEnter(e)
    }

    // Prevent event
    e.stopPropagation()
    e.preventDefault()
    return false
  }

  function onDragOver (e) {
    e.stopPropagation()
    e.preventDefault()
    if (e.dataTransfer.items) {
      // Only add "drag" class when `items` contains items that are able to be
      // handled by the registered listeners (files vs. text)
      var items = toArray(e.dataTransfer.items)
      var fileItems = items.filter(function (item) { return item.kind === 'file' })
      var textItems = items.filter(function (item) { return item.kind === 'string' })

      if (fileItems.length === 0 && !listeners.onDropText) return
      if (textItems.length === 0 && !listeners.onDrop) return
      if (fileItems.length === 0 && textItems.length === 0) return
    }

    elem.classList.add('drag')
    clearTimeout(timeout)

    if (listeners.onDragOver) {
      listeners.onDragOver(e)
    }

    e.dataTransfer.dropEffect = 'copy'
    return false
  }

  function onDragLeave (e) {
    e.stopPropagation()
    e.preventDefault()

    if (listeners.onDragLeave) {
      listeners.onDragLeave(e)
    }

    clearTimeout(timeout)
    timeout = setTimeout(removeDragClass, 50)

    return false
  }

  function onDrop (e) {
    e.stopPropagation()
    e.preventDefault()

    if (listeners.onDragLeave) {
      listeners.onDragLeave(e)
    }

    clearTimeout(timeout)
    removeDragClass()

    var pos = {
      x: e.clientX,
      y: e.clientY
    }

    // text drop support
    var text = e.dataTransfer.getData('text')
    if (text && listeners.onDropText) {
      listeners.onDropText(text, pos)
    }

    // file drop support
    if (e.dataTransfer.items) {
      // Handle directories in Chrome using the proprietary FileSystem API
      var items = toArray(e.dataTransfer.items).filter(function (item) {
        return item.kind === 'file'
      })

      if (items.length === 0) return

      parallel(items.map(function (item) {
        return function (cb) {
          processEntry(item.webkitGetAsEntry(), cb)
        }
      }), function (err, results) {
        // This catches permission errors with file:// in Chrome. This should never
        // throw in production code, so the user does not need to use try-catch.
        if (err) throw err
        if (listeners.onDrop) {
          listeners.onDrop(flatten(results), pos)
        }
      })
    } else {
      var files = toArray(e.dataTransfer.files)

      if (files.length === 0) return

      files.forEach(function (file) {
        file.fullPath = '/' + file.name
      })

      if (listeners.onDrop) {
        listeners.onDrop(files, pos)
      }
    }

    return false
  }

  function removeDragClass () {
    elem.classList.remove('drag')
  }
}

function processEntry (entry, cb) {
  var entries = []

  if (entry.isFile) {
    entry.file(function (file) {
      file.fullPath = entry.fullPath // preserve pathing for consumer
      cb(null, file)
    }, function (err) {
      cb(err)
    })
  } else if (entry.isDirectory) {
    var reader = entry.createReader()
    readEntries()
  }

  function readEntries () {
    reader.readEntries(function (entries_) {
      if (entries_.length > 0) {
        entries = entries.concat(toArray(entries_))
        readEntries() // continue reading entries until `readEntries` returns no more
      } else {
        doneEntries()
      }
    })
  }

  function doneEntries () {
    parallel(entries.map(function (entry) {
      return function (cb) {
        processEntry(entry, cb)
      }
    }), cb)
  }
}

function toArray (list) {
  return Array.prototype.slice.call(list || [], 0)
}

},{"flatten":6,"run-parallel":14}],5:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],6:[function(require,module,exports){
module.exports = function flatten(list, depth) {
  depth = (typeof depth == 'number') ? depth : Infinity;

  if (!depth) {
    if (Array.isArray(list)) {
      return list.map(function(i) { return i; });
    }
    return list;
  }

  return _flatten(list, 1);

  function _flatten(list, d) {
    return list.reduce(function (acc, item) {
      if (Array.isArray(item) && d < depth) {
        return acc.concat(_flatten(item, d + 1));
      }
      else {
        return acc.concat(item);
      }
    }, []);
  }
};

},{}],7:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed `func` invocations and a `flush` method to
 * immediately invoke them. Provide `options` to indicate whether `func`
 * should be invoked on the leading and/or trailing edge of the `wait`
 * timeout. The `func` is invoked with the last arguments provided to the
 * throttled function. Subsequent calls to the throttled function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the throttled function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=true]
 *  Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // Avoid excessively updating the position while scrolling.
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
 * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
 * jQuery(element).on('click', throttled);
 *
 * // Cancel the trailing throttled invocation.
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    'leading': leading,
    'maxWait': wait,
    'trailing': trailing
  });
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = throttle;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],8:[function(require,module,exports){
var wildcard = require('wildcard');
var reMimePartSplit = /[\/\+\.]/;

/**
  # mime-match

  A simple function to checker whether a target mime type matches a mime-type
  pattern (e.g. image/jpeg matches image/jpeg OR image/*).

  ## Example Usage

  <<< example.js

**/
module.exports = function(target, pattern) {
  function test(pattern) {
    var result = wildcard(pattern, target, reMimePartSplit);

    // ensure that we have a valid mime type (should have two parts)
    return result && result.length >= 2;
  }

  return pattern ? test(pattern.split(';')[0]) : test;
};

},{"wildcard":24}],9:[function(require,module,exports){
/**
* Create an event emitter with namespaces
* @name createNamespaceEmitter
* @example
* var emitter = require('./index')()
*
* emitter.on('*', function () {
*   console.log('all events emitted', this.event)
* })
*
* emitter.on('example', function () {
*   console.log('example event emitted')
* })
*/
module.exports = function createNamespaceEmitter () {
  var emitter = {}
  var _fns = emitter._fns = {}

  /**
  * Emit an event. Optionally namespace the event. Handlers are fired in the order in which they were added with exact matches taking precedence. Separate the namespace and event with a `:`
  * @name emit
  * @param {String} event – the name of the event, with optional namespace
  * @param {...*} data – up to 6 arguments that are passed to the event listener
  * @example
  * emitter.emit('example')
  * emitter.emit('demo:test')
  * emitter.emit('data', { example: true}, 'a string', 1)
  */
  emitter.emit = function emit (event, arg1, arg2, arg3, arg4, arg5, arg6) {
    var toEmit = getListeners(event)

    if (toEmit.length) {
      emitAll(event, toEmit, [arg1, arg2, arg3, arg4, arg5, arg6])
    }
  }

  /**
  * Create en event listener.
  * @name on
  * @param {String} event
  * @param {Function} fn
  * @example
  * emitter.on('example', function () {})
  * emitter.on('demo', function () {})
  */
  emitter.on = function on (event, fn) {
    if (!_fns[event]) {
      _fns[event] = []
    }

    _fns[event].push(fn)
  }

  /**
  * Create en event listener that fires once.
  * @name once
  * @param {String} event
  * @param {Function} fn
  * @example
  * emitter.once('example', function () {})
  * emitter.once('demo', function () {})
  */
  emitter.once = function once (event, fn) {
    function one () {
      fn.apply(this, arguments)
      emitter.off(event, one)
    }
    this.on(event, one)
  }

  /**
  * Stop listening to an event. Stop all listeners on an event by only passing the event name. Stop a single listener by passing that event handler as a callback.
  * You must be explicit about what will be unsubscribed: `emitter.off('demo')` will unsubscribe an `emitter.on('demo')` listener,
  * `emitter.off('demo:example')` will unsubscribe an `emitter.on('demo:example')` listener
  * @name off
  * @param {String} event
  * @param {Function} [fn] – the specific handler
  * @example
  * emitter.off('example')
  * emitter.off('demo', function () {})
  */
  emitter.off = function off (event, fn) {
    var keep = []

    if (event && fn) {
      var fns = this._fns[event]
      var i = 0
      var l = fns ? fns.length : 0

      for (i; i < l; i++) {
        if (fns[i] !== fn) {
          keep.push(fns[i])
        }
      }
    }

    keep.length ? this._fns[event] = keep : delete this._fns[event]
  }

  function getListeners (e) {
    var out = _fns[e] ? _fns[e] : []
    var idx = e.indexOf(':')
    var args = (idx === -1) ? [e] : [e.substring(0, idx), e.substring(idx + 1)]

    var keys = Object.keys(_fns)
    var i = 0
    var l = keys.length

    for (i; i < l; i++) {
      var key = keys[i]
      if (key === '*') {
        out = out.concat(_fns[key])
      }

      if (args.length === 2 && args[0] === key) {
        out = out.concat(_fns[key])
        break
      }
    }

    return out
  }

  function emitAll (e, fns, args) {
    var i = 0
    var l = fns.length

    for (i; i < l; i++) {
      if (!fns[i]) break
      fns[i].event = e
      fns[i].apply(fns[i], args)
    }
  }

  return emitter
}

},{}],10:[function(require,module,exports){
!function() {
    'use strict';
    function h(nodeName, attributes) {
        var lastSimple, child, simple, i, children = EMPTY_CHILDREN;
        for (i = arguments.length; i-- > 2; ) stack.push(arguments[i]);
        if (attributes && null != attributes.children) {
            if (!stack.length) stack.push(attributes.children);
            delete attributes.children;
        }
        while (stack.length) if ((child = stack.pop()) && void 0 !== child.pop) for (i = child.length; i--; ) stack.push(child[i]); else {
            if ('boolean' == typeof child) child = null;
            if (simple = 'function' != typeof nodeName) if (null == child) child = ''; else if ('number' == typeof child) child = String(child); else if ('string' != typeof child) simple = !1;
            if (simple && lastSimple) children[children.length - 1] += child; else if (children === EMPTY_CHILDREN) children = [ child ]; else children.push(child);
            lastSimple = simple;
        }
        var p = new VNode();
        p.nodeName = nodeName;
        p.children = children;
        p.attributes = null == attributes ? void 0 : attributes;
        p.key = null == attributes ? void 0 : attributes.key;
        if (void 0 !== options.vnode) options.vnode(p);
        return p;
    }
    function extend(obj, props) {
        for (var i in props) obj[i] = props[i];
        return obj;
    }
    function cloneElement(vnode, props) {
        return h(vnode.nodeName, extend(extend({}, vnode.attributes), props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children);
    }
    function enqueueRender(component) {
        if (!component.__d && (component.__d = !0) && 1 == items.push(component)) (options.debounceRendering || defer)(rerender);
    }
    function rerender() {
        var p, list = items;
        items = [];
        while (p = list.pop()) if (p.__d) renderComponent(p);
    }
    function isSameNodeType(node, vnode, hydrating) {
        if ('string' == typeof vnode || 'number' == typeof vnode) return void 0 !== node.splitText;
        if ('string' == typeof vnode.nodeName) return !node._componentConstructor && isNamedNode(node, vnode.nodeName); else return hydrating || node._componentConstructor === vnode.nodeName;
    }
    function isNamedNode(node, nodeName) {
        return node.__n === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
    }
    function getNodeProps(vnode) {
        var props = extend({}, vnode.attributes);
        props.children = vnode.children;
        var defaultProps = vnode.nodeName.defaultProps;
        if (void 0 !== defaultProps) for (var i in defaultProps) if (void 0 === props[i]) props[i] = defaultProps[i];
        return props;
    }
    function createNode(nodeName, isSvg) {
        var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
        node.__n = nodeName;
        return node;
    }
    function removeNode(node) {
        var parentNode = node.parentNode;
        if (parentNode) parentNode.removeChild(node);
    }
    function setAccessor(node, name, old, value, isSvg) {
        if ('className' === name) name = 'class';
        if ('key' === name) ; else if ('ref' === name) {
            if (old) old(null);
            if (value) value(node);
        } else if ('class' === name && !isSvg) node.className = value || ''; else if ('style' === name) {
            if (!value || 'string' == typeof value || 'string' == typeof old) node.style.cssText = value || '';
            if (value && 'object' == typeof value) {
                if ('string' != typeof old) for (var i in old) if (!(i in value)) node.style[i] = '';
                for (var i in value) node.style[i] = 'number' == typeof value[i] && !1 === IS_NON_DIMENSIONAL.test(i) ? value[i] + 'px' : value[i];
            }
        } else if ('dangerouslySetInnerHTML' === name) {
            if (value) node.innerHTML = value.__html || '';
        } else if ('o' == name[0] && 'n' == name[1]) {
            var useCapture = name !== (name = name.replace(/Capture$/, ''));
            name = name.toLowerCase().substring(2);
            if (value) {
                if (!old) node.addEventListener(name, eventProxy, useCapture);
            } else node.removeEventListener(name, eventProxy, useCapture);
            (node.__l || (node.__l = {}))[name] = value;
        } else if ('list' !== name && 'type' !== name && !isSvg && name in node) {
            try {
                node[name] = null == value ? '' : value;
            } catch (e) {}
            if ((null == value || !1 === value) && 'spellcheck' != name) node.removeAttribute(name);
        } else {
            var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));
            if (null == value || !1 === value) if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase()); else node.removeAttribute(name); else if ('function' != typeof value) if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value); else node.setAttribute(name, value);
        }
    }
    function eventProxy(e) {
        return this.__l[e.type](options.event && options.event(e) || e);
    }
    function flushMounts() {
        var c;
        while (c = mounts.pop()) {
            if (options.afterMount) options.afterMount(c);
            if (c.componentDidMount) c.componentDidMount();
        }
    }
    function diff(dom, vnode, context, mountAll, parent, componentRoot) {
        if (!diffLevel++) {
            isSvgMode = null != parent && void 0 !== parent.ownerSVGElement;
            hydrating = null != dom && !('__preactattr_' in dom);
        }
        var ret = idiff(dom, vnode, context, mountAll, componentRoot);
        if (parent && ret.parentNode !== parent) parent.appendChild(ret);
        if (!--diffLevel) {
            hydrating = !1;
            if (!componentRoot) flushMounts();
        }
        return ret;
    }
    function idiff(dom, vnode, context, mountAll, componentRoot) {
        var out = dom, prevSvgMode = isSvgMode;
        if (null == vnode || 'boolean' == typeof vnode) vnode = '';
        if ('string' == typeof vnode || 'number' == typeof vnode) {
            if (dom && void 0 !== dom.splitText && dom.parentNode && (!dom._component || componentRoot)) {
                if (dom.nodeValue != vnode) dom.nodeValue = vnode;
            } else {
                out = document.createTextNode(vnode);
                if (dom) {
                    if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                    recollectNodeTree(dom, !0);
                }
            }
            out.__preactattr_ = !0;
            return out;
        }
        var vnodeName = vnode.nodeName;
        if ('function' == typeof vnodeName) return buildComponentFromVNode(dom, vnode, context, mountAll);
        isSvgMode = 'svg' === vnodeName ? !0 : 'foreignObject' === vnodeName ? !1 : isSvgMode;
        vnodeName = String(vnodeName);
        if (!dom || !isNamedNode(dom, vnodeName)) {
            out = createNode(vnodeName, isSvgMode);
            if (dom) {
                while (dom.firstChild) out.appendChild(dom.firstChild);
                if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                recollectNodeTree(dom, !0);
            }
        }
        var fc = out.firstChild, props = out.__preactattr_, vchildren = vnode.children;
        if (null == props) {
            props = out.__preactattr_ = {};
            for (var a = out.attributes, i = a.length; i--; ) props[a[i].name] = a[i].value;
        }
        if (!hydrating && vchildren && 1 === vchildren.length && 'string' == typeof vchildren[0] && null != fc && void 0 !== fc.splitText && null == fc.nextSibling) {
            if (fc.nodeValue != vchildren[0]) fc.nodeValue = vchildren[0];
        } else if (vchildren && vchildren.length || null != fc) innerDiffNode(out, vchildren, context, mountAll, hydrating || null != props.dangerouslySetInnerHTML);
        diffAttributes(out, vnode.attributes, props);
        isSvgMode = prevSvgMode;
        return out;
    }
    function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
        var j, c, f, vchild, child, originalChildren = dom.childNodes, children = [], keyed = {}, keyedLen = 0, min = 0, len = originalChildren.length, childrenLen = 0, vlen = vchildren ? vchildren.length : 0;
        if (0 !== len) for (var i = 0; i < len; i++) {
            var _child = originalChildren[i], props = _child.__preactattr_, key = vlen && props ? _child._component ? _child._component.__k : props.key : null;
            if (null != key) {
                keyedLen++;
                keyed[key] = _child;
            } else if (props || (void 0 !== _child.splitText ? isHydrating ? _child.nodeValue.trim() : !0 : isHydrating)) children[childrenLen++] = _child;
        }
        if (0 !== vlen) for (var i = 0; i < vlen; i++) {
            vchild = vchildren[i];
            child = null;
            var key = vchild.key;
            if (null != key) {
                if (keyedLen && void 0 !== keyed[key]) {
                    child = keyed[key];
                    keyed[key] = void 0;
                    keyedLen--;
                }
            } else if (min < childrenLen) for (j = min; j < childrenLen; j++) if (void 0 !== children[j] && isSameNodeType(c = children[j], vchild, isHydrating)) {
                child = c;
                children[j] = void 0;
                if (j === childrenLen - 1) childrenLen--;
                if (j === min) min++;
                break;
            }
            child = idiff(child, vchild, context, mountAll);
            f = originalChildren[i];
            if (child && child !== dom && child !== f) if (null == f) dom.appendChild(child); else if (child === f.nextSibling) removeNode(f); else dom.insertBefore(child, f);
        }
        if (keyedLen) for (var i in keyed) if (void 0 !== keyed[i]) recollectNodeTree(keyed[i], !1);
        while (min <= childrenLen) if (void 0 !== (child = children[childrenLen--])) recollectNodeTree(child, !1);
    }
    function recollectNodeTree(node, unmountOnly) {
        var component = node._component;
        if (component) unmountComponent(component); else {
            if (null != node.__preactattr_ && node.__preactattr_.ref) node.__preactattr_.ref(null);
            if (!1 === unmountOnly || null == node.__preactattr_) removeNode(node);
            removeChildren(node);
        }
    }
    function removeChildren(node) {
        node = node.lastChild;
        while (node) {
            var next = node.previousSibling;
            recollectNodeTree(node, !0);
            node = next;
        }
    }
    function diffAttributes(dom, attrs, old) {
        var name;
        for (name in old) if ((!attrs || null == attrs[name]) && null != old[name]) setAccessor(dom, name, old[name], old[name] = void 0, isSvgMode);
        for (name in attrs) if (!('children' === name || 'innerHTML' === name || name in old && attrs[name] === ('value' === name || 'checked' === name ? dom[name] : old[name]))) setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
    }
    function createComponent(Ctor, props, context) {
        var inst, i = recyclerComponents.length;
        if (Ctor.prototype && Ctor.prototype.render) {
            inst = new Ctor(props, context);
            Component.call(inst, props, context);
        } else {
            inst = new Component(props, context);
            inst.constructor = Ctor;
            inst.render = doRender;
        }
        while (i--) if (recyclerComponents[i].constructor === Ctor) {
            inst.__b = recyclerComponents[i].__b;
            recyclerComponents.splice(i, 1);
            return inst;
        }
        return inst;
    }
    function doRender(props, state, context) {
        return this.constructor(props, context);
    }
    function setComponentProps(component, props, renderMode, context, mountAll) {
        if (!component.__x) {
            component.__x = !0;
            component.__r = props.ref;
            component.__k = props.key;
            delete props.ref;
            delete props.key;
            if (void 0 === component.constructor.getDerivedStateFromProps) if (!component.base || mountAll) {
                if (component.componentWillMount) component.componentWillMount();
            } else if (component.componentWillReceiveProps) component.componentWillReceiveProps(props, context);
            if (context && context !== component.context) {
                if (!component.__c) component.__c = component.context;
                component.context = context;
            }
            if (!component.__p) component.__p = component.props;
            component.props = props;
            component.__x = !1;
            if (0 !== renderMode) if (1 === renderMode || !1 !== options.syncComponentUpdates || !component.base) renderComponent(component, 1, mountAll); else enqueueRender(component);
            if (component.__r) component.__r(component);
        }
    }
    function renderComponent(component, renderMode, mountAll, isChild) {
        if (!component.__x) {
            var rendered, inst, cbase, props = component.props, state = component.state, context = component.context, previousProps = component.__p || props, previousState = component.__s || state, previousContext = component.__c || context, isUpdate = component.base, nextBase = component.__b, initialBase = isUpdate || nextBase, initialChildComponent = component._component, skip = !1, snapshot = previousContext;
            if (component.constructor.getDerivedStateFromProps) {
                state = extend(extend({}, state), component.constructor.getDerivedStateFromProps(props, state));
                component.state = state;
            }
            if (isUpdate) {
                component.props = previousProps;
                component.state = previousState;
                component.context = previousContext;
                if (2 !== renderMode && component.shouldComponentUpdate && !1 === component.shouldComponentUpdate(props, state, context)) skip = !0; else if (component.componentWillUpdate) component.componentWillUpdate(props, state, context);
                component.props = props;
                component.state = state;
                component.context = context;
            }
            component.__p = component.__s = component.__c = component.__b = null;
            component.__d = !1;
            if (!skip) {
                rendered = component.render(props, state, context);
                if (component.getChildContext) context = extend(extend({}, context), component.getChildContext());
                if (isUpdate && component.getSnapshotBeforeUpdate) snapshot = component.getSnapshotBeforeUpdate(previousProps, previousState);
                var toUnmount, base, childComponent = rendered && rendered.nodeName;
                if ('function' == typeof childComponent) {
                    var childProps = getNodeProps(rendered);
                    inst = initialChildComponent;
                    if (inst && inst.constructor === childComponent && childProps.key == inst.__k) setComponentProps(inst, childProps, 1, context, !1); else {
                        toUnmount = inst;
                        component._component = inst = createComponent(childComponent, childProps, context);
                        inst.__b = inst.__b || nextBase;
                        inst.__u = component;
                        setComponentProps(inst, childProps, 0, context, !1);
                        renderComponent(inst, 1, mountAll, !0);
                    }
                    base = inst.base;
                } else {
                    cbase = initialBase;
                    toUnmount = initialChildComponent;
                    if (toUnmount) cbase = component._component = null;
                    if (initialBase || 1 === renderMode) {
                        if (cbase) cbase._component = null;
                        base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, !0);
                    }
                }
                if (initialBase && base !== initialBase && inst !== initialChildComponent) {
                    var baseParent = initialBase.parentNode;
                    if (baseParent && base !== baseParent) {
                        baseParent.replaceChild(base, initialBase);
                        if (!toUnmount) {
                            initialBase._component = null;
                            recollectNodeTree(initialBase, !1);
                        }
                    }
                }
                if (toUnmount) unmountComponent(toUnmount);
                component.base = base;
                if (base && !isChild) {
                    var componentRef = component, t = component;
                    while (t = t.__u) (componentRef = t).base = base;
                    base._component = componentRef;
                    base._componentConstructor = componentRef.constructor;
                }
            }
            if (!isUpdate || mountAll) mounts.unshift(component); else if (!skip) {
                if (component.componentDidUpdate) component.componentDidUpdate(previousProps, previousState, snapshot);
                if (options.afterUpdate) options.afterUpdate(component);
            }
            while (component.__h.length) component.__h.pop().call(component);
            if (!diffLevel && !isChild) flushMounts();
        }
    }
    function buildComponentFromVNode(dom, vnode, context, mountAll) {
        var c = dom && dom._component, originalComponent = c, oldDom = dom, isDirectOwner = c && dom._componentConstructor === vnode.nodeName, isOwner = isDirectOwner, props = getNodeProps(vnode);
        while (c && !isOwner && (c = c.__u)) isOwner = c.constructor === vnode.nodeName;
        if (c && isOwner && (!mountAll || c._component)) {
            setComponentProps(c, props, 3, context, mountAll);
            dom = c.base;
        } else {
            if (originalComponent && !isDirectOwner) {
                unmountComponent(originalComponent);
                dom = oldDom = null;
            }
            c = createComponent(vnode.nodeName, props, context);
            if (dom && !c.__b) {
                c.__b = dom;
                oldDom = null;
            }
            setComponentProps(c, props, 1, context, mountAll);
            dom = c.base;
            if (oldDom && dom !== oldDom) {
                oldDom._component = null;
                recollectNodeTree(oldDom, !1);
            }
        }
        return dom;
    }
    function unmountComponent(component) {
        if (options.beforeUnmount) options.beforeUnmount(component);
        var base = component.base;
        component.__x = !0;
        if (component.componentWillUnmount) component.componentWillUnmount();
        component.base = null;
        var inner = component._component;
        if (inner) unmountComponent(inner); else if (base) {
            if (base.__preactattr_ && base.__preactattr_.ref) base.__preactattr_.ref(null);
            component.__b = base;
            removeNode(base);
            recyclerComponents.push(component);
            removeChildren(base);
        }
        if (component.__r) component.__r(null);
    }
    function Component(props, context) {
        this.__d = !0;
        this.context = context;
        this.props = props;
        this.state = this.state || {};
        this.__h = [];
    }
    function render(vnode, parent, merge) {
        return diff(merge, vnode, {}, !1, parent, !1);
    }
    var VNode = function() {};
    var options = {};
    var stack = [];
    var EMPTY_CHILDREN = [];
    var defer = 'function' == typeof Promise ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;
    var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
    var items = [];
    var mounts = [];
    var diffLevel = 0;
    var isSvgMode = !1;
    var hydrating = !1;
    var recyclerComponents = [];
    extend(Component.prototype, {
        setState: function(state, callback) {
            if (!this.__s) this.__s = this.state;
            this.state = extend(extend({}, this.state), 'function' == typeof state ? state(this.state, this.props) : state);
            if (callback) this.__h.push(callback);
            enqueueRender(this);
        },
        forceUpdate: function(callback) {
            if (callback) this.__h.push(callback);
            renderComponent(this, 2);
        },
        render: function() {}
    });
    var preact = {
        h: h,
        createElement: h,
        cloneElement: cloneElement,
        Component: Component,
        render: render,
        rerender: rerender,
        options: options
    };
    if ('undefined' != typeof module) module.exports = preact; else self.preact = preact;
}();

},{}],11:[function(require,module,exports){
module.exports = prettierBytes

function prettierBytes (num) {
  if (typeof num !== 'number' || isNaN(num)) {
    throw new TypeError('Expected a number, got ' + typeof num)
  }

  var neg = num < 0
  var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  if (neg) {
    num = -num
  }

  if (num < 1) {
    return (neg ? '-' : '') + num + ' B'
  }

  var exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
  num = Number(num / Math.pow(1000, exponent))
  var unit = units[exponent]

  if (num >= 10 || num % 1 === 0) {
    // Do not show decimals when the number is two-digit, or if the number has no
    // decimal component.
    return (neg ? '-' : '') + num.toFixed(0) + ' ' + unit
  } else {
    return (neg ? '-' : '') + num.toFixed(1) + ' ' + unit
  }
}

},{}],12:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , undef;

/**
 * Decode a URI encoded string.
 *
 * @param {String} input The URI encoded string.
 * @returns {String} The decoded string.
 * @api private
 */
function decode(input) {
  return decodeURIComponent(input.replace(/\+/g, ' '));
}

/**
 * Simple query string parser.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object}
 * @api public
 */
function querystring(query) {
  var parser = /([^=?&]+)=?([^&]*)/g
    , result = {}
    , part;

  while (part = parser.exec(query)) {
    var key = decode(part[1])
      , value = decode(part[2]);

    //
    // Prevent overriding of existing properties. This ensures that build-in
    // methods like `toString` or __proto__ are not overriden by malicious
    // querystrings.
    //
    if (key in result) continue;
    result[key] = value;
  }

  return result;
}

/**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
function querystringify(obj, prefix) {
  prefix = prefix || '';

  var pairs = []
    , value
    , key;

  //
  // Optionally prefix with a '?' if needed
  //
  if ('string' !== typeof prefix) prefix = '?';

  for (key in obj) {
    if (has.call(obj, key)) {
      value = obj[key];

      //
      // Edge cases where we actually want to encode the value to an empty
      // string instead of the stringified value.
      //
      if (!value && (value === null || value === undef || isNaN(value))) {
        value = '';
      }

      pairs.push(encodeURIComponent(key) +'='+ encodeURIComponent(value));
    }
  }

  return pairs.length ? prefix + pairs.join('&') : '';
}

//
// Expose the module.
//
exports.stringify = querystringify;
exports.parse = querystring;

},{}],13:[function(require,module,exports){
'use strict';

/**
 * Check if we're required to add a port number.
 *
 * @see https://url.spec.whatwg.org/#default-port
 * @param {Number|String} port Port number we need to check
 * @param {String} protocol Protocol we need to check against.
 * @returns {Boolean} Is it a default port for the given protocol
 * @api private
 */
module.exports = function required(port, protocol) {
  protocol = protocol.split(':')[0];
  port = +port;

  if (!port) return false;

  switch (protocol) {
    case 'http':
    case 'ws':
    return port !== 80;

    case 'https':
    case 'wss':
    return port !== 443;

    case 'ftp':
    return port !== 21;

    case 'gopher':
    return port !== 70;

    case 'file':
    return false;
  }

  return port !== 0;
};

},{}],14:[function(require,module,exports){
(function (process){
module.exports = runParallel

function runParallel (tasks, cb) {
  var results, pending, keys
  var isSync = true

  if (Array.isArray(tasks)) {
    results = []
    pending = tasks.length
  } else {
    keys = Object.keys(tasks)
    results = {}
    pending = keys.length
  }

  function done (err) {
    function end () {
      if (cb) cb(err, results)
      cb = null
    }
    if (isSync) process.nextTick(end)
    else end()
  }

  function each (i, err, result) {
    results[i] = result
    if (--pending === 0 || err) {
      done(err)
    }
  }

  if (!pending) {
    // empty
    done(null)
  } else if (keys) {
    // object
    keys.forEach(function (key) {
      tasks[key](function (err, result) { each(key, err, result) })
    })
  } else {
    // array
    tasks.forEach(function (task, i) {
      task(function (err, result) { each(i, err, result) })
    })
  }

  isSync = false
}

}).call(this,require('_process'))

},{"_process":48}],15:[function(require,module,exports){
// Generated by Babel
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encode = encode;
/* global: window */

var _window = window;
var btoa = _window.btoa;
function encode(data) {
  return btoa(unescape(encodeURIComponent(data)));
}

var isSupported = exports.isSupported = "btoa" in window;
},{}],16:[function(require,module,exports){
// Generated by Babel
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.newRequest = newRequest;
exports.resolveUrl = resolveUrl;

var _urlParse = require("url-parse");

var _urlParse2 = _interopRequireDefault(_urlParse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function newRequest() {
  return new window.XMLHttpRequest();
} /* global window */


function resolveUrl(origin, link) {
  return new _urlParse2.default(link, origin).toString();
}
},{"url-parse":23}],17:[function(require,module,exports){
// Generated by Babel
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSource = getSource;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FileSource = function () {
  function FileSource(file) {
    _classCallCheck(this, FileSource);

    this._file = file;
    this.size = file.size;
  }

  _createClass(FileSource, [{
    key: "slice",
    value: function slice(start, end) {
      return this._file.slice(start, end);
    }
  }, {
    key: "close",
    value: function close() {}
  }]);

  return FileSource;
}();

function getSource(input) {
  // Since we emulate the Blob type in our tests (not all target browsers
  // support it), we cannot use `instanceof` for testing whether the input value
  // can be handled. Instead, we simply check is the slice() function and the
  // size property are available.
  if (typeof input.slice === "function" && typeof input.size !== "undefined") {
    return new FileSource(input);
  }

  throw new Error("source object may only be an instance of File or Blob in this environment");
}
},{}],18:[function(require,module,exports){
// Generated by Babel
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setItem = setItem;
exports.getItem = getItem;
exports.removeItem = removeItem;
/* global window, localStorage */

var hasStorage = false;
try {
  hasStorage = "localStorage" in window;

  // Attempt to store and read entries from the local storage to detect Private
  // Mode on Safari on iOS (see #49)
  var key = "tusSupport";
  localStorage.setItem(key, localStorage.getItem(key));
} catch (e) {
  // If we try to access localStorage inside a sandboxed iframe, a SecurityError
  // is thrown. When in private mode on iOS Safari, a QuotaExceededError is
  // thrown (see #49)
  if (e.code === e.SECURITY_ERR || e.code === e.QUOTA_EXCEEDED_ERR) {
    hasStorage = false;
  } else {
    throw e;
  }
}

var canStoreURLs = exports.canStoreURLs = hasStorage;

function setItem(key, value) {
  if (!hasStorage) return;
  return localStorage.setItem(key, value);
}

function getItem(key) {
  if (!hasStorage) return;
  return localStorage.getItem(key);
}

function removeItem(key) {
  if (!hasStorage) return;
  return localStorage.removeItem(key);
}
},{}],19:[function(require,module,exports){
// Generated by Babel
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DetailedError = function (_Error) {
  _inherits(DetailedError, _Error);

  function DetailedError(error) {
    var causingErr = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var xhr = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

    _classCallCheck(this, DetailedError);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(DetailedError).call(this, error.message));

    _this.originalRequest = xhr;
    _this.causingError = causingErr;

    var message = error.message;
    if (causingErr != null) {
      message += ", caused by " + causingErr.toString();
    }
    if (xhr != null) {
      message += ", originated from request (response code: " + xhr.status + ", response text: " + xhr.responseText + ")";
    }
    _this.message = message;
    return _this;
  }

  return DetailedError;
}(Error);

exports.default = DetailedError;
},{}],20:[function(require,module,exports){
// Generated by Babel
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fingerprint;
/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @return {String}
 */
function fingerprint(file, options) {
  return ["tus", file.name, file.type, file.size, file.lastModified, options.endpoint].join("-");
}
},{}],21:[function(require,module,exports){
// Generated by Babel
"use strict";

var _upload = require("./upload");

var _upload2 = _interopRequireDefault(_upload);

var _storage = require("./node/storage");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global window */
var defaultOptions = _upload2.default.defaultOptions;

var isSupported = void 0;

if (typeof window !== "undefined") {
  // Browser environment using XMLHttpRequest
  var _window = window;
  var XMLHttpRequest = _window.XMLHttpRequest;
  var Blob = _window.Blob;


  isSupported = XMLHttpRequest && Blob && typeof Blob.prototype.slice === "function";
} else {
  // Node.js environment using http module
  isSupported = true;
}

// The usage of the commonjs exporting syntax instead of the new ECMAScript
// one is actually inteded and prevents weird behaviour if we are trying to
// import this module in another module using Babel.
module.exports = {
  Upload: _upload2.default,
  isSupported: isSupported,
  canStoreURLs: _storage.canStoreURLs,
  defaultOptions: defaultOptions
};
},{"./node/storage":18,"./upload":22}],22:[function(require,module,exports){
// Generated by Babel
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* global window */


// We import the files used inside the Node environment which are rewritten
// for browsers using the rules defined in the package.json


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fingerprint = require("./fingerprint");

var _fingerprint2 = _interopRequireDefault(_fingerprint);

var _error = require("./error");

var _error2 = _interopRequireDefault(_error);

var _extend = require("extend");

var _extend2 = _interopRequireDefault(_extend);

var _request = require("./node/request");

var _source = require("./node/source");

var _base = require("./node/base64");

var Base64 = _interopRequireWildcard(_base);

var _storage = require("./node/storage");

var Storage = _interopRequireWildcard(_storage);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultOptions = {
  endpoint: null,
  fingerprint: _fingerprint2.default,
  resume: true,
  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,
  headers: {},
  chunkSize: Infinity,
  withCredentials: false,
  uploadUrl: null,
  uploadSize: null,
  overridePatchMethod: false,
  retryDelays: null,
  removeFingerprintOnSuccess: false
};

var Upload = function () {
  function Upload(file, options) {
    _classCallCheck(this, Upload);

    this.options = (0, _extend2.default)(true, {}, defaultOptions, options);

    // The underlying File/Blob object
    this.file = file;

    // The URL against which the file will be uploaded
    this.url = null;

    // The underlying XHR object for the current PATCH request
    this._xhr = null;

    // The fingerpinrt for the current file (set after start())
    this._fingerprint = null;

    // The offset used in the current PATCH request
    this._offset = null;

    // True if the current PATCH request has been aborted
    this._aborted = false;

    // The file's size in bytes
    this._size = null;

    // The Source object which will wrap around the given file and provides us
    // with a unified interface for getting its size and slice chunks from its
    // content allowing us to easily handle Files, Blobs, Buffers and Streams.
    this._source = null;

    // The current count of attempts which have been made. Null indicates none.
    this._retryAttempt = 0;

    // The timeout's ID which is used to delay the next retry
    this._retryTimeout = null;

    // The offset of the remote upload before the latest attempt was started.
    this._offsetBeforeRetry = 0;
  }

  _createClass(Upload, [{
    key: "start",
    value: function start() {
      var _this = this;

      var file = this.file;

      if (!file) {
        this._emitError(new Error("tus: no file or stream to upload provided"));
        return;
      }

      if (!this.options.endpoint && !this.options.uploadUrl) {
        this._emitError(new Error("tus: neither an endpoint or an upload URL is provided"));
        return;
      }

      var source = this._source = (0, _source.getSource)(file, this.options.chunkSize);

      // Firstly, check if the caller has supplied a manual upload size or else
      // we will use the calculated size by the source object.
      if (this.options.uploadSize != null) {
        var size = +this.options.uploadSize;
        if (isNaN(size)) {
          throw new Error("tus: cannot convert `uploadSize` option into a number");
        }

        this._size = size;
      } else {
        var size = source.size;

        // The size property will be null if we cannot calculate the file's size,
        // for example if you handle a stream.
        if (size == null) {
          throw new Error("tus: cannot automatically derive upload's size from input and must be specified manually using the `uploadSize` option");
        }

        this._size = size;
      }

      var retryDelays = this.options.retryDelays;
      if (retryDelays != null) {
        if (Object.prototype.toString.call(retryDelays) !== "[object Array]") {
          throw new Error("tus: the `retryDelays` option must either be an array or null");
        } else {
          (function () {
            var errorCallback = _this.options.onError;
            _this.options.onError = function (err) {
              // Restore the original error callback which may have been set.
              _this.options.onError = errorCallback;

              // We will reset the attempt counter if
              // - we were already able to connect to the server (offset != null) and
              // - we were able to upload a small chunk of data to the server
              var shouldResetDelays = _this._offset != null && _this._offset > _this._offsetBeforeRetry;
              if (shouldResetDelays) {
                _this._retryAttempt = 0;
              }

              var isOnline = true;
              if (typeof window !== "undefined" && "navigator" in window && window.navigator.onLine === false) {
                isOnline = false;
              }

              // We only attempt a retry if
              // - we didn't exceed the maxium number of retries, yet, and
              // - this error was caused by a request or it's response and
              // - the error is not a client error (status 4xx) and
              // - the browser does not indicate that we are offline
              var shouldRetry = _this._retryAttempt < retryDelays.length && err.originalRequest != null && !inStatusCategory(err.originalRequest.status, 400) && isOnline;

              if (!shouldRetry) {
                _this._emitError(err);
                return;
              }

              var delay = retryDelays[_this._retryAttempt++];

              _this._offsetBeforeRetry = _this._offset;
              _this.options.uploadUrl = _this.url;

              _this._retryTimeout = setTimeout(function () {
                _this.start();
              }, delay);
            };
          })();
        }
      }

      // Reset the aborted flag when the upload is started or else the
      // _startUpload will stop before sending a request if the upload has been
      // aborted previously.
      this._aborted = false;

      // The upload had been started previously and we should reuse this URL.
      if (this.url != null) {
        this._resumeUpload();
        return;
      }

      // A URL has manually been specified, so we try to resume
      if (this.options.uploadUrl != null) {
        this.url = this.options.uploadUrl;
        this._resumeUpload();
        return;
      }

      // Try to find the endpoint for the file in the storage
      if (this.options.resume) {
        this._fingerprint = this.options.fingerprint(file, this.options);
        var resumedUrl = Storage.getItem(this._fingerprint);

        if (resumedUrl != null) {
          this.url = resumedUrl;
          this._resumeUpload();
          return;
        }
      }

      // An upload has not started for the file yet, so we start a new one
      this._createUpload();
    }
  }, {
    key: "abort",
    value: function abort() {
      if (this._xhr !== null) {
        this._xhr.abort();
        this._source.close();
        this._aborted = true;
      }

      if (this._retryTimeout != null) {
        clearTimeout(this._retryTimeout);
        this._retryTimeout = null;
      }
    }
  }, {
    key: "_emitXhrError",
    value: function _emitXhrError(xhr, err, causingErr) {
      this._emitError(new _error2.default(err, causingErr, xhr));
    }
  }, {
    key: "_emitError",
    value: function _emitError(err) {
      if (typeof this.options.onError === "function") {
        this.options.onError(err);
      } else {
        throw err;
      }
    }
  }, {
    key: "_emitSuccess",
    value: function _emitSuccess() {
      if (typeof this.options.onSuccess === "function") {
        this.options.onSuccess();
      }
    }

    /**
     * Publishes notification when data has been sent to the server. This
     * data may not have been accepted by the server yet.
     * @param  {number} bytesSent  Number of bytes sent to the server.
     * @param  {number} bytesTotal Total number of bytes to be sent to the server.
     */

  }, {
    key: "_emitProgress",
    value: function _emitProgress(bytesSent, bytesTotal) {
      if (typeof this.options.onProgress === "function") {
        this.options.onProgress(bytesSent, bytesTotal);
      }
    }

    /**
     * Publishes notification when a chunk of data has been sent to the server
     * and accepted by the server.
     * @param  {number} chunkSize  Size of the chunk that was accepted by the
     *                             server.
     * @param  {number} bytesAccepted Total number of bytes that have been
     *                                accepted by the server.
     * @param  {number} bytesTotal Total number of bytes to be sent to the server.
     */

  }, {
    key: "_emitChunkComplete",
    value: function _emitChunkComplete(chunkSize, bytesAccepted, bytesTotal) {
      if (typeof this.options.onChunkComplete === "function") {
        this.options.onChunkComplete(chunkSize, bytesAccepted, bytesTotal);
      }
    }

    /**
     * Set the headers used in the request and the withCredentials property
     * as defined in the options
     *
     * @param {XMLHttpRequest} xhr
     */

  }, {
    key: "_setupXHR",
    value: function _setupXHR(xhr) {
      this._xhr = xhr;

      xhr.setRequestHeader("Tus-Resumable", "1.0.0");
      var headers = this.options.headers;

      for (var name in headers) {
        xhr.setRequestHeader(name, headers[name]);
      }

      xhr.withCredentials = this.options.withCredentials;
    }

    /**
     * Create a new upload using the creation extension by sending a POST
     * request to the endpoint. After successful creation the file will be
     * uploaded
     *
     * @api private
     */

  }, {
    key: "_createUpload",
    value: function _createUpload() {
      var _this2 = this;

      if (!this.options.endpoint) {
        this._emitError(new Error("tus: unable to create upload because no endpoint is provided"));
        return;
      }

      var xhr = (0, _request.newRequest)();
      xhr.open("POST", this.options.endpoint, true);

      xhr.onload = function () {
        if (!inStatusCategory(xhr.status, 200)) {
          _this2._emitXhrError(xhr, new Error("tus: unexpected response while creating upload"));
          return;
        }

        var location = xhr.getResponseHeader("Location");
        if (location == null) {
          _this2._emitXhrError(xhr, new Error("tus: invalid or missing Location header"));
          return;
        }

        _this2.url = (0, _request.resolveUrl)(_this2.options.endpoint, location);

        if (_this2._size === 0) {
          // Nothing to upload and file was successfully created
          _this2._emitSuccess();
          _this2._source.close();
          return;
        }

        if (_this2.options.resume) {
          Storage.setItem(_this2._fingerprint, _this2.url);
        }

        _this2._offset = 0;
        _this2._startUpload();
      };

      xhr.onerror = function (err) {
        _this2._emitXhrError(xhr, new Error("tus: failed to create upload"), err);
      };

      this._setupXHR(xhr);
      xhr.setRequestHeader("Upload-Length", this._size);

      // Add metadata if values have been added
      var metadata = encodeMetadata(this.options.metadata);
      if (metadata !== "") {
        xhr.setRequestHeader("Upload-Metadata", metadata);
      }

      xhr.send(null);
    }

    /*
     * Try to resume an existing upload. First a HEAD request will be sent
     * to retrieve the offset. If the request fails a new upload will be
     * created. In the case of a successful response the file will be uploaded.
     *
     * @api private
     */

  }, {
    key: "_resumeUpload",
    value: function _resumeUpload() {
      var _this3 = this;

      var xhr = (0, _request.newRequest)();
      xhr.open("HEAD", this.url, true);

      xhr.onload = function () {
        if (!inStatusCategory(xhr.status, 200)) {
          if (_this3.options.resume && inStatusCategory(xhr.status, 400)) {
            // Remove stored fingerprint and corresponding endpoint,
            // on client errors since the file can not be found
            Storage.removeItem(_this3._fingerprint);
          }

          // If the upload is locked (indicated by the 423 Locked status code), we
          // emit an error instead of directly starting a new upload. This way the
          // retry logic can catch the error and will retry the upload. An upload
          // is usually locked for a short period of time and will be available
          // afterwards.
          if (xhr.status === 423) {
            _this3._emitXhrError(xhr, new Error("tus: upload is currently locked; retry later"));
            return;
          }

          if (!_this3.options.endpoint) {
            // Don't attempt to create a new upload if no endpoint is provided.
            _this3._emitXhrError(xhr, new Error("tus: unable to resume upload (new upload cannot be created without an endpoint)"));
            return;
          }

          // Try to create a new upload
          _this3.url = null;
          _this3._createUpload();
          return;
        }

        var offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10);
        if (isNaN(offset)) {
          _this3._emitXhrError(xhr, new Error("tus: invalid or missing offset value"));
          return;
        }

        var length = parseInt(xhr.getResponseHeader("Upload-Length"), 10);
        if (isNaN(length)) {
          _this3._emitXhrError(xhr, new Error("tus: invalid or missing length value"));
          return;
        }

        // Upload has already been completed and we do not need to send additional
        // data to the server
        if (offset === length) {
          _this3._emitProgress(length, length);
          _this3._emitSuccess();
          return;
        }

        _this3._offset = offset;
        _this3._startUpload();
      };

      xhr.onerror = function (err) {
        _this3._emitXhrError(xhr, new Error("tus: failed to resume upload"), err);
      };

      this._setupXHR(xhr);
      xhr.send(null);
    }

    /**
     * Start uploading the file using PATCH requests. The file will be divided
     * into chunks as specified in the chunkSize option. During the upload
     * the onProgress event handler may be invoked multiple times.
     *
     * @api private
     */

  }, {
    key: "_startUpload",
    value: function _startUpload() {
      var _this4 = this;

      // If the upload has been aborted, we will not send the next PATCH request.
      // This is important if the abort method was called during a callback, such
      // as onChunkComplete or onProgress.
      if (this._aborted) {
        return;
      }

      var xhr = (0, _request.newRequest)();

      // Some browser and servers may not support the PATCH method. For those
      // cases, you can tell tus-js-client to use a POST request with the
      // X-HTTP-Method-Override header for simulating a PATCH request.
      if (this.options.overridePatchMethod) {
        xhr.open("POST", this.url, true);
        xhr.setRequestHeader("X-HTTP-Method-Override", "PATCH");
      } else {
        xhr.open("PATCH", this.url, true);
      }

      xhr.onload = function () {
        if (!inStatusCategory(xhr.status, 200)) {
          _this4._emitXhrError(xhr, new Error("tus: unexpected response while uploading chunk"));
          return;
        }

        var offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10);
        if (isNaN(offset)) {
          _this4._emitXhrError(xhr, new Error("tus: invalid or missing offset value"));
          return;
        }

        _this4._emitProgress(offset, _this4._size);
        _this4._emitChunkComplete(offset - _this4._offset, offset, _this4._size);

        _this4._offset = offset;

        if (offset == _this4._size) {
          if (_this4.options.removeFingerprintOnSuccess && _this4.options.resume) {
            // Remove stored fingerprint and corresponding endpoint. This causes
            // new upload of the same file must be treated as a different file.
            Storage.removeItem(_this4._fingerprint);
          }

          // Yay, finally done :)
          _this4._emitSuccess();
          _this4._source.close();
          return;
        }

        _this4._startUpload();
      };

      xhr.onerror = function (err) {
        // Don't emit an error if the upload was aborted manually
        if (_this4._aborted) {
          return;
        }

        _this4._emitXhrError(xhr, new Error("tus: failed to upload chunk at offset " + _this4._offset), err);
      };

      // Test support for progress events before attaching an event listener
      if ("upload" in xhr) {
        xhr.upload.onprogress = function (e) {
          if (!e.lengthComputable) {
            return;
          }

          _this4._emitProgress(start + e.loaded, _this4._size);
        };
      }

      this._setupXHR(xhr);

      xhr.setRequestHeader("Upload-Offset", this._offset);
      xhr.setRequestHeader("Content-Type", "application/offset+octet-stream");

      var start = this._offset;
      var end = this._offset + this.options.chunkSize;

      // The specified chunkSize may be Infinity or the calcluated end position
      // may exceed the file's size. In both cases, we limit the end position to
      // the input's total size for simpler calculations and correctness.
      if (end === Infinity || end > this._size) {
        end = this._size;
      }

      xhr.send(this._source.slice(start, end));

      // Emit an progress event when a new chunk begins being uploaded.
      this._emitProgress(this._offset, this._size);
    }
  }]);

  return Upload;
}();

function encodeMetadata(metadata) {
  if (!Base64.isSupported) {
    return "";
  }

  var encoded = [];

  for (var key in metadata) {
    encoded.push(key + " " + Base64.encode(metadata[key]));
  }

  return encoded.join(",");
}

/**
 * Checks whether a given status is in the range of the expected category.
 * For example, only a status between 200 and 299 will satisfy the category 200.
 *
 * @api private
 */
function inStatusCategory(status, category) {
  return status >= category && status < category + 100;
}

Upload.defaultOptions = defaultOptions;

exports.default = Upload;
},{"./error":19,"./fingerprint":20,"./node/base64":15,"./node/request":16,"./node/source":17,"./node/storage":18,"extend":5}],23:[function(require,module,exports){
(function (global){
'use strict';

var required = require('requires-port')
  , qs = require('querystringify')
  , protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i
  , slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//;

/**
 * These are the parse rules for the URL parser, it informs the parser
 * about:
 *
 * 0. The char it Needs to parse, if it's a string it should be done using
 *    indexOf, RegExp using exec and NaN means set as current value.
 * 1. The property we should set when parsing this value.
 * 2. Indication if it's backwards or forward parsing, when set as number it's
 *    the value of extra chars that should be split off.
 * 3. Inherit from location if non existing in the parser.
 * 4. `toLowerCase` the resulting value.
 */
var rules = [
  ['#', 'hash'],                        // Extract from the back.
  ['?', 'query'],                       // Extract from the back.
  function sanitize(address) {          // Sanitize what is left of the address
    return address.replace('\\', '/');
  },
  ['/', 'pathname'],                    // Extract from the back.
  ['@', 'auth', 1],                     // Extract from the front.
  [NaN, 'host', undefined, 1, 1],       // Set left over value.
  [/:(\d+)$/, 'port', undefined, 1],    // RegExp the back.
  [NaN, 'hostname', undefined, 1, 1]    // Set left over.
];

/**
 * These properties should not be copied or inherited from. This is only needed
 * for all non blob URL's as a blob URL does not include a hash, only the
 * origin.
 *
 * @type {Object}
 * @private
 */
var ignore = { hash: 1, query: 1 };

/**
 * The location object differs when your code is loaded through a normal page,
 * Worker or through a worker using a blob. And with the blobble begins the
 * trouble as the location object will contain the URL of the blob, not the
 * location of the page where our code is loaded in. The actual origin is
 * encoded in the `pathname` so we can thankfully generate a good "default"
 * location from it so we can generate proper relative URL's again.
 *
 * @param {Object|String} loc Optional default location object.
 * @returns {Object} lolcation object.
 * @public
 */
function lolcation(loc) {
  var globalVar;

  if (typeof window !== 'undefined') globalVar = window;
  else if (typeof global !== 'undefined') globalVar = global;
  else if (typeof self !== 'undefined') globalVar = self;
  else globalVar = {};

  var location = globalVar.location || {};
  loc = loc || location;

  var finaldestination = {}
    , type = typeof loc
    , key;

  if ('blob:' === loc.protocol) {
    finaldestination = new Url(unescape(loc.pathname), {});
  } else if ('string' === type) {
    finaldestination = new Url(loc, {});
    for (key in ignore) delete finaldestination[key];
  } else if ('object' === type) {
    for (key in loc) {
      if (key in ignore) continue;
      finaldestination[key] = loc[key];
    }

    if (finaldestination.slashes === undefined) {
      finaldestination.slashes = slashes.test(loc.href);
    }
  }

  return finaldestination;
}

/**
 * @typedef ProtocolExtract
 * @type Object
 * @property {String} protocol Protocol matched in the URL, in lowercase.
 * @property {Boolean} slashes `true` if protocol is followed by "//", else `false`.
 * @property {String} rest Rest of the URL that is not part of the protocol.
 */

/**
 * Extract protocol information from a URL with/without double slash ("//").
 *
 * @param {String} address URL we want to extract from.
 * @return {ProtocolExtract} Extracted information.
 * @private
 */
function extractProtocol(address) {
  var match = protocolre.exec(address);

  return {
    protocol: match[1] ? match[1].toLowerCase() : '',
    slashes: !!match[2],
    rest: match[3]
  };
}

/**
 * Resolve a relative URL pathname against a base URL pathname.
 *
 * @param {String} relative Pathname of the relative URL.
 * @param {String} base Pathname of the base URL.
 * @return {String} Resolved pathname.
 * @private
 */
function resolve(relative, base) {
  var path = (base || '/').split('/').slice(0, -1).concat(relative.split('/'))
    , i = path.length
    , last = path[i - 1]
    , unshift = false
    , up = 0;

  while (i--) {
    if (path[i] === '.') {
      path.splice(i, 1);
    } else if (path[i] === '..') {
      path.splice(i, 1);
      up++;
    } else if (up) {
      if (i === 0) unshift = true;
      path.splice(i, 1);
      up--;
    }
  }

  if (unshift) path.unshift('');
  if (last === '.' || last === '..') path.push('');

  return path.join('/');
}

/**
 * The actual URL instance. Instead of returning an object we've opted-in to
 * create an actual constructor as it's much more memory efficient and
 * faster and it pleases my OCD.
 *
 * It is worth noting that we should not use `URL` as class name to prevent
 * clashes with the global URL instance that got introduced in browsers.
 *
 * @constructor
 * @param {String} address URL we want to parse.
 * @param {Object|String} [location] Location defaults for relative paths.
 * @param {Boolean|Function} [parser] Parser for the query string.
 * @private
 */
function Url(address, location, parser) {
  if (!(this instanceof Url)) {
    return new Url(address, location, parser);
  }

  var relative, extracted, parse, instruction, index, key
    , instructions = rules.slice()
    , type = typeof location
    , url = this
    , i = 0;

  //
  // The following if statements allows this module two have compatibility with
  // 2 different API:
  //
  // 1. Node.js's `url.parse` api which accepts a URL, boolean as arguments
  //    where the boolean indicates that the query string should also be parsed.
  //
  // 2. The `URL` interface of the browser which accepts a URL, object as
  //    arguments. The supplied object will be used as default values / fall-back
  //    for relative paths.
  //
  if ('object' !== type && 'string' !== type) {
    parser = location;
    location = null;
  }

  if (parser && 'function' !== typeof parser) parser = qs.parse;

  location = lolcation(location);

  //
  // Extract protocol information before running the instructions.
  //
  extracted = extractProtocol(address || '');
  relative = !extracted.protocol && !extracted.slashes;
  url.slashes = extracted.slashes || relative && location.slashes;
  url.protocol = extracted.protocol || location.protocol || '';
  address = extracted.rest;

  //
  // When the authority component is absent the URL starts with a path
  // component.
  //
  if (!extracted.slashes) instructions[3] = [/(.*)/, 'pathname'];

  for (; i < instructions.length; i++) {
    instruction = instructions[i];

    if (typeof instruction === 'function') {
      address = instruction(address);
      continue;
    }

    parse = instruction[0];
    key = instruction[1];

    if (parse !== parse) {
      url[key] = address;
    } else if ('string' === typeof parse) {
      if (~(index = address.indexOf(parse))) {
        if ('number' === typeof instruction[2]) {
          url[key] = address.slice(0, index);
          address = address.slice(index + instruction[2]);
        } else {
          url[key] = address.slice(index);
          address = address.slice(0, index);
        }
      }
    } else if ((index = parse.exec(address))) {
      url[key] = index[1];
      address = address.slice(0, index.index);
    }

    url[key] = url[key] || (
      relative && instruction[3] ? location[key] || '' : ''
    );

    //
    // Hostname, host and protocol should be lowercased so they can be used to
    // create a proper `origin`.
    //
    if (instruction[4]) url[key] = url[key].toLowerCase();
  }

  //
  // Also parse the supplied query string in to an object. If we're supplied
  // with a custom parser as function use that instead of the default build-in
  // parser.
  //
  if (parser) url.query = parser(url.query);

  //
  // If the URL is relative, resolve the pathname against the base URL.
  //
  if (
      relative
    && location.slashes
    && url.pathname.charAt(0) !== '/'
    && (url.pathname !== '' || location.pathname !== '')
  ) {
    url.pathname = resolve(url.pathname, location.pathname);
  }

  //
  // We should not add port numbers if they are already the default port number
  // for a given protocol. As the host also contains the port number we're going
  // override it with the hostname which contains no port number.
  //
  if (!required(url.port, url.protocol)) {
    url.host = url.hostname;
    url.port = '';
  }

  //
  // Parse down the `auth` for the username and password.
  //
  url.username = url.password = '';
  if (url.auth) {
    instruction = url.auth.split(':');
    url.username = instruction[0] || '';
    url.password = instruction[1] || '';
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  //
  // The href is just the compiled result.
  //
  url.href = url.toString();
}

/**
 * This is convenience method for changing properties in the URL instance to
 * insure that they all propagate correctly.
 *
 * @param {String} part          Property we need to adjust.
 * @param {Mixed} value          The newly assigned value.
 * @param {Boolean|Function} fn  When setting the query, it will be the function
 *                               used to parse the query.
 *                               When setting the protocol, double slash will be
 *                               removed from the final url if it is true.
 * @returns {URL} URL instance for chaining.
 * @public
 */
function set(part, value, fn) {
  var url = this;

  switch (part) {
    case 'query':
      if ('string' === typeof value && value.length) {
        value = (fn || qs.parse)(value);
      }

      url[part] = value;
      break;

    case 'port':
      url[part] = value;

      if (!required(value, url.protocol)) {
        url.host = url.hostname;
        url[part] = '';
      } else if (value) {
        url.host = url.hostname +':'+ value;
      }

      break;

    case 'hostname':
      url[part] = value;

      if (url.port) value += ':'+ url.port;
      url.host = value;
      break;

    case 'host':
      url[part] = value;

      if (/:\d+$/.test(value)) {
        value = value.split(':');
        url.port = value.pop();
        url.hostname = value.join(':');
      } else {
        url.hostname = value;
        url.port = '';
      }

      break;

    case 'protocol':
      url.protocol = value.toLowerCase();
      url.slashes = !fn;
      break;

    case 'pathname':
    case 'hash':
      if (value) {
        var char = part === 'pathname' ? '/' : '#';
        url[part] = value.charAt(0) !== char ? char + value : value;
      } else {
        url[part] = value;
      }
      break;

    default:
      url[part] = value;
  }

  for (var i = 0; i < rules.length; i++) {
    var ins = rules[i];

    if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  url.href = url.toString();

  return url;
}

/**
 * Transform the properties back in to a valid and full URL string.
 *
 * @param {Function} stringify Optional query stringify function.
 * @returns {String} Compiled version of the URL.
 * @public
 */
function toString(stringify) {
  if (!stringify || 'function' !== typeof stringify) stringify = qs.stringify;

  var query
    , url = this
    , protocol = url.protocol;

  if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';

  var result = protocol + (url.slashes ? '//' : '');

  if (url.username) {
    result += url.username;
    if (url.password) result += ':'+ url.password;
    result += '@';
  }

  result += url.host + url.pathname;

  query = 'object' === typeof url.query ? stringify(url.query) : url.query;
  if (query) result += '?' !== query.charAt(0) ? '?'+ query : query;

  if (url.hash) result += url.hash;

  return result;
}

Url.prototype = { set: set, toString: toString };

//
// Expose the URL parser and some additional properties that might be useful for
// others or testing.
//
Url.extractProtocol = extractProtocol;
Url.location = lolcation;
Url.qs = qs;

module.exports = Url;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"querystringify":12,"requires-port":13}],24:[function(require,module,exports){
/* jshint node: true */
'use strict';

/**
  # wildcard

  Very simple wildcard matching, which is designed to provide the same
  functionality that is found in the
  [eve](https://github.com/adobe-webplatform/eve) eventing library.

  ## Usage

  It works with strings:

  <<< examples/strings.js

  Arrays:

  <<< examples/arrays.js

  Objects (matching against keys):

  <<< examples/objects.js

  While the library works in Node, if you are are looking for file-based
  wildcard matching then you should have a look at:

  <https://github.com/isaacs/node-glob>
**/

function WildcardMatcher(text, separator) {
  this.text = text = text || '';
  this.hasWild = ~text.indexOf('*');
  this.separator = separator;
  this.parts = text.split(separator);
}

WildcardMatcher.prototype.match = function(input) {
  var matches = true;
  var parts = this.parts;
  var ii;
  var partsCount = parts.length;
  var testParts;

  if (typeof input == 'string' || input instanceof String) {
    if (!this.hasWild && this.text != input) {
      matches = false;
    } else {
      testParts = (input || '').split(this.separator);
      for (ii = 0; matches && ii < partsCount; ii++) {
        if (parts[ii] === '*')  {
          continue;
        } else if (ii < testParts.length) {
          matches = parts[ii] === testParts[ii];
        } else {
          matches = false;
        }
      }

      // If matches, then return the component parts
      matches = matches && testParts;
    }
  }
  else if (typeof input.splice == 'function') {
    matches = [];

    for (ii = input.length; ii--; ) {
      if (this.match(input[ii])) {
        matches[matches.length] = input[ii];
      }
    }
  }
  else if (typeof input == 'object') {
    matches = {};

    for (var key in input) {
      if (this.match(key)) {
        matches[key] = input[key];
      }
    }
  }

  return matches;
};

module.exports = function(text, test, separator) {
  var matcher = new WildcardMatcher(text, separator || /[\/\.]/);
  if (typeof test != 'undefined') {
    return matcher.match(test);
  }

  return matcher;
};

},{}],25:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RequestClient = require('./RequestClient');

var _getName = function _getName(id) {
  return id.split('-').map(function (s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }).join(' ');
};

module.exports = function (_RequestClient) {
  _inherits(Provider, _RequestClient);

  function Provider(uppy, opts) {
    _classCallCheck(this, Provider);

    var _this = _possibleConstructorReturn(this, _RequestClient.call(this, uppy, opts));

    _this.provider = opts.provider;
    _this.id = _this.provider;
    _this.authProvider = opts.authProvider || _this.provider;
    _this.name = _this.opts.name || _getName(_this.id);
    _this.tokenKey = 'companion-' + _this.id + '-auth-token';
    return _this;
  }

  // @todo(i.olarewaju) consider whether or not this method should be exposed
  Provider.prototype.setAuthToken = function setAuthToken(token) {
    // @todo(i.olarewaju) add fallback for OOM storage
    localStorage.setItem(this.tokenKey, token);
  };

  Provider.prototype.checkAuth = function checkAuth() {
    return this.get(this.id + '/authorized').then(function (payload) {
      return payload.authenticated;
    });
  };

  Provider.prototype.authUrl = function authUrl() {
    return this.hostname + '/' + this.id + '/connect';
  };

  Provider.prototype.fileUrl = function fileUrl(id) {
    return this.hostname + '/' + this.id + '/get/' + id;
  };

  Provider.prototype.list = function list(directory) {
    return this.get(this.id + '/list/' + (directory || ''));
  };

  Provider.prototype.logout = function logout() {
    var _this2 = this;

    var redirect = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : location.href;

    return this.get(this.id + '/logout?redirect=' + redirect).then(function (res) {
      localStorage.removeItem(_this2.tokenKey);
      return res;
    });
  };

  Provider.initPlugin = function initPlugin(plugin, opts, defaultOpts) {
    plugin.type = 'acquirer';
    plugin.files = [];
    if (defaultOpts) {
      plugin.opts = _extends({}, defaultOpts, opts);
    }
    if (opts.serverPattern) {
      var pattern = opts.serverPattern;
      // validate serverPattern param
      if (typeof pattern !== 'string' && !Array.isArray(pattern) && !(pattern instanceof RegExp)) {
        throw new TypeError(plugin.id + ': the option "serverPattern" must be one of string, Array, RegExp');
      }
      plugin.opts.serverPattern = pattern;
    } else {
      // does not start with https://
      if (/^(?!https?:\/\/).*$/.test(opts.serverUrl)) {
        plugin.opts.serverPattern = location.protocol + '//' + opts.serverUrl.replace(/^\/\//, '');
      } else {
        plugin.opts.serverPattern = opts.serverUrl;
      }
    }
  };

  _createClass(Provider, [{
    key: 'defaultHeaders',
    get: function get() {
      return _extends({}, _RequestClient.prototype.defaultHeaders, { 'uppy-auth-token': localStorage.getItem(this.tokenKey) });
    }
  }]);

  return Provider;
}(RequestClient);

},{"./RequestClient":26}],26:[function(require,module,exports){
'use strict';

// Remove the trailing slash so we can always safely append /xyz.

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function stripSlash(url) {
  return url.replace(/\/$/, '');
}

module.exports = function () {
  function RequestClient(uppy, opts) {
    _classCallCheck(this, RequestClient);

    this.uppy = uppy;
    this.opts = opts;
    this.onReceiveResponse = this.onReceiveResponse.bind(this);
  }

  RequestClient.prototype.onReceiveResponse = function onReceiveResponse(response) {
    var state = this.uppy.getState();
    var companion = state.companion || {};
    var host = this.opts.serverUrl;
    var headers = response.headers;
    // Store the self-identified domain name for the Companion instance we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== companion[host]) {
      var _extends2;

      this.uppy.setState({
        companion: _extends({}, companion, (_extends2 = {}, _extends2[host] = headers.get('i-am'), _extends2))
      });
    }
    return response;
  };

  RequestClient.prototype._getUrl = function _getUrl(url) {
    if (/^(https?:|)\/\//.test(url)) {
      return url;
    }
    return this.hostname + '/' + url;
  };

  RequestClient.prototype.get = function get(path) {
    var _this = this;

    return fetch(this._getUrl(path), {
      method: 'get',
      headers: this.headers,
      credentials: 'same-origin'
    })
    // @todo validate response status before calling json
    .then(this.onReceiveResponse).then(function (res) {
      return res.json();
    }).catch(function (err) {
      throw new Error('Could not get ' + _this._getUrl(path) + '. ' + err);
    });
  };

  RequestClient.prototype.post = function post(path, data) {
    var _this2 = this;

    return fetch(this._getUrl(path), {
      method: 'post',
      headers: this.headers,
      credentials: 'same-origin',
      body: JSON.stringify(data)
    }).then(this.onReceiveResponse).then(function (res) {
      if (res.status < 200 || res.status > 300) {
        throw new Error('Could not post ' + _this2._getUrl(path) + '. ' + res.statusText);
      }
      return res.json();
    }).catch(function (err) {
      throw new Error('Could not post ' + _this2._getUrl(path) + '. ' + err);
    });
  };

  RequestClient.prototype.delete = function _delete(path, data) {
    var _this3 = this;

    return fetch(this.hostname + '/' + path, {
      method: 'delete',
      headers: this.headers,
      credentials: 'same-origin',
      body: data ? JSON.stringify(data) : null
    }).then(this.onReceiveResponse)
    // @todo validate response status before calling json
    .then(function (res) {
      return res.json();
    }).catch(function (err) {
      throw new Error('Could not delete ' + _this3._getUrl(path) + '. ' + err);
    });
  };

  _createClass(RequestClient, [{
    key: 'hostname',
    get: function get() {
      var _uppy$getState = this.uppy.getState(),
          companion = _uppy$getState.companion;

      var host = this.opts.serverUrl;
      return stripSlash(companion && companion[host] ? companion[host] : host);
    }
  }, {
    key: 'defaultHeaders',
    get: function get() {
      return {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
    }
  }, {
    key: 'headers',
    get: function get() {
      return _extends({}, this.defaultHeaders, this.opts.serverHeaders || {});
    }
  }]);

  return RequestClient;
}();

},{}],27:[function(require,module,exports){
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ee = require('namespace-emitter');

module.exports = function () {
  function UppySocket(opts) {
    var _this = this;

    _classCallCheck(this, UppySocket);

    this.queued = [];
    this.isOpen = false;
    this.socket = new WebSocket(opts.target);
    this.emitter = ee();

    this.socket.onopen = function (e) {
      _this.isOpen = true;

      while (_this.queued.length > 0 && _this.isOpen) {
        var first = _this.queued[0];
        _this.send(first.action, first.payload);
        _this.queued = _this.queued.slice(1);
      }
    };

    this.socket.onclose = function (e) {
      _this.isOpen = false;
    };

    this._handleMessage = this._handleMessage.bind(this);

    this.socket.onmessage = this._handleMessage;

    this.close = this.close.bind(this);
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.once = this.once.bind(this);
    this.send = this.send.bind(this);
  }

  UppySocket.prototype.close = function close() {
    return this.socket.close();
  };

  UppySocket.prototype.send = function send(action, payload) {
    // attach uuid

    if (!this.isOpen) {
      this.queued.push({ action: action, payload: payload });
      return;
    }

    this.socket.send(JSON.stringify({
      action: action,
      payload: payload
    }));
  };

  UppySocket.prototype.on = function on(action, handler) {
    this.emitter.on(action, handler);
  };

  UppySocket.prototype.emit = function emit(action, payload) {
    this.emitter.emit(action, payload);
  };

  UppySocket.prototype.once = function once(action, handler) {
    this.emitter.once(action, handler);
  };

  UppySocket.prototype._handleMessage = function _handleMessage(e) {
    try {
      var message = JSON.parse(e.data);
      this.emit(message.action, message.payload);
    } catch (err) {
      console.log(err);
    }
  };

  return UppySocket;
}();

},{"namespace-emitter":9}],28:[function(require,module,exports){
'use-strict';
/**
 * Manages communications with Companion
 */

var RequestClient = require('./RequestClient');
var Provider = require('./Provider');
var Socket = require('./Socket');

module.exports = {
  RequestClient: RequestClient,
  Provider: Provider,
  Socket: Socket
};

},{"./Provider":25,"./RequestClient":26,"./Socket":27}],29:[function(require,module,exports){
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var preact = require('preact');
var findDOMElement = require('./../../utils/lib/findDOMElement');

/**
 * Defer a frequent call to the microtask queue.
 */
function debounce(fn) {
  var calling = null;
  var latestArgs = null;
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    latestArgs = args;
    if (!calling) {
      calling = Promise.resolve().then(function () {
        calling = null;
        // At this point `args` may be different from the most
        // recent state, if multiple calls happened since this task
        // was queued. So we use the `latestArgs`, which definitely
        // is the most recent call.
        return fn.apply(undefined, latestArgs);
      });
    }
    return calling;
  };
}

/**
 * Boilerplate that all Plugins share - and should not be used
 * directly. It also shows which methods final plugins should implement/override,
 * this deciding on structure.
 *
 * @param {object} main Uppy core object
 * @param {object} object with plugin options
 * @return {array | string} files or success/fail message
 */
module.exports = function () {
  function Plugin(uppy, opts) {
    _classCallCheck(this, Plugin);

    this.uppy = uppy;
    this.opts = opts || {};

    this.update = this.update.bind(this);
    this.mount = this.mount.bind(this);
    this.install = this.install.bind(this);
    this.uninstall = this.uninstall.bind(this);
  }

  Plugin.prototype.getPluginState = function getPluginState() {
    var _uppy$getState = this.uppy.getState(),
        plugins = _uppy$getState.plugins;

    return plugins[this.id] || {};
  };

  Plugin.prototype.setPluginState = function setPluginState(update) {
    var _extends2;

    var _uppy$getState2 = this.uppy.getState(),
        plugins = _uppy$getState2.plugins;

    this.uppy.setState({
      plugins: _extends({}, plugins, (_extends2 = {}, _extends2[this.id] = _extends({}, plugins[this.id], update), _extends2))
    });
  };

  Plugin.prototype.update = function update(state) {
    if (typeof this.el === 'undefined') {
      return;
    }

    if (this._updateUI) {
      this._updateUI(state);
    }
  };

  /**
  * Called when plugin is mounted, whether in DOM or into another plugin.
  * Needed because sometimes plugins are mounted separately/after `install`,
  * so this.el and this.parent might not be available in `install`.
  * This is the case with @uppy/react plugins, for example.
  */


  Plugin.prototype.onMount = function onMount() {};

  /**
   * Check if supplied `target` is a DOM element or an `object`.
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
   *
   * @param {String|Object} target
   *
   */


  Plugin.prototype.mount = function mount(target, plugin) {
    var _this = this;

    var callerPluginName = plugin.id;

    var targetElement = findDOMElement(target);

    if (targetElement) {
      this.isTargetDOMEl = true;

      // API for plugins that require a synchronous rerender.
      this.rerender = function (state) {
        // plugin could be removed, but this.rerender is debounced below,
        // so it could still be called even after uppy.removePlugin or uppy.close
        // hence the check
        if (!_this.uppy.getPlugin(_this.id)) return;
        _this.el = preact.render(_this.render(state), targetElement, _this.el);
      };
      this._updateUI = debounce(this.rerender);

      this.uppy.log('Installing ' + callerPluginName + ' to a DOM element');

      // clear everything inside the target container
      if (this.opts.replaceTargetContent) {
        targetElement.innerHTML = '';
      }

      this.el = preact.render(this.render(this.uppy.getState()), targetElement);

      this.onMount();
      return this.el;
    }

    var targetPlugin = void 0;
    if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) === 'object' && target instanceof Plugin) {
      // Targeting a plugin *instance*
      targetPlugin = target;
    } else if (typeof target === 'function') {
      // Targeting a plugin type
      var Target = target;
      // Find the target plugin instance.
      this.uppy.iteratePlugins(function (plugin) {
        if (plugin instanceof Target) {
          targetPlugin = plugin;
          return false;
        }
      });
    }

    if (targetPlugin) {
      this.uppy.log('Installing ' + callerPluginName + ' to ' + targetPlugin.id);
      this.parent = targetPlugin;
      this.el = targetPlugin.addTarget(plugin);

      this.onMount();
      return this.el;
    }

    this.uppy.log('Not installing ' + callerPluginName);
    throw new Error('Invalid target option given to ' + callerPluginName + '. Please make sure that the element \n      exists on the page, or that the plugin you are targeting has been installed. Check that the <script> tag initializing Uppy \n      comes at the bottom of the page, before the closing </body> tag (see https://github.com/transloadit/uppy/issues/1042).');
  };

  Plugin.prototype.render = function render(state) {
    throw new Error('Extend the render method to add your plugin to a DOM element');
  };

  Plugin.prototype.addTarget = function addTarget(plugin) {
    throw new Error('Extend the addTarget method to add your plugin to another plugin\'s target');
  };

  Plugin.prototype.unmount = function unmount() {
    if (this.isTargetDOMEl && this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  };

  Plugin.prototype.install = function install() {};

  Plugin.prototype.uninstall = function uninstall() {
    this.unmount();
  };

  return Plugin;
}();

},{"./../../utils/lib/findDOMElement":37,"preact":10}],30:[function(require,module,exports){
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Translator = require('./../../utils/lib/Translator');
var ee = require('namespace-emitter');
var cuid = require('cuid');
// const throttle = require('lodash.throttle')
var prettyBytes = require('prettier-bytes');
var match = require('mime-match');
var DefaultStore = require('./../../store-default');
var getFileType = require('./../../utils/lib/getFileType');
var getFileNameAndExtension = require('./../../utils/lib/getFileNameAndExtension');
var generateFileID = require('./../../utils/lib/generateFileID');
var getTimeStamp = require('./../../utils/lib/getTimeStamp');
var Plugin = require('./Plugin'); // Exported from here.

/**
 * Uppy Core module.
 * Manages plugins, state updates, acts as an event bus,
 * adds/removes files and metadata.
 */

var Uppy = function () {
  /**
  * Instantiate Uppy
  * @param {object} opts — Uppy options
  */
  function Uppy(opts) {
    var _this = this;

    _classCallCheck(this, Uppy);

    var defaultLocale = {
      strings: {
        youCanOnlyUploadX: {
          0: 'You can only upload %{smart_count} file',
          1: 'You can only upload %{smart_count} files'
        },
        youHaveToAtLeastSelectX: {
          0: 'You have to select at least %{smart_count} file',
          1: 'You have to select at least %{smart_count} files'
        },
        exceedsSize: 'This file exceeds maximum allowed size of',
        youCanOnlyUploadFileTypes: 'You can only upload:',
        companionError: 'Connection with Companion failed',
        failedToUpload: 'Failed to upload %{file}',
        noInternetConnection: 'No Internet connection',
        connectedToInternet: 'Connected to the Internet',
        // Strings for remote providers
        noFilesFound: 'You have no files or folders here',
        selectXFiles: {
          0: 'Select %{smart_count} file',
          1: 'Select %{smart_count} files'
        },
        cancel: 'Cancel',
        logOut: 'Log out'
      }

      // set default options
    };var defaultOptions = {
      id: 'uppy',
      autoProceed: false,
      allowMultipleUploads: true,
      debug: false,
      restrictions: {
        maxFileSize: null,
        maxNumberOfFiles: null,
        minNumberOfFiles: null,
        allowedFileTypes: null
      },
      meta: {},
      onBeforeFileAdded: function onBeforeFileAdded(currentFile, files) {
        return currentFile;
      },
      onBeforeUpload: function onBeforeUpload(files) {
        return files;
      },
      locale: defaultLocale,
      store: DefaultStore()

      // Merge default options with the ones set by user
    };this.opts = _extends({}, defaultOptions, opts);
    this.opts.restrictions = _extends({}, defaultOptions.restrictions, this.opts.restrictions);

    // i18n
    this.translator = new Translator([defaultLocale, this.opts.locale]);
    this.locale = this.translator.locale;
    this.i18n = this.translator.translate.bind(this.translator);

    // Container for different types of plugins
    this.plugins = {};

    this.getState = this.getState.bind(this);
    this.getPlugin = this.getPlugin.bind(this);
    this.setFileMeta = this.setFileMeta.bind(this);
    this.setFileState = this.setFileState.bind(this);
    this.log = this.log.bind(this);
    this.info = this.info.bind(this);
    this.hideInfo = this.hideInfo.bind(this);
    this.addFile = this.addFile.bind(this);
    this.removeFile = this.removeFile.bind(this);
    this.pauseResume = this.pauseResume.bind(this);
    this._calculateProgress = this._calculateProgress.bind(this);
    this.updateOnlineStatus = this.updateOnlineStatus.bind(this);
    this.resetProgress = this.resetProgress.bind(this);

    this.pauseAll = this.pauseAll.bind(this);
    this.resumeAll = this.resumeAll.bind(this);
    this.retryAll = this.retryAll.bind(this);
    this.cancelAll = this.cancelAll.bind(this);
    this.retryUpload = this.retryUpload.bind(this);
    this.upload = this.upload.bind(this);

    this.emitter = ee();
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.once = this.emitter.once.bind(this.emitter);
    this.emit = this.emitter.emit.bind(this.emitter);

    this.preProcessors = [];
    this.uploaders = [];
    this.postProcessors = [];

    this.store = this.opts.store;
    this.setState({
      plugins: {},
      files: {},
      currentUploads: {},
      allowNewUpload: true,
      capabilities: {
        resumableUploads: false
      },
      totalProgress: 0,
      meta: _extends({}, this.opts.meta),
      info: {
        isHidden: true,
        type: 'info',
        message: ''
      }
    });

    this._storeUnsubscribe = this.store.subscribe(function (prevState, nextState, patch) {
      _this.emit('state-update', prevState, nextState, patch);
      _this.updateAll(nextState);
    });

    // for debugging and testing
    // this.updateNum = 0
    if (this.opts.debug && typeof window !== 'undefined') {
      window['uppyLog'] = '';
      window[this.opts.id] = this;
    }

    this._addListeners();
  }

  Uppy.prototype.on = function on(event, callback) {
    this.emitter.on(event, callback);
    return this;
  };

  Uppy.prototype.off = function off(event, callback) {
    this.emitter.off(event, callback);
    return this;
  };

  /**
   * Iterate on all plugins and run `update` on them.
   * Called each time state changes.
   *
   */


  Uppy.prototype.updateAll = function updateAll(state) {
    this.iteratePlugins(function (plugin) {
      plugin.update(state);
    });
  };

  /**
   * Updates state with a patch
   *
   * @param {object} patch {foo: 'bar'}
   */


  Uppy.prototype.setState = function setState(patch) {
    this.store.setState(patch);
  };

  /**
   * Returns current state.
   * @return {object}
   */


  Uppy.prototype.getState = function getState() {
    return this.store.getState();
  };

  /**
  * Back compat for when uppy.state is used instead of uppy.getState().
  */


  /**
  * Shorthand to set state for a specific file.
  */
  Uppy.prototype.setFileState = function setFileState(fileID, state) {
    var _extends2;

    if (!this.getState().files[fileID]) {
      throw new Error('Can\u2019t set state for ' + fileID + ' (the file could have been removed)');
    }

    this.setState({
      files: _extends({}, this.getState().files, (_extends2 = {}, _extends2[fileID] = _extends({}, this.getState().files[fileID], state), _extends2))
    });
  };

  Uppy.prototype.resetProgress = function resetProgress() {
    var defaultProgress = {
      percentage: 0,
      bytesUploaded: 0,
      uploadComplete: false,
      uploadStarted: false
    };
    var files = _extends({}, this.getState().files);
    var updatedFiles = {};
    Object.keys(files).forEach(function (fileID) {
      var updatedFile = _extends({}, files[fileID]);
      updatedFile.progress = _extends({}, updatedFile.progress, defaultProgress);
      updatedFiles[fileID] = updatedFile;
    });

    this.setState({
      files: updatedFiles,
      totalProgress: 0
    });

    // TODO Document on the website
    this.emit('reset-progress');
  };

  Uppy.prototype.addPreProcessor = function addPreProcessor(fn) {
    this.preProcessors.push(fn);
  };

  Uppy.prototype.removePreProcessor = function removePreProcessor(fn) {
    var i = this.preProcessors.indexOf(fn);
    if (i !== -1) {
      this.preProcessors.splice(i, 1);
    }
  };

  Uppy.prototype.addPostProcessor = function addPostProcessor(fn) {
    this.postProcessors.push(fn);
  };

  Uppy.prototype.removePostProcessor = function removePostProcessor(fn) {
    var i = this.postProcessors.indexOf(fn);
    if (i !== -1) {
      this.postProcessors.splice(i, 1);
    }
  };

  Uppy.prototype.addUploader = function addUploader(fn) {
    this.uploaders.push(fn);
  };

  Uppy.prototype.removeUploader = function removeUploader(fn) {
    var i = this.uploaders.indexOf(fn);
    if (i !== -1) {
      this.uploaders.splice(i, 1);
    }
  };

  Uppy.prototype.setMeta = function setMeta(data) {
    var updatedMeta = _extends({}, this.getState().meta, data);
    var updatedFiles = _extends({}, this.getState().files);

    Object.keys(updatedFiles).forEach(function (fileID) {
      updatedFiles[fileID] = _extends({}, updatedFiles[fileID], {
        meta: _extends({}, updatedFiles[fileID].meta, data)
      });
    });

    this.log('Adding metadata:');
    this.log(data);

    this.setState({
      meta: updatedMeta,
      files: updatedFiles
    });
  };

  Uppy.prototype.setFileMeta = function setFileMeta(fileID, data) {
    var updatedFiles = _extends({}, this.getState().files);
    if (!updatedFiles[fileID]) {
      this.log('Was trying to set metadata for a file that’s not with us anymore: ', fileID);
      return;
    }
    var newMeta = _extends({}, updatedFiles[fileID].meta, data);
    updatedFiles[fileID] = _extends({}, updatedFiles[fileID], {
      meta: newMeta
    });
    this.setState({ files: updatedFiles });
  };

  /**
   * Get a file object.
   *
   * @param {string} fileID The ID of the file object to return.
   */


  Uppy.prototype.getFile = function getFile(fileID) {
    return this.getState().files[fileID];
  };

  /**
   * Get all files in an array.
   */


  Uppy.prototype.getFiles = function getFiles() {
    var _getState = this.getState(),
        files = _getState.files;

    return Object.keys(files).map(function (fileID) {
      return files[fileID];
    });
  };

  /**
  * Check if minNumberOfFiles restriction is reached before uploading.
  *
  * @private
  */


  Uppy.prototype._checkMinNumberOfFiles = function _checkMinNumberOfFiles(files) {
    var minNumberOfFiles = this.opts.restrictions.minNumberOfFiles;

    if (Object.keys(files).length < minNumberOfFiles) {
      throw new Error('' + this.i18n('youHaveToAtLeastSelectX', { smart_count: minNumberOfFiles }));
    }
  };

  /**
  * Check if file passes a set of restrictions set in options: maxFileSize,
  * maxNumberOfFiles and allowedFileTypes.
  *
  * @param {object} file object to check
  * @private
  */


  Uppy.prototype._checkRestrictions = function _checkRestrictions(file) {
    var _opts$restrictions = this.opts.restrictions,
        maxFileSize = _opts$restrictions.maxFileSize,
        maxNumberOfFiles = _opts$restrictions.maxNumberOfFiles,
        allowedFileTypes = _opts$restrictions.allowedFileTypes;


    if (maxNumberOfFiles) {
      if (Object.keys(this.getState().files).length + 1 > maxNumberOfFiles) {
        throw new Error('' + this.i18n('youCanOnlyUploadX', { smart_count: maxNumberOfFiles }));
      }
    }

    if (allowedFileTypes) {
      var isCorrectFileType = allowedFileTypes.filter(function (type) {
        // if (!file.type) return false

        // is this is a mime-type
        if (type.indexOf('/') > -1) {
          if (!file.type) return false;
          return match(file.type, type);
        }

        // otherwise this is likely an extension
        if (type[0] === '.') {
          if (file.extension === type.substr(1)) {
            return file.extension;
          }
        }
      }).length > 0;

      if (!isCorrectFileType) {
        var allowedFileTypesString = allowedFileTypes.join(', ');
        throw new Error(this.i18n('youCanOnlyUploadFileTypes') + ' ' + allowedFileTypesString);
      }
    }

    if (maxFileSize) {
      if (file.data.size > maxFileSize) {
        throw new Error(this.i18n('exceedsSize') + ' ' + prettyBytes(maxFileSize));
      }
    }
  };

  /**
  * Add a new file to `state.files`. This will run `onBeforeFileAdded`,
  * try to guess file type in a clever way, check file against restrictions,
  * and start an upload if `autoProceed === true`.
  *
  * @param {object} file object to add
  */


  Uppy.prototype.addFile = function addFile(file) {
    var _this2 = this,
        _extends3;

    var _getState2 = this.getState(),
        files = _getState2.files,
        allowNewUpload = _getState2.allowNewUpload;

    var onError = function onError(msg) {
      var err = (typeof msg === 'undefined' ? 'undefined' : _typeof(msg)) === 'object' ? msg : new Error(msg);
      _this2.log(err.message);
      _this2.info(err.message, 'error', 5000);
      throw err;
    };

    if (allowNewUpload === false) {
      onError(new Error('Cannot add new files: already uploading.'));
    }

    var onBeforeFileAddedResult = this.opts.onBeforeFileAdded(file, files);

    if (onBeforeFileAddedResult === false) {
      this.log('Not adding file because onBeforeFileAdded returned false');
      return;
    }

    if ((typeof onBeforeFileAddedResult === 'undefined' ? 'undefined' : _typeof(onBeforeFileAddedResult)) === 'object' && onBeforeFileAddedResult) {
      // warning after the change in 0.24
      if (onBeforeFileAddedResult.then) {
        throw new TypeError('onBeforeFileAdded() returned a Promise, but this is no longer supported. It must be synchronous.');
      }
      file = onBeforeFileAddedResult;
    }

    var fileType = getFileType(file);
    var fileName = void 0;
    if (file.name) {
      fileName = file.name;
    } else if (fileType.split('/')[0] === 'image') {
      fileName = fileType.split('/')[0] + '.' + fileType.split('/')[1];
    } else {
      fileName = 'noname';
    }
    var fileExtension = getFileNameAndExtension(fileName).extension;
    var isRemote = file.isRemote || false;

    var fileID = generateFileID(file);

    var meta = file.meta || {};
    meta.name = fileName;
    meta.type = fileType;

    var newFile = {
      source: file.source || '',
      id: fileID,
      name: fileName,
      extension: fileExtension || '',
      meta: _extends({}, this.getState().meta, meta),
      type: fileType,
      data: file.data,
      progress: {
        percentage: 0,
        bytesUploaded: 0,
        bytesTotal: file.data.size || 0,
        uploadComplete: false,
        uploadStarted: false
      },
      size: file.data.size || 0,
      isRemote: isRemote,
      remote: file.remote || '',
      preview: file.preview
    };

    try {
      this._checkRestrictions(newFile);
    } catch (err) {
      onError(err);
    }

    this.setState({
      files: _extends({}, files, (_extends3 = {}, _extends3[fileID] = newFile, _extends3))
    });

    this.emit('file-added', newFile);
    this.log('Added file: ' + fileName + ', ' + fileID + ', mime type: ' + fileType);

    if (this.opts.autoProceed && !this.scheduledAutoProceed) {
      this.scheduledAutoProceed = setTimeout(function () {
        _this2.scheduledAutoProceed = null;
        _this2.upload().catch(function (err) {
          console.error(err.stack || err.message || err);
        });
      }, 4);
    }
  };

  Uppy.prototype.removeFile = function removeFile(fileID) {
    var _this3 = this;

    var _getState3 = this.getState(),
        files = _getState3.files,
        currentUploads = _getState3.currentUploads;

    var updatedFiles = _extends({}, files);
    var removedFile = updatedFiles[fileID];
    delete updatedFiles[fileID];

    // Remove this file from its `currentUpload`.
    var updatedUploads = _extends({}, currentUploads);
    var removeUploads = [];
    Object.keys(updatedUploads).forEach(function (uploadID) {
      var newFileIDs = currentUploads[uploadID].fileIDs.filter(function (uploadFileID) {
        return uploadFileID !== fileID;
      });
      // Remove the upload if no files are associated with it anymore.
      if (newFileIDs.length === 0) {
        removeUploads.push(uploadID);
        return;
      }

      updatedUploads[uploadID] = _extends({}, currentUploads[uploadID], {
        fileIDs: newFileIDs
      });
    });

    this.setState({
      currentUploads: updatedUploads,
      files: updatedFiles
    });

    removeUploads.forEach(function (uploadID) {
      _this3._removeUpload(uploadID);
    });

    this._calculateTotalProgress();
    this.emit('file-removed', removedFile);
    this.log('File removed: ' + removedFile.id);
  };

  Uppy.prototype.pauseResume = function pauseResume(fileID) {
    if (!this.getState().capabilities.resumableUploads || this.getFile(fileID).uploadComplete) {
      return;
    }

    var wasPaused = this.getFile(fileID).isPaused || false;
    var isPaused = !wasPaused;

    this.setFileState(fileID, {
      isPaused: isPaused
    });

    this.emit('upload-pause', fileID, isPaused);

    return isPaused;
  };

  Uppy.prototype.pauseAll = function pauseAll() {
    var updatedFiles = _extends({}, this.getState().files);
    var inProgressUpdatedFiles = Object.keys(updatedFiles).filter(function (file) {
      return !updatedFiles[file].progress.uploadComplete && updatedFiles[file].progress.uploadStarted;
    });

    inProgressUpdatedFiles.forEach(function (file) {
      var updatedFile = _extends({}, updatedFiles[file], {
        isPaused: true
      });
      updatedFiles[file] = updatedFile;
    });
    this.setState({ files: updatedFiles });

    this.emit('pause-all');
  };

  Uppy.prototype.resumeAll = function resumeAll() {
    var updatedFiles = _extends({}, this.getState().files);
    var inProgressUpdatedFiles = Object.keys(updatedFiles).filter(function (file) {
      return !updatedFiles[file].progress.uploadComplete && updatedFiles[file].progress.uploadStarted;
    });

    inProgressUpdatedFiles.forEach(function (file) {
      var updatedFile = _extends({}, updatedFiles[file], {
        isPaused: false,
        error: null
      });
      updatedFiles[file] = updatedFile;
    });
    this.setState({ files: updatedFiles });

    this.emit('resume-all');
  };

  Uppy.prototype.retryAll = function retryAll() {
    var updatedFiles = _extends({}, this.getState().files);
    var filesToRetry = Object.keys(updatedFiles).filter(function (file) {
      return updatedFiles[file].error;
    });

    filesToRetry.forEach(function (file) {
      var updatedFile = _extends({}, updatedFiles[file], {
        isPaused: false,
        error: null
      });
      updatedFiles[file] = updatedFile;
    });
    this.setState({
      files: updatedFiles,
      error: null
    });

    this.emit('retry-all', filesToRetry);

    var uploadID = this._createUpload(filesToRetry);
    return this._runUpload(uploadID);
  };

  Uppy.prototype.cancelAll = function cancelAll() {
    var _this4 = this;

    this.emit('cancel-all');

    var files = Object.keys(this.getState().files);
    files.forEach(function (fileID) {
      _this4.removeFile(fileID);
    });

    this.setState({
      allowNewUpload: true,
      totalProgress: 0,
      error: null
    });
  };

  Uppy.prototype.retryUpload = function retryUpload(fileID) {
    var updatedFiles = _extends({}, this.getState().files);
    var updatedFile = _extends({}, updatedFiles[fileID], { error: null, isPaused: false });
    updatedFiles[fileID] = updatedFile;
    this.setState({
      files: updatedFiles
    });

    this.emit('upload-retry', fileID);

    var uploadID = this._createUpload([fileID]);
    return this._runUpload(uploadID);
  };

  Uppy.prototype.reset = function reset() {
    this.cancelAll();
  };

  Uppy.prototype._calculateProgress = function _calculateProgress(file, data) {
    if (!this.getFile(file.id)) {
      this.log('Not setting progress for a file that has been removed: ' + file.id);
      return;
    }

    this.setFileState(file.id, {
      progress: _extends({}, this.getFile(file.id).progress, {
        bytesUploaded: data.bytesUploaded,
        bytesTotal: data.bytesTotal,
        percentage: Math.floor((data.bytesUploaded / data.bytesTotal * 100).toFixed(2))
      })
    });

    this._calculateTotalProgress();
  };

  Uppy.prototype._calculateTotalProgress = function _calculateTotalProgress() {
    // calculate total progress, using the number of files currently uploading,
    // multiplied by 100 and the summ of individual progress of each file
    var files = this.getFiles();

    var inProgress = files.filter(function (file) {
      return file.progress.uploadStarted;
    });

    if (inProgress.length === 0) {
      this.setState({ totalProgress: 0 });
      return;
    }

    var sizedFiles = inProgress.filter(function (file) {
      return file.progress.bytesTotal != null;
    });
    var unsizedFiles = inProgress.filter(function (file) {
      return file.progress.bytesTotal == null;
    });

    if (sizedFiles.length === 0) {
      var progressMax = inProgress.length;
      var currentProgress = unsizedFiles.reduce(function (acc, file) {
        return acc + file.progress.percentage;
      }, 0);
      var _totalProgress = Math.round(currentProgress / progressMax * 100);
      this.setState({ totalProgress: _totalProgress });
      return;
    }

    var totalSize = sizedFiles.reduce(function (acc, file) {
      return acc + file.progress.bytesTotal;
    }, 0);
    var averageSize = totalSize / sizedFiles.length;
    totalSize += averageSize * unsizedFiles.length;

    var uploadedSize = 0;
    sizedFiles.forEach(function (file) {
      uploadedSize += file.progress.bytesUploaded;
    });
    unsizedFiles.forEach(function (file) {
      uploadedSize += averageSize * (file.progress.percentage || 0);
    });

    var totalProgress = totalSize === 0 ? 0 : Math.round(uploadedSize / totalSize * 100);

    this.setState({ totalProgress: totalProgress });
  };

  /**
   * Registers listeners for all global actions, like:
   * `error`, `file-removed`, `upload-progress`
   */


  Uppy.prototype._addListeners = function _addListeners() {
    var _this5 = this;

    this.on('error', function (error) {
      _this5.setState({ error: error.message });
    });

    this.on('upload-error', function (file, error) {
      _this5.setFileState(file.id, { error: error.message });
      _this5.setState({ error: error.message });

      var message = _this5.i18n('failedToUpload', { file: file.name });
      if ((typeof error === 'undefined' ? 'undefined' : _typeof(error)) === 'object' && error.message) {
        message = { message: message, details: error.message };
      }
      _this5.info(message, 'error', 5000);
    });

    this.on('upload', function () {
      _this5.setState({ error: null });
    });

    this.on('upload-started', function (file, upload) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      _this5.setFileState(file.id, {
        progress: {
          uploadStarted: Date.now(),
          uploadComplete: false,
          percentage: 0,
          bytesUploaded: 0,
          bytesTotal: file.size
        }
      });
    });

    // upload progress events can occur frequently, especially when you have a good
    // connection to the remote server. Therefore, we are throtteling them to
    // prevent accessive function calls.
    // see also: https://github.com/tus/tus-js-client/commit/9940f27b2361fd7e10ba58b09b60d82422183bbb
    // const _throttledCalculateProgress = throttle(this._calculateProgress, 100, { leading: true, trailing: true })

    this.on('upload-progress', this._calculateProgress);

    this.on('upload-success', function (file, uploadResp, uploadURL) {
      var currentProgress = _this5.getFile(file.id).progress;
      _this5.setFileState(file.id, {
        progress: _extends({}, currentProgress, {
          uploadComplete: true,
          percentage: 100,
          bytesUploaded: currentProgress.bytesTotal
        }),
        uploadURL: uploadURL,
        isPaused: false
      });

      _this5._calculateTotalProgress();
    });

    this.on('preprocess-progress', function (file, progress) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      _this5.setFileState(file.id, {
        progress: _extends({}, _this5.getFile(file.id).progress, {
          preprocess: progress
        })
      });
    });

    this.on('preprocess-complete', function (file) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      var files = _extends({}, _this5.getState().files);
      files[file.id] = _extends({}, files[file.id], {
        progress: _extends({}, files[file.id].progress)
      });
      delete files[file.id].progress.preprocess;

      _this5.setState({ files: files });
    });

    this.on('postprocess-progress', function (file, progress) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      _this5.setFileState(file.id, {
        progress: _extends({}, _this5.getState().files[file.id].progress, {
          postprocess: progress
        })
      });
    });

    this.on('postprocess-complete', function (file) {
      if (!_this5.getFile(file.id)) {
        _this5.log('Not setting progress for a file that has been removed: ' + file.id);
        return;
      }
      var files = _extends({}, _this5.getState().files);
      files[file.id] = _extends({}, files[file.id], {
        progress: _extends({}, files[file.id].progress)
      });
      delete files[file.id].progress.postprocess;
      // TODO should we set some kind of `fullyComplete` property on the file object
      // so it's easier to see that the file is upload…fully complete…rather than
      // what we have to do now (`uploadComplete && !postprocess`)

      _this5.setState({ files: files });
    });

    this.on('restored', function () {
      // Files may have changed--ensure progress is still accurate.
      _this5._calculateTotalProgress();
    });

    // show informer if offline
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', function () {
        return _this5.updateOnlineStatus();
      });
      window.addEventListener('offline', function () {
        return _this5.updateOnlineStatus();
      });
      setTimeout(function () {
        return _this5.updateOnlineStatus();
      }, 3000);
    }
  };

  Uppy.prototype.updateOnlineStatus = function updateOnlineStatus() {
    var online = typeof window.navigator.onLine !== 'undefined' ? window.navigator.onLine : true;
    if (!online) {
      this.emit('is-offline');
      this.info(this.i18n('noInternetConnection'), 'error', 0);
      this.wasOffline = true;
    } else {
      this.emit('is-online');
      if (this.wasOffline) {
        this.emit('back-online');
        this.info(this.i18n('connectedToInternet'), 'success', 3000);
        this.wasOffline = false;
      }
    }
  };

  Uppy.prototype.getID = function getID() {
    return this.opts.id;
  };

  /**
   * Registers a plugin with Core.
   *
   * @param {object} Plugin object
   * @param {object} [opts] object with options to be passed to Plugin
   * @return {Object} self for chaining
   */


  Uppy.prototype.use = function use(Plugin, opts) {
    if (typeof Plugin !== 'function') {
      var msg = 'Expected a plugin class, but got ' + (Plugin === null ? 'null' : typeof Plugin === 'undefined' ? 'undefined' : _typeof(Plugin)) + '.' + ' Please verify that the plugin was imported and spelled correctly.';
      throw new TypeError(msg);
    }

    // Instantiate
    var plugin = new Plugin(this, opts);
    var pluginId = plugin.id;
    this.plugins[plugin.type] = this.plugins[plugin.type] || [];

    if (!pluginId) {
      throw new Error('Your plugin must have an id');
    }

    if (!plugin.type) {
      throw new Error('Your plugin must have a type');
    }

    var existsPluginAlready = this.getPlugin(pluginId);
    if (existsPluginAlready) {
      var _msg = 'Already found a plugin named \'' + existsPluginAlready.id + '\'. ' + ('Tried to use: \'' + pluginId + '\'.\n') + 'Uppy plugins must have unique \'id\' options. See https://uppy.io/docs/plugins/#id.';
      throw new Error(_msg);
    }

    this.plugins[plugin.type].push(plugin);
    plugin.install();

    return this;
  };

  /**
   * Find one Plugin by name.
   *
   * @param {string} id plugin id
   * @return {object | boolean}
   */


  Uppy.prototype.getPlugin = function getPlugin(id) {
    var foundPlugin = null;
    this.iteratePlugins(function (plugin) {
      if (plugin.id === id) {
        foundPlugin = plugin;
        return false;
      }
    });
    return foundPlugin;
  };

  /**
   * Iterate through all `use`d plugins.
   *
   * @param {function} method that will be run on each plugin
   */


  Uppy.prototype.iteratePlugins = function iteratePlugins(method) {
    var _this6 = this;

    Object.keys(this.plugins).forEach(function (pluginType) {
      _this6.plugins[pluginType].forEach(method);
    });
  };

  /**
   * Uninstall and remove a plugin.
   *
   * @param {object} instance The plugin instance to remove.
   */


  Uppy.prototype.removePlugin = function removePlugin(instance) {
    this.log('Removing plugin ' + instance.id);
    this.emit('plugin-remove', instance);

    if (instance.uninstall) {
      instance.uninstall();
    }

    var list = this.plugins[instance.type].slice();
    var index = list.indexOf(instance);
    if (index !== -1) {
      list.splice(index, 1);
      this.plugins[instance.type] = list;
    }

    var updatedState = this.getState();
    delete updatedState.plugins[instance.id];
    this.setState(updatedState);
  };

  /**
   * Uninstall all plugins and close down this Uppy instance.
   */


  Uppy.prototype.close = function close() {
    var _this7 = this;

    this.log('Closing Uppy instance ' + this.opts.id + ': removing all files and uninstalling plugins');

    this.reset();

    this._storeUnsubscribe();

    this.iteratePlugins(function (plugin) {
      _this7.removePlugin(plugin);
    });
  };

  /**
  * Set info message in `state.info`, so that UI plugins like `Informer`
  * can display the message.
  *
  * @param {string | object} message Message to be displayed by the informer
  * @param {string} [type]
  * @param {number} [duration]
  */

  Uppy.prototype.info = function info(message) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'info';
    var duration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3000;

    var isComplexMessage = (typeof message === 'undefined' ? 'undefined' : _typeof(message)) === 'object';

    this.setState({
      info: {
        isHidden: false,
        type: type,
        message: isComplexMessage ? message.message : message,
        details: isComplexMessage ? message.details : null
      }
    });

    this.emit('info-visible');

    clearTimeout(this.infoTimeoutID);
    if (duration === 0) {
      this.infoTimeoutID = undefined;
      return;
    }

    // hide the informer after `duration` milliseconds
    this.infoTimeoutID = setTimeout(this.hideInfo, duration);
  };

  Uppy.prototype.hideInfo = function hideInfo() {
    var newInfo = _extends({}, this.getState().info, {
      isHidden: true
    });
    this.setState({
      info: newInfo
    });
    this.emit('info-hidden');
  };

  /**
   * Logs stuff to console, only if `debug` is set to true. Silent in production.
   *
   * @param {String|Object} msg to log
   * @param {String} [type] optional `error` or `warning`
   */


  Uppy.prototype.log = function log(msg, type) {
    if (!this.opts.debug) {
      return;
    }

    var message = '[Uppy] [' + getTimeStamp() + '] ' + msg;

    window['uppyLog'] = window['uppyLog'] + '\n' + 'DEBUG LOG: ' + msg;

    if (type === 'error') {
      console.error(message);
      return;
    }

    if (type === 'warning') {
      console.warn(message);
      return;
    }

    if (msg === '' + msg) {
      console.log(message);
    } else {
      message = '[Uppy] [' + getTimeStamp() + ']';
      console.log(message);
      console.dir(msg);
    }
  };

  /**
   * Obsolete, event listeners are now added in the constructor.
   */


  Uppy.prototype.run = function run() {
    this.log('Calling run() is no longer necessary.', 'warning');
    return this;
  };

  /**
   * Restore an upload by its ID.
   */


  Uppy.prototype.restore = function restore(uploadID) {
    this.log('Core: attempting to restore upload "' + uploadID + '"');

    if (!this.getState().currentUploads[uploadID]) {
      this._removeUpload(uploadID);
      return Promise.reject(new Error('Nonexistent upload'));
    }

    return this._runUpload(uploadID);
  };

  /**
   * Create an upload for a bunch of files.
   *
   * @param {Array<string>} fileIDs File IDs to include in this upload.
   * @return {string} ID of this upload.
   */


  Uppy.prototype._createUpload = function _createUpload(fileIDs) {
    var _extends4;

    var _getState4 = this.getState(),
        allowNewUpload = _getState4.allowNewUpload,
        currentUploads = _getState4.currentUploads;

    if (!allowNewUpload) {
      throw new Error('Cannot create a new upload: already uploading.');
    }

    var uploadID = cuid();

    this.emit('upload', {
      id: uploadID,
      fileIDs: fileIDs
    });

    this.setState({
      allowNewUpload: this.opts.allowMultipleUploads !== false,

      currentUploads: _extends({}, currentUploads, (_extends4 = {}, _extends4[uploadID] = {
        fileIDs: fileIDs,
        step: 0,
        result: {}
      }, _extends4))
    });

    return uploadID;
  };

  Uppy.prototype._getUpload = function _getUpload(uploadID) {
    var _getState5 = this.getState(),
        currentUploads = _getState5.currentUploads;

    return currentUploads[uploadID];
  };

  /**
   * Add data to an upload's result object.
   *
   * @param {string} uploadID The ID of the upload.
   * @param {object} data Data properties to add to the result object.
   */


  Uppy.prototype.addResultData = function addResultData(uploadID, data) {
    var _extends5;

    if (!this._getUpload(uploadID)) {
      this.log('Not setting result for an upload that has been removed: ' + uploadID);
      return;
    }
    var currentUploads = this.getState().currentUploads;
    var currentUpload = _extends({}, currentUploads[uploadID], {
      result: _extends({}, currentUploads[uploadID].result, data)
    });
    this.setState({
      currentUploads: _extends({}, currentUploads, (_extends5 = {}, _extends5[uploadID] = currentUpload, _extends5))
    });
  };

  /**
   * Remove an upload, eg. if it has been canceled or completed.
   *
   * @param {string} uploadID The ID of the upload.
   */


  Uppy.prototype._removeUpload = function _removeUpload(uploadID) {
    var currentUploads = _extends({}, this.getState().currentUploads);
    delete currentUploads[uploadID];

    this.setState({
      currentUploads: currentUploads
    });
  };

  /**
   * Run an upload. This picks up where it left off in case the upload is being restored.
   *
   * @private
   */


  Uppy.prototype._runUpload = function _runUpload(uploadID) {
    var _this8 = this;

    var uploadData = this.getState().currentUploads[uploadID];
    var restoreStep = uploadData.step;

    var steps = [].concat(this.preProcessors, this.uploaders, this.postProcessors);
    var lastStep = Promise.resolve();
    steps.forEach(function (fn, step) {
      // Skip this step if we are restoring and have already completed this step before.
      if (step < restoreStep) {
        return;
      }

      lastStep = lastStep.then(function () {
        var _extends6;

        var _getState6 = _this8.getState(),
            currentUploads = _getState6.currentUploads;

        var currentUpload = _extends({}, currentUploads[uploadID], {
          step: step
        });
        _this8.setState({
          currentUploads: _extends({}, currentUploads, (_extends6 = {}, _extends6[uploadID] = currentUpload, _extends6))
        });

        // TODO give this the `currentUpload` object as its only parameter maybe?
        // Otherwise when more metadata may be added to the upload this would keep getting more parameters
        return fn(currentUpload.fileIDs, uploadID);
      }).then(function (result) {
        return null;
      });
    });

    // Not returning the `catch`ed promise, because we still want to return a rejected
    // promise from this method if the upload failed.
    lastStep.catch(function (err) {
      _this8.emit('error', err, uploadID);
      _this8._removeUpload(uploadID);
    });

    return lastStep.then(function () {
      // Set result data.
      var _getState7 = _this8.getState(),
          currentUploads = _getState7.currentUploads;

      var currentUpload = currentUploads[uploadID];
      if (!currentUpload) {
        _this8.log('Not setting result for an upload that has been removed: ' + uploadID);
        return;
      }

      var files = currentUpload.fileIDs.map(function (fileID) {
        return _this8.getFile(fileID);
      });
      var successful = files.filter(function (file) {
        return !file.error;
      });
      var failed = files.filter(function (file) {
        return file.error;
      });
      _this8.addResultData(uploadID, { successful: successful, failed: failed, uploadID: uploadID });
    }).then(function () {
      // Emit completion events.
      // This is in a separate function so that the `currentUploads` variable
      // always refers to the latest state. In the handler right above it refers
      // to an outdated object without the `.result` property.
      var _getState8 = _this8.getState(),
          currentUploads = _getState8.currentUploads;

      var currentUpload = currentUploads[uploadID];
      var result = currentUpload.result;
      _this8.emit('complete', result);

      _this8._removeUpload(uploadID);

      return result;
    });
  };

  /**
   * Start an upload for all the files that are not currently being uploaded.
   *
   * @return {Promise}
   */


  Uppy.prototype.upload = function upload() {
    var _this9 = this;

    if (!this.plugins.uploader) {
      this.log('No uploader type plugins are used', 'warning');
    }

    var files = this.getState().files;
    var onBeforeUploadResult = this.opts.onBeforeUpload(files);

    if (onBeforeUploadResult === false) {
      return Promise.reject(new Error('Not starting the upload because onBeforeUpload returned false'));
    }

    if (onBeforeUploadResult && (typeof onBeforeUploadResult === 'undefined' ? 'undefined' : _typeof(onBeforeUploadResult)) === 'object') {
      // warning after the change in 0.24
      if (onBeforeUploadResult.then) {
        throw new TypeError('onBeforeUpload() returned a Promise, but this is no longer supported. It must be synchronous.');
      }

      files = onBeforeUploadResult;
    }

    return Promise.resolve().then(function () {
      return _this9._checkMinNumberOfFiles(files);
    }).then(function () {
      var _getState9 = _this9.getState(),
          currentUploads = _getState9.currentUploads;
      // get a list of files that are currently assigned to uploads


      var currentlyUploadingFiles = Object.keys(currentUploads).reduce(function (prev, curr) {
        return prev.concat(currentUploads[curr].fileIDs);
      }, []);

      var waitingFileIDs = [];
      Object.keys(files).forEach(function (fileID) {
        var file = _this9.getFile(fileID);
        // if the file hasn't started uploading and hasn't already been assigned to an upload..
        if (!file.progress.uploadStarted && currentlyUploadingFiles.indexOf(fileID) === -1) {
          waitingFileIDs.push(file.id);
        }
      });

      var uploadID = _this9._createUpload(waitingFileIDs);
      return _this9._runUpload(uploadID);
    }).catch(function (err) {
      var message = (typeof err === 'undefined' ? 'undefined' : _typeof(err)) === 'object' ? err.message : err;
      var details = (typeof err === 'undefined' ? 'undefined' : _typeof(err)) === 'object' ? err.details : null;
      _this9.log(message + ' ' + details);
      _this9.info({ message: message, details: details }, 'error', 4000);
      return Promise.reject((typeof err === 'undefined' ? 'undefined' : _typeof(err)) === 'object' ? err : new Error(err));
    });
  };

  _createClass(Uppy, [{
    key: 'state',
    get: function get() {
      return this.getState();
    }
  }]);

  return Uppy;
}();

module.exports = function (opts) {
  return new Uppy(opts);
};

// Expose class constructor.
module.exports.Uppy = Uppy;
module.exports.Plugin = Plugin;

},{"./../../store-default":33,"./../../utils/lib/Translator":35,"./../../utils/lib/generateFileID":38,"./../../utils/lib/getFileNameAndExtension":39,"./../../utils/lib/getFileType":40,"./../../utils/lib/getTimeStamp":42,"./Plugin":29,"cuid":1,"mime-match":8,"namespace-emitter":9,"prettier-bytes":11}],31:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./../../core'),
    Plugin = _require.Plugin;

var Translator = require('./../../utils/lib/Translator');
var toArray = require('./../../utils/lib/toArray');
var dragDrop = require('drag-drop');

var _require2 = require('preact'),
    h = _require2.h;

/**
 * Drag & Drop plugin
 *
 */


module.exports = function (_Plugin) {
  _inherits(DragDrop, _Plugin);

  function DragDrop(uppy, opts) {
    _classCallCheck(this, DragDrop);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.type = 'acquirer';
    _this.id = _this.opts.id || 'DragDrop';
    _this.title = 'Drag & Drop';

    var defaultLocale = {
      strings: {
        dropHereOr: 'Drop files here or %{browse}',
        browse: 'browse'
      }

      // Default options
    };var defaultOpts = {
      target: null,
      inputName: 'files[]',
      width: '100%',
      height: '100%',
      note: null,
      locale: defaultLocale

      // Merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOpts, opts);

    // Check for browser dragDrop support
    _this.isDragDropSupported = _this.checkDragDropSupport();

    // i18n
    _this.translator = new Translator([defaultLocale, _this.uppy.locale, _this.opts.locale]);
    _this.i18n = _this.translator.translate.bind(_this.translator);
    _this.i18nArray = _this.translator.translateArray.bind(_this.translator);

    // Bind `this` to class methods
    _this.handleDrop = _this.handleDrop.bind(_this);
    _this.handleInputChange = _this.handleInputChange.bind(_this);
    _this.checkDragDropSupport = _this.checkDragDropSupport.bind(_this);
    _this.render = _this.render.bind(_this);
    return _this;
  }

  /**
   * Checks if the browser supports Drag & Drop (not supported on mobile devices, for example).
   * @return {Boolean}
   */


  DragDrop.prototype.checkDragDropSupport = function checkDragDropSupport() {
    var div = document.createElement('div');

    if (!('draggable' in div) || !('ondragstart' in div && 'ondrop' in div)) {
      return false;
    }

    if (!('FormData' in window)) {
      return false;
    }

    if (!('FileReader' in window)) {
      return false;
    }

    return true;
  };

  DragDrop.prototype.handleDrop = function handleDrop(files) {
    var _this2 = this;

    this.uppy.log('[DragDrop] Files dropped');

    files.forEach(function (file) {
      try {
        _this2.uppy.addFile({
          source: _this2.id,
          name: file.name,
          type: file.type,
          data: file
        });
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    });
  };

  DragDrop.prototype.handleInputChange = function handleInputChange(ev) {
    var _this3 = this;

    this.uppy.log('[DragDrop] Files selected through input');

    var files = toArray(ev.target.files);

    files.forEach(function (file) {
      try {
        _this3.uppy.addFile({
          source: _this3.id,
          name: file.name,
          type: file.type,
          data: file
        });
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    });
  };

  DragDrop.prototype.render = function render(state) {
    var _this4 = this;

    /* http://tympanus.net/codrops/2015/09/15/styling-customizing-file-inputs-smart-way/ */
    var hiddenInputStyle = {
      width: '0.1px',
      height: '0.1px',
      opacity: 0,
      overflow: 'hidden',
      position: 'absolute',
      zIndex: -1
    };
    var DragDropClass = 'uppy-Root uppy-DragDrop-container ' + (this.isDragDropSupported ? 'uppy-DragDrop--is-dragdrop-supported' : '');
    var DragDropStyle = {
      width: this.opts.width,
      height: this.opts.height
    };
    var restrictions = this.uppy.opts.restrictions;

    // empty value="" on file input, so that the input is cleared after a file is selected,
    // because Uppy will be handling the upload and so we can select same file
    // after removing — otherwise browser thinks it’s already selected
    return h(
      'div',
      { 'class': DragDropClass, style: DragDropStyle },
      h(
        'div',
        { 'class': 'uppy-DragDrop-inner' },
        h(
          'svg',
          { 'aria-hidden': 'true', 'class': 'UppyIcon uppy-DragDrop-arrow', width: '16', height: '16', viewBox: '0 0 16 16', xmlns: 'http://www.w3.org/2000/svg' },
          h('path', { d: 'M11 10V0H5v10H2l6 6 6-6h-3zm0 0', 'fill-rule': 'evenodd' })
        ),
        h(
          'label',
          { 'class': 'uppy-DragDrop-label' },
          h('input', { style: hiddenInputStyle,
            'class': 'uppy-DragDrop-input',
            type: 'file',
            name: this.opts.inputName,
            multiple: restrictions.maxNumberOfFiles !== 1,
            accept: restrictions.allowedFileTypes,
            ref: function ref(input) {
              _this4.input = input;
            },
            onchange: this.handleInputChange,
            value: '' }),
          this.i18nArray('dropHereOr', {
            browse: h(
              'span',
              { 'class': 'uppy-DragDrop-dragText' },
              this.i18n('browse')
            )
          })
        ),
        h(
          'span',
          { 'class': 'uppy-DragDrop-note' },
          this.opts.note
        )
      )
    );
  };

  DragDrop.prototype.install = function install() {
    var _this5 = this;

    var target = this.opts.target;
    if (target) {
      this.mount(target, this);
    }
    this.removeDragDropListener = dragDrop(this.el, function (files) {
      _this5.handleDrop(files);
      _this5.uppy.log(files);
    });
  };

  DragDrop.prototype.uninstall = function uninstall() {
    this.unmount();
    this.removeDragDropListener();
  };

  return DragDrop;
}(Plugin);

},{"./../../core":30,"./../../utils/lib/Translator":35,"./../../utils/lib/toArray":47,"drag-drop":4,"preact":10}],32:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./../../core'),
    Plugin = _require.Plugin;

var _require2 = require('preact'),
    h = _require2.h;

/**
 * Progress bar
 *
 */


module.exports = function (_Plugin) {
  _inherits(ProgressBar, _Plugin);

  function ProgressBar(uppy, opts) {
    _classCallCheck(this, ProgressBar);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.id = _this.opts.id || 'ProgressBar';
    _this.title = 'Progress Bar';
    _this.type = 'progressindicator';

    // set default options
    var defaultOptions = {
      target: 'body',
      replaceTargetContent: false,
      fixed: false,
      hideAfterFinish: true

      // merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOptions, opts);

    _this.render = _this.render.bind(_this);
    return _this;
  }

  ProgressBar.prototype.render = function render(state) {
    var progress = state.totalProgress || 0;
    var isHidden = progress === 100 && this.opts.hideAfterFinish;
    return h(
      'div',
      { 'class': 'uppy uppy-ProgressBar', style: { position: this.opts.fixed ? 'fixed' : 'initial' }, 'aria-hidden': isHidden },
      h('div', { 'class': 'uppy-ProgressBar-inner', style: { width: progress + '%' } }),
      h(
        'div',
        { 'class': 'uppy-ProgressBar-percentage' },
        progress
      )
    );
  };

  ProgressBar.prototype.install = function install() {
    var target = this.opts.target;
    if (target) {
      this.mount(target, this);
    }
  };

  ProgressBar.prototype.uninstall = function uninstall() {
    this.unmount();
  };

  return ProgressBar;
}(Plugin);

},{"./../../core":30,"preact":10}],33:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Default store that keeps state in a simple object.
 */
var DefaultStore = function () {
  function DefaultStore() {
    _classCallCheck(this, DefaultStore);

    this.state = {};
    this.callbacks = [];
  }

  DefaultStore.prototype.getState = function getState() {
    return this.state;
  };

  DefaultStore.prototype.setState = function setState(patch) {
    var prevState = _extends({}, this.state);
    var nextState = _extends({}, this.state, patch);

    this.state = nextState;
    this._publish(prevState, nextState, patch);
  };

  DefaultStore.prototype.subscribe = function subscribe(listener) {
    var _this = this;

    this.callbacks.push(listener);
    return function () {
      // Remove the listener.
      _this.callbacks.splice(_this.callbacks.indexOf(listener), 1);
    };
  };

  DefaultStore.prototype._publish = function _publish() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    this.callbacks.forEach(function (listener) {
      listener.apply(undefined, args);
    });
  };

  return DefaultStore;
}();

module.exports = function defaultStore() {
  return new DefaultStore();
};

},{}],34:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./../../core'),
    Plugin = _require.Plugin;

var tus = require('tus-js-client');

var _require2 = require('./../../companion-client'),
    Provider = _require2.Provider,
    RequestClient = _require2.RequestClient,
    Socket = _require2.Socket;

var emitSocketProgress = require('./../../utils/lib/emitSocketProgress');
var getSocketHost = require('./../../utils/lib/getSocketHost');
var settle = require('./../../utils/lib/settle');
var limitPromises = require('./../../utils/lib/limitPromises');

// Extracted from https://github.com/tus/tus-js-client/blob/master/lib/upload.js#L13
// excepted we removed 'fingerprint' key to avoid adding more dependencies
var tusDefaultOptions = {
  endpoint: '',
  resume: true,
  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,
  headers: {},
  chunkSize: Infinity,
  withCredentials: false,
  uploadUrl: null,
  uploadSize: null,
  overridePatchMethod: false,
  retryDelays: null

  /**
   * Create a wrapper around an event emitter with a `remove` method to remove
   * all events that were added using the wrapped emitter.
   */
};function createEventTracker(emitter) {
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

/**
 * Tus resumable file uploader
 *
 */
module.exports = function (_Plugin) {
  _inherits(Tus, _Plugin);

  function Tus(uppy, opts) {
    _classCallCheck(this, Tus);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.type = 'uploader';
    _this.id = 'Tus';
    _this.title = 'Tus';

    // set default options
    var defaultOptions = {
      resume: true,
      autoRetry: true,
      useFastRemoteRetry: true,
      limit: 0,
      retryDelays: [0, 1000, 3000, 5000]

      // merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOptions, opts);

    // Simultaneous upload limiting is shared across all uploads with this plugin.
    if (typeof _this.opts.limit === 'number' && _this.opts.limit !== 0) {
      _this.limitUploads = limitPromises(_this.opts.limit);
    } else {
      _this.limitUploads = function (fn) {
        return fn;
      };
    }

    _this.uploaders = Object.create(null);
    _this.uploaderEvents = Object.create(null);
    _this.uploaderSockets = Object.create(null);

    _this.handleResetProgress = _this.handleResetProgress.bind(_this);
    _this.handleUpload = _this.handleUpload.bind(_this);
    return _this;
  }

  Tus.prototype.handleResetProgress = function handleResetProgress() {
    var files = _extends({}, this.uppy.getState().files);
    Object.keys(files).forEach(function (fileID) {
      // Only clone the file object if it has a Tus `uploadUrl` attached.
      if (files[fileID].tus && files[fileID].tus.uploadUrl) {
        var tusState = _extends({}, files[fileID].tus);
        delete tusState.uploadUrl;
        files[fileID] = _extends({}, files[fileID], { tus: tusState });
      }
    });

    this.uppy.setState({ files: files });
  };

  /**
   * Clean up all references for a file's upload: the tus.Upload instance,
   * any events related to the file, and the Companion WebSocket connection.
   */


  Tus.prototype.resetUploaderReferences = function resetUploaderReferences(fileID) {
    if (this.uploaders[fileID]) {
      this.uploaders[fileID].abort();
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

  /**
   * Create a new Tus upload
   *
   * @param {object} file for use with upload
   * @param {integer} current file in a queue
   * @param {integer} total number of files in a queue
   * @returns {Promise}
   */


  Tus.prototype.upload = function upload(file, current, total) {
    var _this2 = this;

    this.resetUploaderReferences(file.id);

    // Create a new tus upload
    return new Promise(function (resolve, reject) {
      var optsTus = _extends({}, tusDefaultOptions, _this2.opts,
      // Install file-specific upload overrides.
      file.tus || {});

      optsTus.onError = function (err) {
        _this2.uppy.log(err);
        _this2.uppy.emit('upload-error', file, err);
        err.message = 'Failed because: ' + err.message;

        _this2.resetUploaderReferences(file.id);
        reject(err);
      };

      optsTus.onProgress = function (bytesUploaded, bytesTotal) {
        _this2.onReceiveUploadUrl(file, upload.url);
        _this2.uppy.emit('upload-progress', file, {
          uploader: _this2,
          bytesUploaded: bytesUploaded,
          bytesTotal: bytesTotal
        });
      };

      optsTus.onSuccess = function () {
        _this2.uppy.emit('upload-success', file, upload, upload.url);

        if (upload.url) {
          _this2.uppy.log('Download ' + upload.file.name + ' from ' + upload.url);
        }

        _this2.resetUploaderReferences(file.id);
        resolve(upload);
      };

      var copyProp = function copyProp(obj, srcProp, destProp) {
        if (Object.prototype.hasOwnProperty.call(obj, srcProp) && !Object.prototype.hasOwnProperty.call(obj, destProp)) {
          obj[destProp] = obj[srcProp];
        }
      };

      // tusd uses metadata fields 'filetype' and 'filename'
      var meta = _extends({}, file.meta);
      copyProp(meta, 'type', 'filetype');
      copyProp(meta, 'name', 'filename');
      optsTus.metadata = meta;

      var upload = new tus.Upload(file.data, optsTus);
      _this2.uploaders[file.id] = upload;
      _this2.uploaderEvents[file.id] = createEventTracker(_this2.uppy);

      _this2.onFileRemove(file.id, function (targetFileID) {
        _this2.resetUploaderReferences(file.id);
        resolve('upload ' + targetFileID + ' was removed');
      });

      _this2.onPause(file.id, function (isPaused) {
        if (isPaused) {
          upload.abort();
        } else {
          upload.start();
        }
      });

      _this2.onPauseAll(file.id, function () {
        upload.abort();
      });

      _this2.onCancelAll(file.id, function () {
        _this2.resetUploaderReferences(file.id);
      });

      _this2.onResumeAll(file.id, function () {
        if (file.error) {
          upload.abort();
        }
        upload.start();
      });

      if (!file.isPaused) {
        upload.start();
      }
    });
  };

  Tus.prototype.uploadRemote = function uploadRemote(file, current, total) {
    var _this3 = this;

    this.resetUploaderReferences(file.id);

    var opts = _extends({}, this.opts,
    // Install file-specific upload overrides.
    file.tus || {});

    return new Promise(function (resolve, reject) {
      _this3.uppy.log(file.remote.url);
      if (file.serverToken) {
        return _this3.connectToServerSocket(file).then(function () {
          return resolve();
        }).catch(reject);
      }

      _this3.uppy.emit('upload-started', file);
      var Client = file.remote.providerOptions.provider ? Provider : RequestClient;
      var client = new Client(_this3.uppy, file.remote.providerOptions);
      client.post(file.remote.url, _extends({}, file.remote.body, {
        endpoint: opts.endpoint,
        uploadUrl: opts.uploadUrl,
        protocol: 'tus',
        size: file.data.size,
        metadata: file.meta
      })).then(function (res) {
        _this3.uppy.setFileState(file.id, { serverToken: res.token });
        file = _this3.uppy.getFile(file.id);
        return file;
      }).then(function (file) {
        return _this3.connectToServerSocket(file);
      }).then(function () {
        resolve();
      }).catch(function (err) {
        reject(new Error(err));
      });
    });
  };

  Tus.prototype.connectToServerSocket = function connectToServerSocket(file) {
    var _this4 = this;

    return new Promise(function (resolve, reject) {
      var token = file.serverToken;
      var host = getSocketHost(file.remote.serverUrl);
      var socket = new Socket({ target: host + '/api/' + token });
      _this4.uploaderSockets[file.id] = socket;
      _this4.uploaderEvents[file.id] = createEventTracker(_this4.uppy);

      _this4.onFileRemove(file.id, function () {
        socket.send('pause', {});
        resolve('upload ' + file.id + ' was removed');
      });

      _this4.onPause(file.id, function (isPaused) {
        isPaused ? socket.send('pause', {}) : socket.send('resume', {});
      });

      _this4.onPauseAll(file.id, function () {
        return socket.send('pause', {});
      });

      _this4.onCancelAll(file.id, function () {
        return socket.send('pause', {});
      });

      _this4.onResumeAll(file.id, function () {
        if (file.error) {
          socket.send('pause', {});
        }
        socket.send('resume', {});
      });

      _this4.onRetry(file.id, function () {
        socket.send('pause', {});
        socket.send('resume', {});
      });

      _this4.onRetryAll(file.id, function () {
        socket.send('pause', {});
        socket.send('resume', {});
      });

      if (file.isPaused) {
        socket.send('pause', {});
      }

      socket.on('progress', function (progressData) {
        return emitSocketProgress(_this4, progressData, file);
      });

      socket.on('error', function (errData) {
        var message = errData.error.message;

        var error = _extends(new Error(message), { cause: errData.error });

        // If the remote retry optimisation should not be used,
        // close the socket—this will tell companion to clear state and delete the file.
        if (!_this4.opts.useFastRemoteRetry) {
          _this4.resetUploaderReferences(file.id);
          // Remove the serverToken so that a new one will be created for the retry.
          _this4.uppy.setFileState(file.id, {
            serverToken: null
          });
        }

        _this4.uppy.emit('upload-error', file, error);
        reject(error);
      });

      socket.on('success', function (data) {
        _this4.uppy.emit('upload-success', file, data, data.url);
        _this4.resetUploaderReferences(file.id);
        resolve();
      });
    });
  };

  /**
   * Store the uploadUrl on the file options, so that when Golden Retriever
   * restores state, we will continue uploading to the correct URL.
   */


  Tus.prototype.onReceiveUploadUrl = function onReceiveUploadUrl(file, uploadURL) {
    var currentFile = this.uppy.getFile(file.id);
    if (!currentFile) return;
    // Only do the update if we didn't have an upload URL yet.
    if (!currentFile.tus || currentFile.tus.uploadUrl !== uploadURL) {
      this.uppy.log('[Tus] Storing upload url');
      this.uppy.setFileState(currentFile.id, {
        tus: _extends({}, currentFile.tus, {
          uploadUrl: uploadURL
        })
      });
    }
  };

  Tus.prototype.onFileRemove = function onFileRemove(fileID, cb) {
    this.uploaderEvents[fileID].on('file-removed', function (file) {
      if (fileID === file.id) cb(file.id);
    });
  };

  Tus.prototype.onPause = function onPause(fileID, cb) {
    this.uploaderEvents[fileID].on('upload-pause', function (targetFileID, isPaused) {
      if (fileID === targetFileID) {
        // const isPaused = this.uppy.pauseResume(fileID)
        cb(isPaused);
      }
    });
  };

  Tus.prototype.onRetry = function onRetry(fileID, cb) {
    this.uploaderEvents[fileID].on('upload-retry', function (targetFileID) {
      if (fileID === targetFileID) {
        cb();
      }
    });
  };

  Tus.prototype.onRetryAll = function onRetryAll(fileID, cb) {
    var _this5 = this;

    this.uploaderEvents[fileID].on('retry-all', function (filesToRetry) {
      if (!_this5.uppy.getFile(fileID)) return;
      cb();
    });
  };

  Tus.prototype.onPauseAll = function onPauseAll(fileID, cb) {
    var _this6 = this;

    this.uploaderEvents[fileID].on('pause-all', function () {
      if (!_this6.uppy.getFile(fileID)) return;
      cb();
    });
  };

  Tus.prototype.onCancelAll = function onCancelAll(fileID, cb) {
    var _this7 = this;

    this.uploaderEvents[fileID].on('cancel-all', function () {
      if (!_this7.uppy.getFile(fileID)) return;
      cb();
    });
  };

  Tus.prototype.onResumeAll = function onResumeAll(fileID, cb) {
    var _this8 = this;

    this.uploaderEvents[fileID].on('resume-all', function () {
      if (!_this8.uppy.getFile(fileID)) return;
      cb();
    });
  };

  Tus.prototype.uploadFiles = function uploadFiles(files) {
    var _this9 = this;

    var actions = files.map(function (file, i) {
      var current = parseInt(i, 10) + 1;
      var total = files.length;

      if (file.error) {
        return function () {
          return Promise.reject(new Error(file.error));
        };
      } else if (file.isRemote) {
        // We emit upload-started here, so that it's also emitted for files
        // that have to wait due to the `limit` option.
        _this9.uppy.emit('upload-started', file);
        return _this9.uploadRemote.bind(_this9, file, current, total);
      } else {
        _this9.uppy.emit('upload-started', file);
        return _this9.upload.bind(_this9, file, current, total);
      }
    });

    var promises = actions.map(function (action) {
      var limitedAction = _this9.limitUploads(action);
      return limitedAction();
    });

    return settle(promises);
  };

  Tus.prototype.handleUpload = function handleUpload(fileIDs) {
    var _this10 = this;

    if (fileIDs.length === 0) {
      this.uppy.log('Tus: no files to upload!');
      return Promise.resolve();
    }

    this.uppy.log('Tus is uploading...');
    var filesToUpload = fileIDs.map(function (fileID) {
      return _this10.uppy.getFile(fileID);
    });

    return this.uploadFiles(filesToUpload).then(function () {
      return null;
    });
  };

  Tus.prototype.install = function install() {
    this.uppy.setState({
      capabilities: _extends({}, this.uppy.getState().capabilities, {
        resumableUploads: true
      })
    });
    this.uppy.addUploader(this.handleUpload);

    this.uppy.on('reset-progress', this.handleResetProgress);

    if (this.opts.autoRetry) {
      this.uppy.on('back-online', this.uppy.retryAll);
    }
  };

  Tus.prototype.uninstall = function uninstall() {
    this.uppy.setState({
      capabilities: _extends({}, this.uppy.getState().capabilities, {
        resumableUploads: false
      })
    });
    this.uppy.removeUploader(this.handleUpload);

    if (this.opts.autoRetry) {
      this.uppy.off('back-online', this.uppy.retryAll);
    }
  };

  return Tus;
}(Plugin);

},{"./../../companion-client":28,"./../../core":30,"./../../utils/lib/emitSocketProgress":36,"./../../utils/lib/getSocketHost":41,"./../../utils/lib/limitPromises":44,"./../../utils/lib/settle":46,"tus-js-client":21}],35:[function(require,module,exports){
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Translates strings with interpolation & pluralization support.
 * Extensible with custom dictionaries and pluralization functions.
 *
 * Borrows heavily from and inspired by Polyglot https://github.com/airbnb/polyglot.js,
 * basically a stripped-down version of it. Differences: pluralization functions are not hardcoded
 * and can be easily added among with dictionaries, nested objects are used for pluralization
 * as opposed to `||||` delimeter
 *
 * Usage example: `translator.translate('files_chosen', {smart_count: 3})`
 *
 * @param {object|Array<object>} locale Locale or list of locales.
 */
module.exports = function () {
  function Translator(locales) {
    var _this = this;

    _classCallCheck(this, Translator);

    this.locale = {
      strings: {},
      pluralize: function pluralize(n) {
        if (n === 1) {
          return 0;
        }
        return 1;
      }
    };

    if (Array.isArray(locales)) {
      locales.forEach(function (locale) {
        return _this._apply(locale);
      });
    } else {
      this._apply(locales);
    }
  }

  Translator.prototype._apply = function _apply(locale) {
    if (!locale || !locale.strings) {
      return;
    }

    var prevLocale = this.locale;
    this.locale = _extends({}, prevLocale, {
      strings: _extends({}, prevLocale.strings, locale.strings)
    });
    this.locale.pluralize = locale.pluralize || prevLocale.pluralize;
  };

  /**
   * Takes a string with placeholder variables like `%{smart_count} file selected`
   * and replaces it with values from options `{smart_count: 5}`
   *
   * @license https://github.com/airbnb/polyglot.js/blob/master/LICENSE
   * taken from https://github.com/airbnb/polyglot.js/blob/master/lib/polyglot.js#L299
   *
   * @param {string} phrase that needs interpolation, with placeholders
   * @param {object} options with values that will be used to replace placeholders
   * @return {string} interpolated
   */


  Translator.prototype.interpolate = function interpolate(phrase, options) {
    var _String$prototype = String.prototype,
        split = _String$prototype.split,
        replace = _String$prototype.replace;

    var dollarRegex = /\$/g;
    var dollarBillsYall = '$$$$';
    var interpolated = [phrase];

    for (var arg in options) {
      if (arg !== '_' && options.hasOwnProperty(arg)) {
        // Ensure replacement value is escaped to prevent special $-prefixed
        // regex replace tokens. the "$$$$" is needed because each "$" needs to
        // be escaped with "$" itself, and we need two in the resulting output.
        var replacement = options[arg];
        if (typeof replacement === 'string') {
          replacement = replace.call(options[arg], dollarRegex, dollarBillsYall);
        }
        // We create a new `RegExp` each time instead of using a more-efficient
        // string replace so that the same argument can be replaced multiple times
        // in the same phrase.
        interpolated = insertReplacement(interpolated, new RegExp('%\\{' + arg + '\\}', 'g'), replacement);
      }
    }

    return interpolated;

    function insertReplacement(source, rx, replacement) {
      var newParts = [];
      source.forEach(function (chunk) {
        split.call(chunk, rx).forEach(function (raw, i, list) {
          if (raw !== '') {
            newParts.push(raw);
          }

          // Interlace with the `replacement` value
          if (i < list.length - 1) {
            newParts.push(replacement);
          }
        });
      });
      return newParts;
    }
  };

  /**
   * Public translate method
   *
   * @param {string} key
   * @param {object} options with values that will be used later to replace placeholders in string
   * @return {string} translated (and interpolated)
   */


  Translator.prototype.translate = function translate(key, options) {
    return this.translateArray(key, options).join('');
  };

  /**
   * Get a translation and return the translated and interpolated parts as an array.
   * @param {string} key
   * @param {object} options with values that will be used to replace placeholders
   * @return {Array} The translated and interpolated parts, in order.
   */


  Translator.prototype.translateArray = function translateArray(key, options) {
    if (options && typeof options.smart_count !== 'undefined') {
      var plural = this.locale.pluralize(options.smart_count);
      return this.interpolate(this.locale.strings[key][plural], options);
    }

    return this.interpolate(this.locale.strings[key], options);
  };

  return Translator;
}();

},{}],36:[function(require,module,exports){
var throttle = require('lodash.throttle');

function _emitSocketProgress(uploader, progressData, file) {
  var progress = progressData.progress,
      bytesUploaded = progressData.bytesUploaded,
      bytesTotal = progressData.bytesTotal;

  if (progress) {
    uploader.uppy.log('Upload progress: ' + progress);
    uploader.uppy.emit('upload-progress', file, {
      uploader: uploader,
      bytesUploaded: bytesUploaded,
      bytesTotal: bytesTotal
    });
  }
}

module.exports = throttle(_emitSocketProgress, 300, { leading: true, trailing: true });

},{"lodash.throttle":7}],37:[function(require,module,exports){
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isDOMElement = require('./isDOMElement');

/**
 * Find a DOM element.
 *
 * @param {Node|string} element
 * @return {Node|null}
 */
module.exports = function findDOMElement(element) {
  if (typeof element === 'string') {
    return document.querySelector(element);
  }

  if ((typeof element === 'undefined' ? 'undefined' : _typeof(element)) === 'object' && isDOMElement(element)) {
    return element;
  }
};

},{"./isDOMElement":43}],38:[function(require,module,exports){
/**
 * Takes a file object and turns it into fileID, by converting file.name to lowercase,
 * removing extra characters and adding type, size and lastModified
 *
 * @param {Object} file
 * @return {String} the fileID
 *
 */
module.exports = function generateFileID(file) {
  // filter is needed to not join empty values with `-`
  return ['uppy', file.name ? file.name.toLowerCase().replace(/[^A-Z0-9]/ig, '') : '', file.type, file.data.size, file.data.lastModified].filter(function (val) {
    return val;
  }).join('-');
};

},{}],39:[function(require,module,exports){
/**
* Takes a full filename string and returns an object {name, extension}
*
* @param {string} fullFileName
* @return {object} {name, extension}
*/
module.exports = function getFileNameAndExtension(fullFileName) {
  var re = /(?:\.([^.]+))?$/;
  var fileExt = re.exec(fullFileName)[1];
  var fileName = fullFileName.replace('.' + fileExt, '');
  return {
    name: fileName,
    extension: fileExt
  };
};

},{}],40:[function(require,module,exports){
var getFileNameAndExtension = require('./getFileNameAndExtension');
var mimeTypes = require('./mimeTypes');

module.exports = function getFileType(file) {
  var fileExtension = file.name ? getFileNameAndExtension(file.name).extension : null;

  if (file.isRemote) {
    // some remote providers do not support file types
    return file.type ? file.type : mimeTypes[fileExtension];
  }

  // check if mime type is set in the file object
  if (file.type) {
    return file.type;
  }

  // see if we can map extension to a mime type
  if (fileExtension && mimeTypes[fileExtension]) {
    return mimeTypes[fileExtension];
  }

  // if all fails, fall back to a generic byte stream type
  return 'application/octet-stream';
};

},{"./getFileNameAndExtension":39,"./mimeTypes":45}],41:[function(require,module,exports){
module.exports = function getSocketHost(url) {
  // get the host domain
  var regex = /^(?:https?:\/\/|\/\/)?(?:[^@\n]+@)?(?:www\.)?([^\n]+)/;
  var host = regex.exec(url)[1];
  var socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws';

  return socketProtocol + '://' + host;
};

},{}],42:[function(require,module,exports){
/**
 * Returns a timestamp in the format of `hours:minutes:seconds`
*/
module.exports = function getTimeStamp() {
  var date = new Date();
  var hours = pad(date.getHours().toString());
  var minutes = pad(date.getMinutes().toString());
  var seconds = pad(date.getSeconds().toString());
  return hours + ':' + minutes + ':' + seconds;
};

/**
 * Adds zero to strings shorter than two characters
*/
function pad(str) {
  return str.length !== 2 ? 0 + str : str;
}

},{}],43:[function(require,module,exports){
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Check if an object is a DOM element. Duck-typing based on `nodeType`.
 *
 * @param {*} obj
 */
module.exports = function isDOMElement(obj) {
  return obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj.nodeType === Node.ELEMENT_NODE;
};

},{}],44:[function(require,module,exports){
/**
 * Limit the amount of simultaneously pending Promises.
 * Returns a function that, when passed a function `fn`,
 * will make sure that at most `limit` calls to `fn` are pending.
 *
 * @param {number} limit
 * @return {function()}
 */
module.exports = function limitPromises(limit) {
  var pending = 0;
  var queue = [];
  return function (fn) {
    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var call = function call() {
        pending++;
        var promise = fn.apply(undefined, args);
        promise.then(onfinish, onfinish);
        return promise;
      };

      if (pending >= limit) {
        return new Promise(function (resolve, reject) {
          queue.push(function () {
            call().then(resolve, reject);
          });
        });
      }
      return call();
    };
  };
  function onfinish() {
    pending--;
    var next = queue.shift();
    if (next) next();
  }
};

},{}],45:[function(require,module,exports){
module.exports = {
  'md': 'text/markdown',
  'markdown': 'text/markdown',
  'mp4': 'video/mp4',
  'mp3': 'audio/mp3',
  'svg': 'image/svg+xml',
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'yaml': 'text/yaml',
  'yml': 'text/yaml',
  'csv': 'text/csv',
  'avi': 'video/x-msvideo',
  'mks': 'video/x-matroska',
  'mkv': 'video/x-matroska',
  'mov': 'video/quicktime',
  'doc': 'application/msword',
  'docm': 'application/vnd.ms-word.document.macroenabled.12',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'dot': 'application/msword',
  'dotm': 'application/vnd.ms-word.template.macroenabled.12',
  'dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  'xla': 'application/vnd.ms-excel',
  'xlam': 'application/vnd.ms-excel.addin.macroenabled.12',
  'xlc': 'application/vnd.ms-excel',
  'xlf': 'application/x-xliff+xml',
  'xlm': 'application/vnd.ms-excel',
  'xls': 'application/vnd.ms-excel',
  'xlsb': 'application/vnd.ms-excel.sheet.binary.macroenabled.12',
  'xlsm': 'application/vnd.ms-excel.sheet.macroenabled.12',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xlt': 'application/vnd.ms-excel',
  'xltm': 'application/vnd.ms-excel.template.macroenabled.12',
  'xltx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  'xlw': 'application/vnd.ms-excel'
};

},{}],46:[function(require,module,exports){
module.exports = function settle(promises) {
  var resolutions = [];
  var rejections = [];
  function resolved(value) {
    resolutions.push(value);
  }
  function rejected(error) {
    rejections.push(error);
  }

  var wait = Promise.all(promises.map(function (promise) {
    return promise.then(resolved, rejected);
  }));

  return wait.then(function () {
    return {
      successful: resolutions,
      failed: rejections
    };
  });
};

},{}],47:[function(require,module,exports){
/**
 * Converts list into array
*/
module.exports = function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
};

},{}],48:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],49:[function(require,module,exports){
var Uppy = require('./../../../../packages/@uppy/core');
var DragDrop = require('./../../../../packages/@uppy/drag-drop');
var ProgressBar = require('./../../../../packages/@uppy/progress-bar');
var Tus = require('./../../../../packages/@uppy/tus');

var uppyOne = new Uppy({ debug: true, autoProceed: true });
uppyOne.use(DragDrop, { target: '.UppyDragDrop-One' }).use(Tus, { endpoint: 'https://master.tus.io/files/' }).use(ProgressBar, { target: '.UppyDragDrop-One-Progress', hideAfterFinish: false });

var uppyTwo = new Uppy({ debug: true, autoProceed: false });
uppyTwo.use(DragDrop, { target: '#UppyDragDrop-Two' }).use(Tus, { endpoint: 'https://master.tus.io/files/' }).use(ProgressBar, { target: '.UppyDragDrop-Two-Progress', hideAfterFinish: false });

var uploadBtn = document.querySelector('.UppyDragDrop-Two-Upload');
uploadBtn.addEventListener('click', function () {
  uppyTwo.upload();
});

},{"./../../../../packages/@uppy/core":30,"./../../../../packages/@uppy/drag-drop":31,"./../../../../packages/@uppy/progress-bar":32,"./../../../../packages/@uppy/tus":34}]},{},[49])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9ub2RlX21vZHVsZXMvY3VpZC9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9jdWlkL2xpYi9maW5nZXJwcmludC5icm93c2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2N1aWQvbGliL3BhZC5qcyIsIi4uL25vZGVfbW9kdWxlcy9kcmFnLWRyb3AvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvZXh0ZW5kL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2ZsYXR0ZW4vaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoLnRocm90dGxlL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL21pbWUtbWF0Y2gvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvbmFtZXNwYWNlLWVtaXR0ZXIvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvcHJlYWN0L2Rpc3QvcHJlYWN0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3ByZXR0aWVyLWJ5dGVzL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5naWZ5L2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3JlcXVpcmVzLXBvcnQvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvcnVuLXBhcmFsbGVsL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3R1cy1qcy1jbGllbnQvbGliLmVzNS9icm93c2VyL2Jhc2U2NC5qcyIsIi4uL25vZGVfbW9kdWxlcy90dXMtanMtY2xpZW50L2xpYi5lczUvYnJvd3Nlci9yZXF1ZXN0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3R1cy1qcy1jbGllbnQvbGliLmVzNS9icm93c2VyL3NvdXJjZS5qcyIsIi4uL25vZGVfbW9kdWxlcy90dXMtanMtY2xpZW50L2xpYi5lczUvYnJvd3Nlci9zdG9yYWdlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3R1cy1qcy1jbGllbnQvbGliLmVzNS9lcnJvci5qcyIsIi4uL25vZGVfbW9kdWxlcy90dXMtanMtY2xpZW50L2xpYi5lczUvZmluZ2VycHJpbnQuanMiLCIuLi9ub2RlX21vZHVsZXMvdHVzLWpzLWNsaWVudC9saWIuZXM1L2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3R1cy1qcy1jbGllbnQvbGliLmVzNS91cGxvYWQuanMiLCIuLi9ub2RlX21vZHVsZXMvdXJsLXBhcnNlL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3dpbGRjYXJkL2luZGV4LmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvY29tcGFuaW9uLWNsaWVudC9zcmMvUHJvdmlkZXIuanMiLCIuLi9wYWNrYWdlcy9AdXBweS9jb21wYW5pb24tY2xpZW50L3NyYy9SZXF1ZXN0Q2xpZW50LmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvY29tcGFuaW9uLWNsaWVudC9zcmMvU29ja2V0LmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvY29tcGFuaW9uLWNsaWVudC9zcmMvaW5kZXguanMiLCIuLi9wYWNrYWdlcy9AdXBweS9jb3JlL3NyYy9QbHVnaW4uanMiLCIuLi9wYWNrYWdlcy9AdXBweS9jb3JlL3NyYy9pbmRleC5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L2RyYWctZHJvcC9zcmMvaW5kZXguanMiLCIuLi9wYWNrYWdlcy9AdXBweS9wcm9ncmVzcy1iYXIvc3JjL2luZGV4LmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvc3RvcmUtZGVmYXVsdC9zcmMvaW5kZXguanMiLCIuLi9wYWNrYWdlcy9AdXBweS90dXMvc3JjL2luZGV4LmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL1RyYW5zbGF0b3IuanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvZW1pdFNvY2tldFByb2dyZXNzLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL2ZpbmRET01FbGVtZW50LmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL2dlbmVyYXRlRmlsZUlELmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL2dldEZpbGVOYW1lQW5kRXh0ZW5zaW9uLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL2dldEZpbGVUeXBlLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL2dldFNvY2tldEhvc3QuanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvZ2V0VGltZVN0YW1wLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL2lzRE9NRWxlbWVudC5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L3V0aWxzL3NyYy9saW1pdFByb21pc2VzLmpzIiwiLi4vcGFja2FnZXMvQHVwcHkvdXRpbHMvc3JjL21pbWVUeXBlcy5qcyIsIi4uL3BhY2thZ2VzL0B1cHB5L3V0aWxzL3NyYy9zZXR0bGUuanMiLCIuLi9wYWNrYWdlcy9AdXBweS91dGlscy9zcmMvdG9BcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJzcmMvZXhhbXBsZXMvZHJhZ2Ryb3AvYXBwLmVzNiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcmxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQSxJQUFNLE9BQU8sUUFBUSxZQUFSLENBQWI7QUFDQSxJQUFNLFdBQVcsUUFBUSxpQkFBUixDQUFqQjtBQUNBLElBQU0sY0FBYyxRQUFRLG9CQUFSLENBQXBCO0FBQ0EsSUFBTSxNQUFNLFFBQVEsV0FBUixDQUFaOztBQUVBLElBQU0sVUFBVSxJQUFJLElBQUosQ0FBUyxFQUFDLE9BQU8sSUFBUixFQUFjLGFBQWEsSUFBM0IsRUFBVCxDQUFoQjtBQUNBLFFBQ0csR0FESCxDQUNPLFFBRFAsRUFDaUIsRUFBQyxRQUFRLG1CQUFULEVBRGpCLEVBRUcsR0FGSCxDQUVPLEdBRlAsRUFFWSxFQUFDLFVBQVUsOEJBQVgsRUFGWixFQUdHLEdBSEgsQ0FHTyxXQUhQLEVBR29CLEVBQUMsUUFBUSw0QkFBVCxFQUF1QyxpQkFBaUIsS0FBeEQsRUFIcEI7O0FBS0EsSUFBTSxVQUFVLElBQUksSUFBSixDQUFTLEVBQUMsT0FBTyxJQUFSLEVBQWMsYUFBYSxLQUEzQixFQUFULENBQWhCO0FBQ0EsUUFDRyxHQURILENBQ08sUUFEUCxFQUNpQixFQUFDLFFBQVEsbUJBQVQsRUFEakIsRUFFRyxHQUZILENBRU8sR0FGUCxFQUVZLEVBQUMsVUFBVSw4QkFBWCxFQUZaLEVBR0csR0FISCxDQUdPLFdBSFAsRUFHb0IsRUFBQyxRQUFRLDRCQUFULEVBQXVDLGlCQUFpQixLQUF4RCxFQUhwQjs7QUFLQSxJQUFJLFlBQVksU0FBUyxhQUFULENBQXVCLDBCQUF2QixDQUFoQjtBQUNBLFVBQVUsZ0JBQVYsQ0FBMkIsT0FBM0IsRUFBb0MsWUFBWTtBQUM5QyxVQUFRLE1BQVI7QUFDRCxDQUZEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyoqXG4gKiBjdWlkLmpzXG4gKiBDb2xsaXNpb24tcmVzaXN0YW50IFVJRCBnZW5lcmF0b3IgZm9yIGJyb3dzZXJzIGFuZCBub2RlLlxuICogU2VxdWVudGlhbCBmb3IgZmFzdCBkYiBsb29rdXBzIGFuZCByZWNlbmN5IHNvcnRpbmcuXG4gKiBTYWZlIGZvciBlbGVtZW50IElEcyBhbmQgc2VydmVyLXNpZGUgbG9va3Vwcy5cbiAqXG4gKiBFeHRyYWN0ZWQgZnJvbSBDTENUUlxuICpcbiAqIENvcHlyaWdodCAoYykgRXJpYyBFbGxpb3R0IDIwMTJcbiAqIE1JVCBMaWNlbnNlXG4gKi9cblxudmFyIGZpbmdlcnByaW50ID0gcmVxdWlyZSgnLi9saWIvZmluZ2VycHJpbnQuanMnKTtcbnZhciBwYWQgPSByZXF1aXJlKCcuL2xpYi9wYWQuanMnKTtcblxudmFyIGMgPSAwLFxuICBibG9ja1NpemUgPSA0LFxuICBiYXNlID0gMzYsXG4gIGRpc2NyZXRlVmFsdWVzID0gTWF0aC5wb3coYmFzZSwgYmxvY2tTaXplKTtcblxuZnVuY3Rpb24gcmFuZG9tQmxvY2sgKCkge1xuICByZXR1cm4gcGFkKChNYXRoLnJhbmRvbSgpICpcbiAgICBkaXNjcmV0ZVZhbHVlcyA8PCAwKVxuICAgIC50b1N0cmluZyhiYXNlKSwgYmxvY2tTaXplKTtcbn1cblxuZnVuY3Rpb24gc2FmZUNvdW50ZXIgKCkge1xuICBjID0gYyA8IGRpc2NyZXRlVmFsdWVzID8gYyA6IDA7XG4gIGMrKzsgLy8gdGhpcyBpcyBub3Qgc3VibGltaW5hbFxuICByZXR1cm4gYyAtIDE7XG59XG5cbmZ1bmN0aW9uIGN1aWQgKCkge1xuICAvLyBTdGFydGluZyB3aXRoIGEgbG93ZXJjYXNlIGxldHRlciBtYWtlc1xuICAvLyBpdCBIVE1MIGVsZW1lbnQgSUQgZnJpZW5kbHkuXG4gIHZhciBsZXR0ZXIgPSAnYycsIC8vIGhhcmQtY29kZWQgYWxsb3dzIGZvciBzZXF1ZW50aWFsIGFjY2Vzc1xuXG4gICAgLy8gdGltZXN0YW1wXG4gICAgLy8gd2FybmluZzogdGhpcyBleHBvc2VzIHRoZSBleGFjdCBkYXRlIGFuZCB0aW1lXG4gICAgLy8gdGhhdCB0aGUgdWlkIHdhcyBjcmVhdGVkLlxuICAgIHRpbWVzdGFtcCA9IChuZXcgRGF0ZSgpLmdldFRpbWUoKSkudG9TdHJpbmcoYmFzZSksXG5cbiAgICAvLyBQcmV2ZW50IHNhbWUtbWFjaGluZSBjb2xsaXNpb25zLlxuICAgIGNvdW50ZXIgPSBwYWQoc2FmZUNvdW50ZXIoKS50b1N0cmluZyhiYXNlKSwgYmxvY2tTaXplKSxcblxuICAgIC8vIEEgZmV3IGNoYXJzIHRvIGdlbmVyYXRlIGRpc3RpbmN0IGlkcyBmb3IgZGlmZmVyZW50XG4gICAgLy8gY2xpZW50cyAoc28gZGlmZmVyZW50IGNvbXB1dGVycyBhcmUgZmFyIGxlc3NcbiAgICAvLyBsaWtlbHkgdG8gZ2VuZXJhdGUgdGhlIHNhbWUgaWQpXG4gICAgcHJpbnQgPSBmaW5nZXJwcmludCgpLFxuXG4gICAgLy8gR3JhYiBzb21lIG1vcmUgY2hhcnMgZnJvbSBNYXRoLnJhbmRvbSgpXG4gICAgcmFuZG9tID0gcmFuZG9tQmxvY2soKSArIHJhbmRvbUJsb2NrKCk7XG5cbiAgcmV0dXJuIGxldHRlciArIHRpbWVzdGFtcCArIGNvdW50ZXIgKyBwcmludCArIHJhbmRvbTtcbn1cblxuY3VpZC5zbHVnID0gZnVuY3Rpb24gc2x1ZyAoKSB7XG4gIHZhciBkYXRlID0gbmV3IERhdGUoKS5nZXRUaW1lKCkudG9TdHJpbmcoMzYpLFxuICAgIGNvdW50ZXIgPSBzYWZlQ291bnRlcigpLnRvU3RyaW5nKDM2KS5zbGljZSgtNCksXG4gICAgcHJpbnQgPSBmaW5nZXJwcmludCgpLnNsaWNlKDAsIDEpICtcbiAgICAgIGZpbmdlcnByaW50KCkuc2xpY2UoLTEpLFxuICAgIHJhbmRvbSA9IHJhbmRvbUJsb2NrKCkuc2xpY2UoLTIpO1xuXG4gIHJldHVybiBkYXRlLnNsaWNlKC0yKSArXG4gICAgY291bnRlciArIHByaW50ICsgcmFuZG9tO1xufTtcblxuY3VpZC5pc0N1aWQgPSBmdW5jdGlvbiBpc0N1aWQgKHN0cmluZ1RvQ2hlY2spIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmdUb0NoZWNrICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICBpZiAoc3RyaW5nVG9DaGVjay5zdGFydHNXaXRoKCdjJykpIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59O1xuXG5jdWlkLmlzU2x1ZyA9IGZ1bmN0aW9uIGlzU2x1ZyAoc3RyaW5nVG9DaGVjaykge1xuICBpZiAodHlwZW9mIHN0cmluZ1RvQ2hlY2sgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gIHZhciBzdHJpbmdMZW5ndGggPSBzdHJpbmdUb0NoZWNrLmxlbmd0aDtcbiAgaWYgKHN0cmluZ0xlbmd0aCA+PSA3ICYmIHN0cmluZ0xlbmd0aCA8PSAxMCkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbmN1aWQuZmluZ2VycHJpbnQgPSBmaW5nZXJwcmludDtcblxubW9kdWxlLmV4cG9ydHMgPSBjdWlkO1xuIiwidmFyIHBhZCA9IHJlcXVpcmUoJy4vcGFkLmpzJyk7XG5cbnZhciBlbnYgPSB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyA/IHdpbmRvdyA6IHNlbGY7XG52YXIgZ2xvYmFsQ291bnQgPSBPYmplY3Qua2V5cyhlbnYpLmxlbmd0aDtcbnZhciBtaW1lVHlwZXNMZW5ndGggPSBuYXZpZ2F0b3IubWltZVR5cGVzID8gbmF2aWdhdG9yLm1pbWVUeXBlcy5sZW5ndGggOiAwO1xudmFyIGNsaWVudElkID0gcGFkKChtaW1lVHlwZXNMZW5ndGggK1xuICBuYXZpZ2F0b3IudXNlckFnZW50Lmxlbmd0aCkudG9TdHJpbmcoMzYpICtcbiAgZ2xvYmFsQ291bnQudG9TdHJpbmcoMzYpLCA0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmaW5nZXJwcmludCAoKSB7XG4gIHJldHVybiBjbGllbnRJZDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhZCAobnVtLCBzaXplKSB7XG4gIHZhciBzID0gJzAwMDAwMDAwMCcgKyBudW07XG4gIHJldHVybiBzLnN1YnN0cihzLmxlbmd0aCAtIHNpemUpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZHJhZ0Ryb3BcblxudmFyIGZsYXR0ZW4gPSByZXF1aXJlKCdmbGF0dGVuJylcbnZhciBwYXJhbGxlbCA9IHJlcXVpcmUoJ3J1bi1wYXJhbGxlbCcpXG5cbmZ1bmN0aW9uIGRyYWdEcm9wIChlbGVtLCBsaXN0ZW5lcnMpIHtcbiAgaWYgKHR5cGVvZiBlbGVtID09PSAnc3RyaW5nJykge1xuICAgIHZhciBzZWxlY3RvciA9IGVsZW1cbiAgICBlbGVtID0gd2luZG93LmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbSlcbiAgICBpZiAoIWVsZW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignXCInICsgc2VsZWN0b3IgKyAnXCIgZG9lcyBub3QgbWF0Y2ggYW55IEhUTUwgZWxlbWVudHMnKVxuICAgIH1cbiAgfVxuXG4gIGlmICghZWxlbSkge1xuICAgIHRocm93IG5ldyBFcnJvcignXCInICsgZWxlbSArICdcIiBpcyBub3QgYSB2YWxpZCBIVE1MIGVsZW1lbnQnKVxuICB9XG5cbiAgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBsaXN0ZW5lcnMgPSB7IG9uRHJvcDogbGlzdGVuZXJzIH1cbiAgfVxuXG4gIHZhciB0aW1lb3V0XG5cbiAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBvbkRyYWdFbnRlciwgZmFsc2UpXG4gIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCBvbkRyYWdPdmVyLCBmYWxzZSlcbiAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCBvbkRyYWdMZWF2ZSwgZmFsc2UpXG4gIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIG9uRHJvcCwgZmFsc2UpXG5cbiAgLy8gRnVuY3Rpb24gdG8gcmVtb3ZlIGRyYWctZHJvcCBsaXN0ZW5lcnNcbiAgcmV0dXJuIGZ1bmN0aW9uIHJlbW92ZSAoKSB7XG4gICAgcmVtb3ZlRHJhZ0NsYXNzKClcbiAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdlbnRlcicsIG9uRHJhZ0VudGVyLCBmYWxzZSlcbiAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgb25EcmFnT3ZlciwgZmFsc2UpXG4gICAgZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCBvbkRyYWdMZWF2ZSwgZmFsc2UpXG4gICAgZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKCdkcm9wJywgb25Ecm9wLCBmYWxzZSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRHJhZ0VudGVyIChlKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbkRyYWdFbnRlcikge1xuICAgICAgbGlzdGVuZXJzLm9uRHJhZ0VudGVyKGUpXG4gICAgfVxuXG4gICAgLy8gUHJldmVudCBldmVudFxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRHJhZ092ZXIgKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgaWYgKGUuZGF0YVRyYW5zZmVyLml0ZW1zKSB7XG4gICAgICAvLyBPbmx5IGFkZCBcImRyYWdcIiBjbGFzcyB3aGVuIGBpdGVtc2AgY29udGFpbnMgaXRlbXMgdGhhdCBhcmUgYWJsZSB0byBiZVxuICAgICAgLy8gaGFuZGxlZCBieSB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lcnMgKGZpbGVzIHZzLiB0ZXh0KVxuICAgICAgdmFyIGl0ZW1zID0gdG9BcnJheShlLmRhdGFUcmFuc2Zlci5pdGVtcylcbiAgICAgIHZhciBmaWxlSXRlbXMgPSBpdGVtcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHsgcmV0dXJuIGl0ZW0ua2luZCA9PT0gJ2ZpbGUnIH0pXG4gICAgICB2YXIgdGV4dEl0ZW1zID0gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7IHJldHVybiBpdGVtLmtpbmQgPT09ICdzdHJpbmcnIH0pXG5cbiAgICAgIGlmIChmaWxlSXRlbXMubGVuZ3RoID09PSAwICYmICFsaXN0ZW5lcnMub25Ecm9wVGV4dCkgcmV0dXJuXG4gICAgICBpZiAodGV4dEl0ZW1zLmxlbmd0aCA9PT0gMCAmJiAhbGlzdGVuZXJzLm9uRHJvcCkgcmV0dXJuXG4gICAgICBpZiAoZmlsZUl0ZW1zLmxlbmd0aCA9PT0gMCAmJiB0ZXh0SXRlbXMubGVuZ3RoID09PSAwKSByZXR1cm5cbiAgICB9XG5cbiAgICBlbGVtLmNsYXNzTGlzdC5hZGQoJ2RyYWcnKVxuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuXG4gICAgaWYgKGxpc3RlbmVycy5vbkRyYWdPdmVyKSB7XG4gICAgICBsaXN0ZW5lcnMub25EcmFnT3ZlcihlKVxuICAgIH1cblxuICAgIGUuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weSdcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uRHJhZ0xlYXZlIChlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKGxpc3RlbmVycy5vbkRyYWdMZWF2ZSkge1xuICAgICAgbGlzdGVuZXJzLm9uRHJhZ0xlYXZlKGUpXG4gICAgfVxuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpXG4gICAgdGltZW91dCA9IHNldFRpbWVvdXQocmVtb3ZlRHJhZ0NsYXNzLCA1MClcblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgZnVuY3Rpb24gb25Ecm9wIChlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKGxpc3RlbmVycy5vbkRyYWdMZWF2ZSkge1xuICAgICAgbGlzdGVuZXJzLm9uRHJhZ0xlYXZlKGUpXG4gICAgfVxuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpXG4gICAgcmVtb3ZlRHJhZ0NsYXNzKClcblxuICAgIHZhciBwb3MgPSB7XG4gICAgICB4OiBlLmNsaWVudFgsXG4gICAgICB5OiBlLmNsaWVudFlcbiAgICB9XG5cbiAgICAvLyB0ZXh0IGRyb3Agc3VwcG9ydFxuICAgIHZhciB0ZXh0ID0gZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndGV4dCcpXG4gICAgaWYgKHRleHQgJiYgbGlzdGVuZXJzLm9uRHJvcFRleHQpIHtcbiAgICAgIGxpc3RlbmVycy5vbkRyb3BUZXh0KHRleHQsIHBvcylcbiAgICB9XG5cbiAgICAvLyBmaWxlIGRyb3Agc3VwcG9ydFxuICAgIGlmIChlLmRhdGFUcmFuc2Zlci5pdGVtcykge1xuICAgICAgLy8gSGFuZGxlIGRpcmVjdG9yaWVzIGluIENocm9tZSB1c2luZyB0aGUgcHJvcHJpZXRhcnkgRmlsZVN5c3RlbSBBUElcbiAgICAgIHZhciBpdGVtcyA9IHRvQXJyYXkoZS5kYXRhVHJhbnNmZXIuaXRlbXMpLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICByZXR1cm4gaXRlbS5raW5kID09PSAnZmlsZSdcbiAgICAgIH0pXG5cbiAgICAgIGlmIChpdGVtcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gICAgICBwYXJhbGxlbChpdGVtcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChjYikge1xuICAgICAgICAgIHByb2Nlc3NFbnRyeShpdGVtLndlYmtpdEdldEFzRW50cnkoKSwgY2IpXG4gICAgICAgIH1cbiAgICAgIH0pLCBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XG4gICAgICAgIC8vIFRoaXMgY2F0Y2hlcyBwZXJtaXNzaW9uIGVycm9ycyB3aXRoIGZpbGU6Ly8gaW4gQ2hyb21lLiBUaGlzIHNob3VsZCBuZXZlclxuICAgICAgICAvLyB0aHJvdyBpbiBwcm9kdWN0aW9uIGNvZGUsIHNvIHRoZSB1c2VyIGRvZXMgbm90IG5lZWQgdG8gdXNlIHRyeS1jYXRjaC5cbiAgICAgICAgaWYgKGVycikgdGhyb3cgZXJyXG4gICAgICAgIGlmIChsaXN0ZW5lcnMub25Ecm9wKSB7XG4gICAgICAgICAgbGlzdGVuZXJzLm9uRHJvcChmbGF0dGVuKHJlc3VsdHMpLCBwb3MpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBmaWxlcyA9IHRvQXJyYXkoZS5kYXRhVHJhbnNmZXIuZmlsZXMpXG5cbiAgICAgIGlmIChmaWxlcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gICAgICBmaWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIGZpbGUuZnVsbFBhdGggPSAnLycgKyBmaWxlLm5hbWVcbiAgICAgIH0pXG5cbiAgICAgIGlmIChsaXN0ZW5lcnMub25Ecm9wKSB7XG4gICAgICAgIGxpc3RlbmVycy5vbkRyb3AoZmlsZXMsIHBvcylcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZURyYWdDbGFzcyAoKSB7XG4gICAgZWxlbS5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnJylcbiAgfVxufVxuXG5mdW5jdGlvbiBwcm9jZXNzRW50cnkgKGVudHJ5LCBjYikge1xuICB2YXIgZW50cmllcyA9IFtdXG5cbiAgaWYgKGVudHJ5LmlzRmlsZSkge1xuICAgIGVudHJ5LmZpbGUoZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgIGZpbGUuZnVsbFBhdGggPSBlbnRyeS5mdWxsUGF0aCAvLyBwcmVzZXJ2ZSBwYXRoaW5nIGZvciBjb25zdW1lclxuICAgICAgY2IobnVsbCwgZmlsZSlcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBjYihlcnIpXG4gICAgfSlcbiAgfSBlbHNlIGlmIChlbnRyeS5pc0RpcmVjdG9yeSkge1xuICAgIHZhciByZWFkZXIgPSBlbnRyeS5jcmVhdGVSZWFkZXIoKVxuICAgIHJlYWRFbnRyaWVzKClcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRFbnRyaWVzICgpIHtcbiAgICByZWFkZXIucmVhZEVudHJpZXMoZnVuY3Rpb24gKGVudHJpZXNfKSB7XG4gICAgICBpZiAoZW50cmllc18ubGVuZ3RoID4gMCkge1xuICAgICAgICBlbnRyaWVzID0gZW50cmllcy5jb25jYXQodG9BcnJheShlbnRyaWVzXykpXG4gICAgICAgIHJlYWRFbnRyaWVzKCkgLy8gY29udGludWUgcmVhZGluZyBlbnRyaWVzIHVudGlsIGByZWFkRW50cmllc2AgcmV0dXJucyBubyBtb3JlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkb25lRW50cmllcygpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRvbmVFbnRyaWVzICgpIHtcbiAgICBwYXJhbGxlbChlbnRyaWVzLm1hcChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgcHJvY2Vzc0VudHJ5KGVudHJ5LCBjYilcbiAgICAgIH1cbiAgICB9KSwgY2IpXG4gIH1cbn1cblxuZnVuY3Rpb24gdG9BcnJheSAobGlzdCkge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwobGlzdCB8fCBbXSwgMClcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG52YXIgaXNBcnJheSA9IGZ1bmN0aW9uIGlzQXJyYXkoYXJyKSB7XG5cdGlmICh0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBBcnJheS5pc0FycmF5KGFycik7XG5cdH1cblxuXHRyZXR1cm4gdG9TdHIuY2FsbChhcnIpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxudmFyIGlzUGxhaW5PYmplY3QgPSBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iaikge1xuXHRpZiAoIW9iaiB8fCB0b1N0ci5jYWxsKG9iaikgIT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0dmFyIGhhc093bkNvbnN0cnVjdG9yID0gaGFzT3duLmNhbGwob2JqLCAnY29uc3RydWN0b3InKTtcblx0dmFyIGhhc0lzUHJvdG90eXBlT2YgPSBvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSAmJiBoYXNPd24uY2FsbChvYmouY29uc3RydWN0b3IucHJvdG90eXBlLCAnaXNQcm90b3R5cGVPZicpO1xuXHQvLyBOb3Qgb3duIGNvbnN0cnVjdG9yIHByb3BlcnR5IG11c3QgYmUgT2JqZWN0XG5cdGlmIChvYmouY29uc3RydWN0b3IgJiYgIWhhc093bkNvbnN0cnVjdG9yICYmICFoYXNJc1Byb3RvdHlwZU9mKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gT3duIHByb3BlcnRpZXMgYXJlIGVudW1lcmF0ZWQgZmlyc3RseSwgc28gdG8gc3BlZWQgdXAsXG5cdC8vIGlmIGxhc3Qgb25lIGlzIG93biwgdGhlbiBhbGwgcHJvcGVydGllcyBhcmUgb3duLlxuXHR2YXIga2V5O1xuXHRmb3IgKGtleSBpbiBvYmopIHsgLyoqLyB9XG5cblx0cmV0dXJuIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnIHx8IGhhc093bi5jYWxsKG9iaiwga2V5KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXh0ZW5kKCkge1xuXHR2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmU7XG5cdHZhciB0YXJnZXQgPSBhcmd1bWVudHNbMF07XG5cdHZhciBpID0gMTtcblx0dmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdHZhciBkZWVwID0gZmFsc2U7XG5cblx0Ly8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuXHRpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nKSB7XG5cdFx0ZGVlcCA9IHRhcmdldDtcblx0XHR0YXJnZXQgPSBhcmd1bWVudHNbMV0gfHwge307XG5cdFx0Ly8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuXHRcdGkgPSAyO1xuXHR9XG5cdGlmICh0YXJnZXQgPT0gbnVsbCB8fCAodHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJykpIHtcblx0XHR0YXJnZXQgPSB7fTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0XHRvcHRpb25zID0gYXJndW1lbnRzW2ldO1xuXHRcdC8vIE9ubHkgZGVhbCB3aXRoIG5vbi1udWxsL3VuZGVmaW5lZCB2YWx1ZXNcblx0XHRpZiAob3B0aW9ucyAhPSBudWxsKSB7XG5cdFx0XHQvLyBFeHRlbmQgdGhlIGJhc2Ugb2JqZWN0XG5cdFx0XHRmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xuXHRcdFx0XHRzcmMgPSB0YXJnZXRbbmFtZV07XG5cdFx0XHRcdGNvcHkgPSBvcHRpb25zW25hbWVdO1xuXG5cdFx0XHRcdC8vIFByZXZlbnQgbmV2ZXItZW5kaW5nIGxvb3Bcblx0XHRcdFx0aWYgKHRhcmdldCAhPT0gY29weSkge1xuXHRcdFx0XHRcdC8vIFJlY3Vyc2UgaWYgd2UncmUgbWVyZ2luZyBwbGFpbiBvYmplY3RzIG9yIGFycmF5c1xuXHRcdFx0XHRcdGlmIChkZWVwICYmIGNvcHkgJiYgKGlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gaXNBcnJheShjb3B5KSkpKSB7XG5cdFx0XHRcdFx0XHRpZiAoY29weUlzQXJyYXkpIHtcblx0XHRcdFx0XHRcdFx0Y29weUlzQXJyYXkgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmMgJiYgaXNBcnJheShzcmMpID8gc3JjIDogW107XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiBpc1BsYWluT2JqZWN0KHNyYykgPyBzcmMgOiB7fTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gTmV2ZXIgbW92ZSBvcmlnaW5hbCBvYmplY3RzLCBjbG9uZSB0aGVtXG5cdFx0XHRcdFx0XHR0YXJnZXRbbmFtZV0gPSBleHRlbmQoZGVlcCwgY2xvbmUsIGNvcHkpO1xuXG5cdFx0XHRcdFx0Ly8gRG9uJ3QgYnJpbmcgaW4gdW5kZWZpbmVkIHZhbHVlc1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGNvcHkgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdFx0XHR0YXJnZXRbbmFtZV0gPSBjb3B5O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIFJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG5cdHJldHVybiB0YXJnZXQ7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmbGF0dGVuKGxpc3QsIGRlcHRoKSB7XG4gIGRlcHRoID0gKHR5cGVvZiBkZXB0aCA9PSAnbnVtYmVyJykgPyBkZXB0aCA6IEluZmluaXR5O1xuXG4gIGlmICghZGVwdGgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShsaXN0KSkge1xuICAgICAgcmV0dXJuIGxpc3QubWFwKGZ1bmN0aW9uKGkpIHsgcmV0dXJuIGk7IH0pO1xuICAgIH1cbiAgICByZXR1cm4gbGlzdDtcbiAgfVxuXG4gIHJldHVybiBfZmxhdHRlbihsaXN0LCAxKTtcblxuICBmdW5jdGlvbiBfZmxhdHRlbihsaXN0LCBkKSB7XG4gICAgcmV0dXJuIGxpc3QucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGl0ZW0pIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pICYmIGQgPCBkZXB0aCkge1xuICAgICAgICByZXR1cm4gYWNjLmNvbmNhdChfZmxhdHRlbihpdGVtLCBkICsgMSkpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBhY2MuY29uY2F0KGl0ZW0pO1xuICAgICAgfVxuICAgIH0sIFtdKTtcbiAgfVxufTtcbiIsIi8qKlxuICogbG9kYXNoIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgalF1ZXJ5IEZvdW5kYXRpb24gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyA8aHR0cHM6Ly9qcXVlcnkub3JnLz5cbiAqIFJlbGVhc2VkIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqL1xuXG4vKiogVXNlZCBhcyB0aGUgYFR5cGVFcnJvcmAgbWVzc2FnZSBmb3IgXCJGdW5jdGlvbnNcIiBtZXRob2RzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTkFOID0gMCAvIDA7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxuLyoqIFVzZWQgdG8gbWF0Y2ggbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZS4gKi9cbnZhciByZVRyaW0gPSAvXlxccyt8XFxzKyQvZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGJhZCBzaWduZWQgaGV4YWRlY2ltYWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmFkSGV4ID0gL15bLStdMHhbMC05YS1mXSskL2k7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiaW5hcnkgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzQmluYXJ5ID0gL14wYlswMV0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3Qgb2N0YWwgc3RyaW5nIHZhbHVlcy4gKi9cbnZhciByZUlzT2N0YWwgPSAvXjBvWzAtN10rJC9pO1xuXG4vKiogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgd2l0aG91dCBhIGRlcGVuZGVuY3kgb24gYHJvb3RgLiAqL1xudmFyIGZyZWVQYXJzZUludCA9IHBhcnNlSW50O1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAgZnJvbSBOb2RlLmpzLiAqL1xudmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbCAmJiBnbG9iYWwuT2JqZWN0ID09PSBPYmplY3QgJiYgZ2xvYmFsO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHNlbGZgLiAqL1xudmFyIGZyZWVTZWxmID0gdHlwZW9mIHNlbGYgPT0gJ29iamVjdCcgJiYgc2VsZiAmJiBzZWxmLk9iamVjdCA9PT0gT2JqZWN0ICYmIHNlbGY7XG5cbi8qKiBVc2VkIGFzIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0LiAqL1xudmFyIHJvb3QgPSBmcmVlR2xvYmFsIHx8IGZyZWVTZWxmIHx8IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXG4gICAgbmF0aXZlTWluID0gTWF0aC5taW47XG5cbi8qKlxuICogR2V0cyB0aGUgdGltZXN0YW1wIG9mIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlXG4gKiB0aGUgVW5peCBlcG9jaCAoMSBKYW51YXJ5IDE5NzAgMDA6MDA6MDAgVVRDKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDIuNC4wXG4gKiBAY2F0ZWdvcnkgRGF0ZVxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgdGltZXN0YW1wLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmRlZmVyKGZ1bmN0aW9uKHN0YW1wKSB7XG4gKiAgIGNvbnNvbGUubG9nKF8ubm93KCkgLSBzdGFtcCk7XG4gKiB9LCBfLm5vdygpKTtcbiAqIC8vID0+IExvZ3MgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaXQgdG9vayBmb3IgdGhlIGRlZmVycmVkIGludm9jYXRpb24uXG4gKi9cbnZhciBub3cgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHJvb3QuRGF0ZS5ub3coKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXG4gKiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiB3YXNcbiAqIGludm9rZWQuIFRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgIG1ldGhvZCB0byBjYW5jZWxcbiAqIGRlbGF5ZWQgYGZ1bmNgIGludm9jYXRpb25zIGFuZCBhIGBmbHVzaGAgbWV0aG9kIHRvIGltbWVkaWF0ZWx5IGludm9rZSB0aGVtLlxuICogUHJvdmlkZSBgb3B0aW9uc2AgdG8gaW5kaWNhdGUgd2hldGhlciBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb24gdGhlXG4gKiBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gVGhlIGBmdW5jYCBpcyBpbnZva2VkXG4gKiB3aXRoIHRoZSBsYXN0IGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uLiBTdWJzZXF1ZW50XG4gKiBjYWxscyB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYFxuICogaW52b2NhdGlvbi5cbiAqXG4gKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzXG4gKiBpbnZva2VkIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIGRlYm91bmNlZCBmdW5jdGlvblxuICogaXMgaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIElmIGB3YWl0YCBpcyBgMGAgYW5kIGBsZWFkaW5nYCBpcyBgZmFsc2VgLCBgZnVuY2AgaW52b2NhdGlvbiBpcyBkZWZlcnJlZFxuICogdW50aWwgdG8gdGhlIG5leHQgdGljaywgc2ltaWxhciB0byBgc2V0VGltZW91dGAgd2l0aCBhIHRpbWVvdXQgb2YgYDBgLlxuICpcbiAqIFNlZSBbRGF2aWQgQ29yYmFjaG8ncyBhcnRpY2xlXShodHRwczovL2Nzcy10cmlja3MuY29tL2RlYm91bmNpbmctdGhyb3R0bGluZy1leHBsYWluZWQtZXhhbXBsZXMvKVxuICogZm9yIGRldGFpbHMgb3ZlciB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBgXy5kZWJvdW5jZWAgYW5kIGBfLnRocm90dGxlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRlYm91bmNlLlxuICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9ZmFsc2VdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdXG4gKiAgVGhlIG1heGltdW0gdGltZSBgZnVuY2AgaXMgYWxsb3dlZCB0byBiZSBkZWxheWVkIGJlZm9yZSBpdCdzIGludm9rZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGRlYm91bmNlZCBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQXZvaWQgY29zdGx5IGNhbGN1bGF0aW9ucyB3aGlsZSB0aGUgd2luZG93IHNpemUgaXMgaW4gZmx1eC5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUnLCBfLmRlYm91bmNlKGNhbGN1bGF0ZUxheW91dCwgMTUwKSk7XG4gKlxuICogLy8gSW52b2tlIGBzZW5kTWFpbGAgd2hlbiBjbGlja2VkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHMuXG4gKiBqUXVlcnkoZWxlbWVudCkub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XG4gKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pKTtcbiAqXG4gKiAvLyBFbnN1cmUgYGJhdGNoTG9nYCBpcyBpbnZva2VkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzLlxuICogdmFyIGRlYm91bmNlZCA9IF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwgeyAnbWF4V2FpdCc6IDEwMDAgfSk7XG4gKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XG4gKiBqUXVlcnkoc291cmNlKS5vbignbWVzc2FnZScsIGRlYm91bmNlZCk7XG4gKlxuICogLy8gQ2FuY2VsIHRoZSB0cmFpbGluZyBkZWJvdW5jZWQgaW52b2NhdGlvbi5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIGRlYm91bmNlZC5jYW5jZWwpO1xuICovXG5mdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBsYXN0QXJncyxcbiAgICAgIGxhc3RUaGlzLFxuICAgICAgbWF4V2FpdCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIHRpbWVySWQsXG4gICAgICBsYXN0Q2FsbFRpbWUsXG4gICAgICBsYXN0SW52b2tlVGltZSA9IDAsXG4gICAgICBsZWFkaW5nID0gZmFsc2UsXG4gICAgICBtYXhpbmcgPSBmYWxzZSxcbiAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICB3YWl0ID0gdG9OdW1iZXIod2FpdCkgfHwgMDtcbiAgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9ICEhb3B0aW9ucy5sZWFkaW5nO1xuICAgIG1heGluZyA9ICdtYXhXYWl0JyBpbiBvcHRpb25zO1xuICAgIG1heFdhaXQgPSBtYXhpbmcgPyBuYXRpdmVNYXgodG9OdW1iZXIob3B0aW9ucy5tYXhXYWl0KSB8fCAwLCB3YWl0KSA6IG1heFdhaXQ7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGludm9rZUZ1bmModGltZSkge1xuICAgIHZhciBhcmdzID0gbGFzdEFyZ3MsXG4gICAgICAgIHRoaXNBcmcgPSBsYXN0VGhpcztcblxuICAgIGxhc3RBcmdzID0gbGFzdFRoaXMgPSB1bmRlZmluZWQ7XG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxlYWRpbmdFZGdlKHRpbWUpIHtcbiAgICAvLyBSZXNldCBhbnkgYG1heFdhaXRgIHRpbWVyLlxuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICAvLyBTdGFydCB0aGUgdGltZXIgZm9yIHRoZSB0cmFpbGluZyBlZGdlLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgLy8gSW52b2tlIHRoZSBsZWFkaW5nIGVkZ2UuXG4gICAgcmV0dXJuIGxlYWRpbmcgPyBpbnZva2VGdW5jKHRpbWUpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtYWluaW5nV2FpdCh0aW1lKSB7XG4gICAgdmFyIHRpbWVTaW5jZUxhc3RDYWxsID0gdGltZSAtIGxhc3RDYWxsVGltZSxcbiAgICAgICAgdGltZVNpbmNlTGFzdEludm9rZSA9IHRpbWUgLSBsYXN0SW52b2tlVGltZSxcbiAgICAgICAgcmVzdWx0ID0gd2FpdCAtIHRpbWVTaW5jZUxhc3RDYWxsO1xuXG4gICAgcmV0dXJuIG1heGluZyA/IG5hdGl2ZU1pbihyZXN1bHQsIG1heFdhaXQgLSB0aW1lU2luY2VMYXN0SW52b2tlKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3VsZEludm9rZSh0aW1lKSB7XG4gICAgdmFyIHRpbWVTaW5jZUxhc3RDYWxsID0gdGltZSAtIGxhc3RDYWxsVGltZSxcbiAgICAgICAgdGltZVNpbmNlTGFzdEludm9rZSA9IHRpbWUgLSBsYXN0SW52b2tlVGltZTtcblxuICAgIC8vIEVpdGhlciB0aGlzIGlzIHRoZSBmaXJzdCBjYWxsLCBhY3Rpdml0eSBoYXMgc3RvcHBlZCBhbmQgd2UncmUgYXQgdGhlXG4gICAgLy8gdHJhaWxpbmcgZWRnZSwgdGhlIHN5c3RlbSB0aW1lIGhhcyBnb25lIGJhY2t3YXJkcyBhbmQgd2UncmUgdHJlYXRpbmdcbiAgICAvLyBpdCBhcyB0aGUgdHJhaWxpbmcgZWRnZSwgb3Igd2UndmUgaGl0IHRoZSBgbWF4V2FpdGAgbGltaXQuXG4gICAgcmV0dXJuIChsYXN0Q2FsbFRpbWUgPT09IHVuZGVmaW5lZCB8fCAodGltZVNpbmNlTGFzdENhbGwgPj0gd2FpdCkgfHxcbiAgICAgICh0aW1lU2luY2VMYXN0Q2FsbCA8IDApIHx8IChtYXhpbmcgJiYgdGltZVNpbmNlTGFzdEludm9rZSA+PSBtYXhXYWl0KSk7XG4gIH1cblxuICBmdW5jdGlvbiB0aW1lckV4cGlyZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKTtcbiAgICBpZiAoc2hvdWxkSW52b2tlKHRpbWUpKSB7XG4gICAgICByZXR1cm4gdHJhaWxpbmdFZGdlKHRpbWUpO1xuICAgIH1cbiAgICAvLyBSZXN0YXJ0IHRoZSB0aW1lci5cbiAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHJlbWFpbmluZ1dhaXQodGltZSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhaWxpbmdFZGdlKHRpbWUpIHtcbiAgICB0aW1lcklkID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gT25seSBpbnZva2UgaWYgd2UgaGF2ZSBgbGFzdEFyZ3NgIHdoaWNoIG1lYW5zIGBmdW5jYCBoYXMgYmVlblxuICAgIC8vIGRlYm91bmNlZCBhdCBsZWFzdCBvbmNlLlxuICAgIGlmICh0cmFpbGluZyAmJiBsYXN0QXJncykge1xuICAgICAgcmV0dXJuIGludm9rZUZ1bmModGltZSk7XG4gICAgfVxuICAgIGxhc3RBcmdzID0gbGFzdFRoaXMgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICBpZiAodGltZXJJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXJJZCk7XG4gICAgfVxuICAgIGxhc3RJbnZva2VUaW1lID0gMDtcbiAgICBsYXN0QXJncyA9IGxhc3RDYWxsVGltZSA9IGxhc3RUaGlzID0gdGltZXJJZCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgIHJldHVybiB0aW1lcklkID09PSB1bmRlZmluZWQgPyByZXN1bHQgOiB0cmFpbGluZ0VkZ2Uobm93KCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVib3VuY2VkKCkge1xuICAgIHZhciB0aW1lID0gbm93KCksXG4gICAgICAgIGlzSW52b2tpbmcgPSBzaG91bGRJbnZva2UodGltZSk7XG5cbiAgICBsYXN0QXJncyA9IGFyZ3VtZW50cztcbiAgICBsYXN0VGhpcyA9IHRoaXM7XG4gICAgbGFzdENhbGxUaW1lID0gdGltZTtcblxuICAgIGlmIChpc0ludm9raW5nKSB7XG4gICAgICBpZiAodGltZXJJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBsZWFkaW5nRWRnZShsYXN0Q2FsbFRpbWUpO1xuICAgICAgfVxuICAgICAgaWYgKG1heGluZykge1xuICAgICAgICAvLyBIYW5kbGUgaW52b2NhdGlvbnMgaW4gYSB0aWdodCBsb29wLlxuICAgICAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgICAgICByZXR1cm4gaW52b2tlRnVuYyhsYXN0Q2FsbFRpbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGltZXJJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aW1lcklkID0gc2V0VGltZW91dCh0aW1lckV4cGlyZWQsIHdhaXQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGRlYm91bmNlZC5jYW5jZWwgPSBjYW5jZWw7XG4gIGRlYm91bmNlZC5mbHVzaCA9IGZsdXNoO1xuICByZXR1cm4gZGVib3VuY2VkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB0aHJvdHRsZWQgZnVuY3Rpb24gdGhhdCBvbmx5IGludm9rZXMgYGZ1bmNgIGF0IG1vc3Qgb25jZSBwZXJcbiAqIGV2ZXJ5IGB3YWl0YCBtaWxsaXNlY29uZHMuIFRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgXG4gKiBtZXRob2QgdG8gY2FuY2VsIGRlbGF5ZWQgYGZ1bmNgIGludm9jYXRpb25zIGFuZCBhIGBmbHVzaGAgbWV0aG9kIHRvXG4gKiBpbW1lZGlhdGVseSBpbnZva2UgdGhlbS4gUHJvdmlkZSBgb3B0aW9uc2AgdG8gaW5kaWNhdGUgd2hldGhlciBgZnVuY2BcbiAqIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGBcbiAqIHRpbWVvdXQuIFRoZSBgZnVuY2AgaXMgaW52b2tlZCB3aXRoIHRoZSBsYXN0IGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGVcbiAqIHRocm90dGxlZCBmdW5jdGlvbi4gU3Vic2VxdWVudCBjYWxscyB0byB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHJldHVybiB0aGVcbiAqIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2AgaW52b2NhdGlvbi5cbiAqXG4gKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzXG4gKiBpbnZva2VkIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIHRocm90dGxlZCBmdW5jdGlvblxuICogaXMgaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIElmIGB3YWl0YCBpcyBgMGAgYW5kIGBsZWFkaW5nYCBpcyBgZmFsc2VgLCBgZnVuY2AgaW52b2NhdGlvbiBpcyBkZWZlcnJlZFxuICogdW50aWwgdG8gdGhlIG5leHQgdGljaywgc2ltaWxhciB0byBgc2V0VGltZW91dGAgd2l0aCBhIHRpbWVvdXQgb2YgYDBgLlxuICpcbiAqIFNlZSBbRGF2aWQgQ29yYmFjaG8ncyBhcnRpY2xlXShodHRwczovL2Nzcy10cmlja3MuY29tL2RlYm91bmNpbmctdGhyb3R0bGluZy1leHBsYWluZWQtZXhhbXBsZXMvKVxuICogZm9yIGRldGFpbHMgb3ZlciB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBgXy50aHJvdHRsZWAgYW5kIGBfLmRlYm91bmNlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHRocm90dGxlLlxuICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHRocm90dGxlIGludm9jYXRpb25zIHRvLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9dHJ1ZV1cbiAqICBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IHRocm90dGxlZCBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQXZvaWQgZXhjZXNzaXZlbHkgdXBkYXRpbmcgdGhlIHBvc2l0aW9uIHdoaWxlIHNjcm9sbGluZy5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdzY3JvbGwnLCBfLnRocm90dGxlKHVwZGF0ZVBvc2l0aW9uLCAxMDApKTtcbiAqXG4gKiAvLyBJbnZva2UgYHJlbmV3VG9rZW5gIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBidXQgbm90IG1vcmUgdGhhbiBvbmNlIGV2ZXJ5IDUgbWludXRlcy5cbiAqIHZhciB0aHJvdHRsZWQgPSBfLnRocm90dGxlKHJlbmV3VG9rZW4sIDMwMDAwMCwgeyAndHJhaWxpbmcnOiBmYWxzZSB9KTtcbiAqIGpRdWVyeShlbGVtZW50KS5vbignY2xpY2snLCB0aHJvdHRsZWQpO1xuICpcbiAqIC8vIENhbmNlbCB0aGUgdHJhaWxpbmcgdGhyb3R0bGVkIGludm9jYXRpb24uXG4gKiBqUXVlcnkod2luZG93KS5vbigncG9wc3RhdGUnLCB0aHJvdHRsZWQuY2FuY2VsKTtcbiAqL1xuZnVuY3Rpb24gdGhyb3R0bGUoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgbGVhZGluZyA9IHRydWUsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9ICdsZWFkaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLmxlYWRpbmcgOiBsZWFkaW5nO1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cbiAgcmV0dXJuIGRlYm91bmNlKGZ1bmMsIHdhaXQsIHtcbiAgICAnbGVhZGluZyc6IGxlYWRpbmcsXG4gICAgJ21heFdhaXQnOiB3YWl0LFxuICAgICd0cmFpbGluZyc6IHRyYWlsaW5nXG4gIH0pO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZVxuICogW2xhbmd1YWdlIHR5cGVdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzKVxuICogb2YgYE9iamVjdGAuIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTeW1ib2xgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBzeW1ib2wsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc1N5bWJvbChTeW1ib2wuaXRlcmF0b3IpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNTeW1ib2woJ2FiYycpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNTeW1ib2wodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnc3ltYm9sJyB8fFxuICAgIChpc09iamVjdExpa2UodmFsdWUpICYmIG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpID09IHN5bWJvbFRhZyk7XG59XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIG51bWJlci5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIG51bWJlci5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b051bWJlcigzLjIpO1xuICogLy8gPT4gMy4yXG4gKlxuICogXy50b051bWJlcihOdW1iZXIuTUlOX1ZBTFVFKTtcbiAqIC8vID0+IDVlLTMyNFxuICpcbiAqIF8udG9OdW1iZXIoSW5maW5pdHkpO1xuICogLy8gPT4gSW5maW5pdHlcbiAqXG4gKiBfLnRvTnVtYmVyKCczLjInKTtcbiAqIC8vID0+IDMuMlxuICovXG5mdW5jdGlvbiB0b051bWJlcih2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGlmIChpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gTkFOO1xuICB9XG4gIGlmIChpc09iamVjdCh2YWx1ZSkpIHtcbiAgICB2YXIgb3RoZXIgPSB0eXBlb2YgdmFsdWUudmFsdWVPZiA9PSAnZnVuY3Rpb24nID8gdmFsdWUudmFsdWVPZigpIDogdmFsdWU7XG4gICAgdmFsdWUgPSBpc09iamVjdChvdGhlcikgPyAob3RoZXIgKyAnJykgOiBvdGhlcjtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSAwID8gdmFsdWUgOiArdmFsdWU7XG4gIH1cbiAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKHJlVHJpbSwgJycpO1xuICB2YXIgaXNCaW5hcnkgPSByZUlzQmluYXJ5LnRlc3QodmFsdWUpO1xuICByZXR1cm4gKGlzQmluYXJ5IHx8IHJlSXNPY3RhbC50ZXN0KHZhbHVlKSlcbiAgICA/IGZyZWVQYXJzZUludCh2YWx1ZS5zbGljZSgyKSwgaXNCaW5hcnkgPyAyIDogOClcbiAgICA6IChyZUlzQmFkSGV4LnRlc3QodmFsdWUpID8gTkFOIDogK3ZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0aHJvdHRsZTtcbiIsInZhciB3aWxkY2FyZCA9IHJlcXVpcmUoJ3dpbGRjYXJkJyk7XG52YXIgcmVNaW1lUGFydFNwbGl0ID0gL1tcXC9cXCtcXC5dLztcblxuLyoqXG4gICMgbWltZS1tYXRjaFxuXG4gIEEgc2ltcGxlIGZ1bmN0aW9uIHRvIGNoZWNrZXIgd2hldGhlciBhIHRhcmdldCBtaW1lIHR5cGUgbWF0Y2hlcyBhIG1pbWUtdHlwZVxuICBwYXR0ZXJuIChlLmcuIGltYWdlL2pwZWcgbWF0Y2hlcyBpbWFnZS9qcGVnIE9SIGltYWdlLyopLlxuXG4gICMjIEV4YW1wbGUgVXNhZ2VcblxuICA8PDwgZXhhbXBsZS5qc1xuXG4qKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGFyZ2V0LCBwYXR0ZXJuKSB7XG4gIGZ1bmN0aW9uIHRlc3QocGF0dGVybikge1xuICAgIHZhciByZXN1bHQgPSB3aWxkY2FyZChwYXR0ZXJuLCB0YXJnZXQsIHJlTWltZVBhcnRTcGxpdCk7XG5cbiAgICAvLyBlbnN1cmUgdGhhdCB3ZSBoYXZlIGEgdmFsaWQgbWltZSB0eXBlIChzaG91bGQgaGF2ZSB0d28gcGFydHMpXG4gICAgcmV0dXJuIHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoID49IDI7XG4gIH1cblxuICByZXR1cm4gcGF0dGVybiA/IHRlc3QocGF0dGVybi5zcGxpdCgnOycpWzBdKSA6IHRlc3Q7XG59O1xuIiwiLyoqXG4qIENyZWF0ZSBhbiBldmVudCBlbWl0dGVyIHdpdGggbmFtZXNwYWNlc1xuKiBAbmFtZSBjcmVhdGVOYW1lc3BhY2VFbWl0dGVyXG4qIEBleGFtcGxlXG4qIHZhciBlbWl0dGVyID0gcmVxdWlyZSgnLi9pbmRleCcpKClcbipcbiogZW1pdHRlci5vbignKicsIGZ1bmN0aW9uICgpIHtcbiogICBjb25zb2xlLmxvZygnYWxsIGV2ZW50cyBlbWl0dGVkJywgdGhpcy5ldmVudClcbiogfSlcbipcbiogZW1pdHRlci5vbignZXhhbXBsZScsIGZ1bmN0aW9uICgpIHtcbiogICBjb25zb2xlLmxvZygnZXhhbXBsZSBldmVudCBlbWl0dGVkJylcbiogfSlcbiovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZU5hbWVzcGFjZUVtaXR0ZXIgKCkge1xuICB2YXIgZW1pdHRlciA9IHt9XG4gIHZhciBfZm5zID0gZW1pdHRlci5fZm5zID0ge31cblxuICAvKipcbiAgKiBFbWl0IGFuIGV2ZW50LiBPcHRpb25hbGx5IG5hbWVzcGFjZSB0aGUgZXZlbnQuIEhhbmRsZXJzIGFyZSBmaXJlZCBpbiB0aGUgb3JkZXIgaW4gd2hpY2ggdGhleSB3ZXJlIGFkZGVkIHdpdGggZXhhY3QgbWF0Y2hlcyB0YWtpbmcgcHJlY2VkZW5jZS4gU2VwYXJhdGUgdGhlIG5hbWVzcGFjZSBhbmQgZXZlbnQgd2l0aCBhIGA6YFxuICAqIEBuYW1lIGVtaXRcbiAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQg4oCTIHRoZSBuYW1lIG9mIHRoZSBldmVudCwgd2l0aCBvcHRpb25hbCBuYW1lc3BhY2VcbiAgKiBAcGFyYW0gey4uLip9IGRhdGEg4oCTIHVwIHRvIDYgYXJndW1lbnRzIHRoYXQgYXJlIHBhc3NlZCB0byB0aGUgZXZlbnQgbGlzdGVuZXJcbiAgKiBAZXhhbXBsZVxuICAqIGVtaXR0ZXIuZW1pdCgnZXhhbXBsZScpXG4gICogZW1pdHRlci5lbWl0KCdkZW1vOnRlc3QnKVxuICAqIGVtaXR0ZXIuZW1pdCgnZGF0YScsIHsgZXhhbXBsZTogdHJ1ZX0sICdhIHN0cmluZycsIDEpXG4gICovXG4gIGVtaXR0ZXIuZW1pdCA9IGZ1bmN0aW9uIGVtaXQgKGV2ZW50LCBhcmcxLCBhcmcyLCBhcmczLCBhcmc0LCBhcmc1LCBhcmc2KSB7XG4gICAgdmFyIHRvRW1pdCA9IGdldExpc3RlbmVycyhldmVudClcblxuICAgIGlmICh0b0VtaXQubGVuZ3RoKSB7XG4gICAgICBlbWl0QWxsKGV2ZW50LCB0b0VtaXQsIFthcmcxLCBhcmcyLCBhcmczLCBhcmc0LCBhcmc1LCBhcmc2XSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBDcmVhdGUgZW4gZXZlbnQgbGlzdGVuZXIuXG4gICogQG5hbWUgb25cbiAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAqIEBleGFtcGxlXG4gICogZW1pdHRlci5vbignZXhhbXBsZScsIGZ1bmN0aW9uICgpIHt9KVxuICAqIGVtaXR0ZXIub24oJ2RlbW8nLCBmdW5jdGlvbiAoKSB7fSlcbiAgKi9cbiAgZW1pdHRlci5vbiA9IGZ1bmN0aW9uIG9uIChldmVudCwgZm4pIHtcbiAgICBpZiAoIV9mbnNbZXZlbnRdKSB7XG4gICAgICBfZm5zW2V2ZW50XSA9IFtdXG4gICAgfVxuXG4gICAgX2Zuc1tldmVudF0ucHVzaChmbilcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZSBlbiBldmVudCBsaXN0ZW5lciB0aGF0IGZpcmVzIG9uY2UuXG4gICogQG5hbWUgb25jZVxuICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICogQGV4YW1wbGVcbiAgKiBlbWl0dGVyLm9uY2UoJ2V4YW1wbGUnLCBmdW5jdGlvbiAoKSB7fSlcbiAgKiBlbWl0dGVyLm9uY2UoJ2RlbW8nLCBmdW5jdGlvbiAoKSB7fSlcbiAgKi9cbiAgZW1pdHRlci5vbmNlID0gZnVuY3Rpb24gb25jZSAoZXZlbnQsIGZuKSB7XG4gICAgZnVuY3Rpb24gb25lICgpIHtcbiAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgIGVtaXR0ZXIub2ZmKGV2ZW50LCBvbmUpXG4gICAgfVxuICAgIHRoaXMub24oZXZlbnQsIG9uZSlcbiAgfVxuXG4gIC8qKlxuICAqIFN0b3AgbGlzdGVuaW5nIHRvIGFuIGV2ZW50LiBTdG9wIGFsbCBsaXN0ZW5lcnMgb24gYW4gZXZlbnQgYnkgb25seSBwYXNzaW5nIHRoZSBldmVudCBuYW1lLiBTdG9wIGEgc2luZ2xlIGxpc3RlbmVyIGJ5IHBhc3NpbmcgdGhhdCBldmVudCBoYW5kbGVyIGFzIGEgY2FsbGJhY2suXG4gICogWW91IG11c3QgYmUgZXhwbGljaXQgYWJvdXQgd2hhdCB3aWxsIGJlIHVuc3Vic2NyaWJlZDogYGVtaXR0ZXIub2ZmKCdkZW1vJylgIHdpbGwgdW5zdWJzY3JpYmUgYW4gYGVtaXR0ZXIub24oJ2RlbW8nKWAgbGlzdGVuZXIsXG4gICogYGVtaXR0ZXIub2ZmKCdkZW1vOmV4YW1wbGUnKWAgd2lsbCB1bnN1YnNjcmliZSBhbiBgZW1pdHRlci5vbignZGVtbzpleGFtcGxlJylgIGxpc3RlbmVyXG4gICogQG5hbWUgb2ZmXG4gICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZuXSDigJMgdGhlIHNwZWNpZmljIGhhbmRsZXJcbiAgKiBAZXhhbXBsZVxuICAqIGVtaXR0ZXIub2ZmKCdleGFtcGxlJylcbiAgKiBlbWl0dGVyLm9mZignZGVtbycsIGZ1bmN0aW9uICgpIHt9KVxuICAqL1xuICBlbWl0dGVyLm9mZiA9IGZ1bmN0aW9uIG9mZiAoZXZlbnQsIGZuKSB7XG4gICAgdmFyIGtlZXAgPSBbXVxuXG4gICAgaWYgKGV2ZW50ICYmIGZuKSB7XG4gICAgICB2YXIgZm5zID0gdGhpcy5fZm5zW2V2ZW50XVxuICAgICAgdmFyIGkgPSAwXG4gICAgICB2YXIgbCA9IGZucyA/IGZucy5sZW5ndGggOiAwXG5cbiAgICAgIGZvciAoaTsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAoZm5zW2ldICE9PSBmbikge1xuICAgICAgICAgIGtlZXAucHVzaChmbnNbaV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBrZWVwLmxlbmd0aCA/IHRoaXMuX2Zuc1tldmVudF0gPSBrZWVwIDogZGVsZXRlIHRoaXMuX2Zuc1tldmVudF1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldExpc3RlbmVycyAoZSkge1xuICAgIHZhciBvdXQgPSBfZm5zW2VdID8gX2Zuc1tlXSA6IFtdXG4gICAgdmFyIGlkeCA9IGUuaW5kZXhPZignOicpXG4gICAgdmFyIGFyZ3MgPSAoaWR4ID09PSAtMSkgPyBbZV0gOiBbZS5zdWJzdHJpbmcoMCwgaWR4KSwgZS5zdWJzdHJpbmcoaWR4ICsgMSldXG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKF9mbnMpXG4gICAgdmFyIGkgPSAwXG4gICAgdmFyIGwgPSBrZXlzLmxlbmd0aFxuXG4gICAgZm9yIChpOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXVxuICAgICAgaWYgKGtleSA9PT0gJyonKSB7XG4gICAgICAgIG91dCA9IG91dC5jb25jYXQoX2Zuc1trZXldKVxuICAgICAgfVxuXG4gICAgICBpZiAoYXJncy5sZW5ndGggPT09IDIgJiYgYXJnc1swXSA9PT0ga2V5KSB7XG4gICAgICAgIG91dCA9IG91dC5jb25jYXQoX2Zuc1trZXldKVxuICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvdXRcbiAgfVxuXG4gIGZ1bmN0aW9uIGVtaXRBbGwgKGUsIGZucywgYXJncykge1xuICAgIHZhciBpID0gMFxuICAgIHZhciBsID0gZm5zLmxlbmd0aFxuXG4gICAgZm9yIChpOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAoIWZuc1tpXSkgYnJlYWtcbiAgICAgIGZuc1tpXS5ldmVudCA9IGVcbiAgICAgIGZuc1tpXS5hcHBseShmbnNbaV0sIGFyZ3MpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVtaXR0ZXJcbn1cbiIsIiFmdW5jdGlvbigpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgZnVuY3Rpb24gaChub2RlTmFtZSwgYXR0cmlidXRlcykge1xuICAgICAgICB2YXIgbGFzdFNpbXBsZSwgY2hpbGQsIHNpbXBsZSwgaSwgY2hpbGRyZW4gPSBFTVBUWV9DSElMRFJFTjtcbiAgICAgICAgZm9yIChpID0gYXJndW1lbnRzLmxlbmd0aDsgaS0tID4gMjsgKSBzdGFjay5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzICYmIG51bGwgIT0gYXR0cmlidXRlcy5jaGlsZHJlbikge1xuICAgICAgICAgICAgaWYgKCFzdGFjay5sZW5ndGgpIHN0YWNrLnB1c2goYXR0cmlidXRlcy5jaGlsZHJlbik7XG4gICAgICAgICAgICBkZWxldGUgYXR0cmlidXRlcy5jaGlsZHJlbjtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSBpZiAoKGNoaWxkID0gc3RhY2sucG9wKCkpICYmIHZvaWQgMCAhPT0gY2hpbGQucG9wKSBmb3IgKGkgPSBjaGlsZC5sZW5ndGg7IGktLTsgKSBzdGFjay5wdXNoKGNoaWxkW2ldKTsgZWxzZSB7XG4gICAgICAgICAgICBpZiAoJ2Jvb2xlYW4nID09IHR5cGVvZiBjaGlsZCkgY2hpbGQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHNpbXBsZSA9ICdmdW5jdGlvbicgIT0gdHlwZW9mIG5vZGVOYW1lKSBpZiAobnVsbCA9PSBjaGlsZCkgY2hpbGQgPSAnJzsgZWxzZSBpZiAoJ251bWJlcicgPT0gdHlwZW9mIGNoaWxkKSBjaGlsZCA9IFN0cmluZyhjaGlsZCk7IGVsc2UgaWYgKCdzdHJpbmcnICE9IHR5cGVvZiBjaGlsZCkgc2ltcGxlID0gITE7XG4gICAgICAgICAgICBpZiAoc2ltcGxlICYmIGxhc3RTaW1wbGUpIGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdICs9IGNoaWxkOyBlbHNlIGlmIChjaGlsZHJlbiA9PT0gRU1QVFlfQ0hJTERSRU4pIGNoaWxkcmVuID0gWyBjaGlsZCBdOyBlbHNlIGNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgbGFzdFNpbXBsZSA9IHNpbXBsZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcCA9IG5ldyBWTm9kZSgpO1xuICAgICAgICBwLm5vZGVOYW1lID0gbm9kZU5hbWU7XG4gICAgICAgIHAuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICAgICAgcC5hdHRyaWJ1dGVzID0gbnVsbCA9PSBhdHRyaWJ1dGVzID8gdm9pZCAwIDogYXR0cmlidXRlcztcbiAgICAgICAgcC5rZXkgPSBudWxsID09IGF0dHJpYnV0ZXMgPyB2b2lkIDAgOiBhdHRyaWJ1dGVzLmtleTtcbiAgICAgICAgaWYgKHZvaWQgMCAhPT0gb3B0aW9ucy52bm9kZSkgb3B0aW9ucy52bm9kZShwKTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGV4dGVuZChvYmosIHByb3BzKSB7XG4gICAgICAgIGZvciAodmFyIGkgaW4gcHJvcHMpIG9ialtpXSA9IHByb3BzW2ldO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjbG9uZUVsZW1lbnQodm5vZGUsIHByb3BzKSB7XG4gICAgICAgIHJldHVybiBoKHZub2RlLm5vZGVOYW1lLCBleHRlbmQoZXh0ZW5kKHt9LCB2bm9kZS5hdHRyaWJ1dGVzKSwgcHJvcHMpLCBhcmd1bWVudHMubGVuZ3RoID4gMiA/IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSA6IHZub2RlLmNoaWxkcmVuKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZW5xdWV1ZVJlbmRlcihjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKCFjb21wb25lbnQuX19kICYmIChjb21wb25lbnQuX19kID0gITApICYmIDEgPT0gaXRlbXMucHVzaChjb21wb25lbnQpKSAob3B0aW9ucy5kZWJvdW5jZVJlbmRlcmluZyB8fCBkZWZlcikocmVyZW5kZXIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiByZXJlbmRlcigpIHtcbiAgICAgICAgdmFyIHAsIGxpc3QgPSBpdGVtcztcbiAgICAgICAgaXRlbXMgPSBbXTtcbiAgICAgICAgd2hpbGUgKHAgPSBsaXN0LnBvcCgpKSBpZiAocC5fX2QpIHJlbmRlckNvbXBvbmVudChwKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaXNTYW1lTm9kZVR5cGUobm9kZSwgdm5vZGUsIGh5ZHJhdGluZykge1xuICAgICAgICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHZub2RlIHx8ICdudW1iZXInID09IHR5cGVvZiB2bm9kZSkgcmV0dXJuIHZvaWQgMCAhPT0gbm9kZS5zcGxpdFRleHQ7XG4gICAgICAgIGlmICgnc3RyaW5nJyA9PSB0eXBlb2Ygdm5vZGUubm9kZU5hbWUpIHJldHVybiAhbm9kZS5fY29tcG9uZW50Q29uc3RydWN0b3IgJiYgaXNOYW1lZE5vZGUobm9kZSwgdm5vZGUubm9kZU5hbWUpOyBlbHNlIHJldHVybiBoeWRyYXRpbmcgfHwgbm9kZS5fY29tcG9uZW50Q29uc3RydWN0b3IgPT09IHZub2RlLm5vZGVOYW1lO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc05hbWVkTm9kZShub2RlLCBub2RlTmFtZSkge1xuICAgICAgICByZXR1cm4gbm9kZS5fX24gPT09IG5vZGVOYW1lIHx8IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0Tm9kZVByb3BzKHZub2RlKSB7XG4gICAgICAgIHZhciBwcm9wcyA9IGV4dGVuZCh7fSwgdm5vZGUuYXR0cmlidXRlcyk7XG4gICAgICAgIHByb3BzLmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gICAgICAgIHZhciBkZWZhdWx0UHJvcHMgPSB2bm9kZS5ub2RlTmFtZS5kZWZhdWx0UHJvcHM7XG4gICAgICAgIGlmICh2b2lkIDAgIT09IGRlZmF1bHRQcm9wcykgZm9yICh2YXIgaSBpbiBkZWZhdWx0UHJvcHMpIGlmICh2b2lkIDAgPT09IHByb3BzW2ldKSBwcm9wc1tpXSA9IGRlZmF1bHRQcm9wc1tpXTtcbiAgICAgICAgcmV0dXJuIHByb3BzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVOb2RlKG5vZGVOYW1lLCBpc1N2Zykge1xuICAgICAgICB2YXIgbm9kZSA9IGlzU3ZnID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5vZGVOYW1lKSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICBub2RlLl9fbiA9IG5vZGVOYW1lO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlTm9kZShub2RlKSB7XG4gICAgICAgIHZhciBwYXJlbnROb2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICBpZiAocGFyZW50Tm9kZSkgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2V0QWNjZXNzb3Iobm9kZSwgbmFtZSwgb2xkLCB2YWx1ZSwgaXNTdmcpIHtcbiAgICAgICAgaWYgKCdjbGFzc05hbWUnID09PSBuYW1lKSBuYW1lID0gJ2NsYXNzJztcbiAgICAgICAgaWYgKCdrZXknID09PSBuYW1lKSA7IGVsc2UgaWYgKCdyZWYnID09PSBuYW1lKSB7XG4gICAgICAgICAgICBpZiAob2xkKSBvbGQobnVsbCk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHZhbHVlKG5vZGUpO1xuICAgICAgICB9IGVsc2UgaWYgKCdjbGFzcycgPT09IG5hbWUgJiYgIWlzU3ZnKSBub2RlLmNsYXNzTmFtZSA9IHZhbHVlIHx8ICcnOyBlbHNlIGlmICgnc3R5bGUnID09PSBuYW1lKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlIHx8ICdzdHJpbmcnID09IHR5cGVvZiB2YWx1ZSB8fCAnc3RyaW5nJyA9PSB0eXBlb2Ygb2xkKSBub2RlLnN0eWxlLmNzc1RleHQgPSB2YWx1ZSB8fCAnJztcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiAnb2JqZWN0JyA9PSB0eXBlb2YgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoJ3N0cmluZycgIT0gdHlwZW9mIG9sZCkgZm9yICh2YXIgaSBpbiBvbGQpIGlmICghKGkgaW4gdmFsdWUpKSBub2RlLnN0eWxlW2ldID0gJyc7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiB2YWx1ZSkgbm9kZS5zdHlsZVtpXSA9ICdudW1iZXInID09IHR5cGVvZiB2YWx1ZVtpXSAmJiAhMSA9PT0gSVNfTk9OX0RJTUVOU0lPTkFMLnRlc3QoaSkgPyB2YWx1ZVtpXSArICdweCcgOiB2YWx1ZVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgnZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwnID09PSBuYW1lKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIG5vZGUuaW5uZXJIVE1MID0gdmFsdWUuX19odG1sIHx8ICcnO1xuICAgICAgICB9IGVsc2UgaWYgKCdvJyA9PSBuYW1lWzBdICYmICduJyA9PSBuYW1lWzFdKSB7XG4gICAgICAgICAgICB2YXIgdXNlQ2FwdHVyZSA9IG5hbWUgIT09IChuYW1lID0gbmFtZS5yZXBsYWNlKC9DYXB0dXJlJC8sICcnKSk7XG4gICAgICAgICAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZygyKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICghb2xkKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZXZlbnRQcm94eSwgdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICB9IGVsc2Ugbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGV2ZW50UHJveHksIHVzZUNhcHR1cmUpO1xuICAgICAgICAgICAgKG5vZGUuX19sIHx8IChub2RlLl9fbCA9IHt9KSlbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmICgnbGlzdCcgIT09IG5hbWUgJiYgJ3R5cGUnICE9PSBuYW1lICYmICFpc1N2ZyAmJiBuYW1lIGluIG5vZGUpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbm9kZVtuYW1lXSA9IG51bGwgPT0gdmFsdWUgPyAnJyA6IHZhbHVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgIGlmICgobnVsbCA9PSB2YWx1ZSB8fCAhMSA9PT0gdmFsdWUpICYmICdzcGVsbGNoZWNrJyAhPSBuYW1lKSBub2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBucyA9IGlzU3ZnICYmIG5hbWUgIT09IChuYW1lID0gbmFtZS5yZXBsYWNlKC9eeGxpbms6Py8sICcnKSk7XG4gICAgICAgICAgICBpZiAobnVsbCA9PSB2YWx1ZSB8fCAhMSA9PT0gdmFsdWUpIGlmIChucykgbm9kZS5yZW1vdmVBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsIG5hbWUudG9Mb3dlckNhc2UoKSk7IGVsc2Ugbm9kZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7IGVsc2UgaWYgKCdmdW5jdGlvbicgIT0gdHlwZW9mIHZhbHVlKSBpZiAobnMpIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBuYW1lLnRvTG93ZXJDYXNlKCksIHZhbHVlKTsgZWxzZSBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZXZlbnRQcm94eShlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fbFtlLnR5cGVdKG9wdGlvbnMuZXZlbnQgJiYgb3B0aW9ucy5ldmVudChlKSB8fCBlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZmx1c2hNb3VudHMoKSB7XG4gICAgICAgIHZhciBjO1xuICAgICAgICB3aGlsZSAoYyA9IG1vdW50cy5wb3AoKSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYWZ0ZXJNb3VudCkgb3B0aW9ucy5hZnRlck1vdW50KGMpO1xuICAgICAgICAgICAgaWYgKGMuY29tcG9uZW50RGlkTW91bnQpIGMuY29tcG9uZW50RGlkTW91bnQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBkaWZmKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsLCBwYXJlbnQsIGNvbXBvbmVudFJvb3QpIHtcbiAgICAgICAgaWYgKCFkaWZmTGV2ZWwrKykge1xuICAgICAgICAgICAgaXNTdmdNb2RlID0gbnVsbCAhPSBwYXJlbnQgJiYgdm9pZCAwICE9PSBwYXJlbnQub3duZXJTVkdFbGVtZW50O1xuICAgICAgICAgICAgaHlkcmF0aW5nID0gbnVsbCAhPSBkb20gJiYgISgnX19wcmVhY3RhdHRyXycgaW4gZG9tKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmV0ID0gaWRpZmYoZG9tLCB2bm9kZSwgY29udGV4dCwgbW91bnRBbGwsIGNvbXBvbmVudFJvb3QpO1xuICAgICAgICBpZiAocGFyZW50ICYmIHJldC5wYXJlbnROb2RlICE9PSBwYXJlbnQpIHBhcmVudC5hcHBlbmRDaGlsZChyZXQpO1xuICAgICAgICBpZiAoIS0tZGlmZkxldmVsKSB7XG4gICAgICAgICAgICBoeWRyYXRpbmcgPSAhMTtcbiAgICAgICAgICAgIGlmICghY29tcG9uZW50Um9vdCkgZmx1c2hNb3VudHMoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBpZGlmZihkb20sIHZub2RlLCBjb250ZXh0LCBtb3VudEFsbCwgY29tcG9uZW50Um9vdCkge1xuICAgICAgICB2YXIgb3V0ID0gZG9tLCBwcmV2U3ZnTW9kZSA9IGlzU3ZnTW9kZTtcbiAgICAgICAgaWYgKG51bGwgPT0gdm5vZGUgfHwgJ2Jvb2xlYW4nID09IHR5cGVvZiB2bm9kZSkgdm5vZGUgPSAnJztcbiAgICAgICAgaWYgKCdzdHJpbmcnID09IHR5cGVvZiB2bm9kZSB8fCAnbnVtYmVyJyA9PSB0eXBlb2Ygdm5vZGUpIHtcbiAgICAgICAgICAgIGlmIChkb20gJiYgdm9pZCAwICE9PSBkb20uc3BsaXRUZXh0ICYmIGRvbS5wYXJlbnROb2RlICYmICghZG9tLl9jb21wb25lbnQgfHwgY29tcG9uZW50Um9vdCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9tLm5vZGVWYWx1ZSAhPSB2bm9kZSkgZG9tLm5vZGVWYWx1ZSA9IHZub2RlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2bm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKGRvbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9tLnBhcmVudE5vZGUpIGRvbS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChvdXQsIGRvbSk7XG4gICAgICAgICAgICAgICAgICAgIHJlY29sbGVjdE5vZGVUcmVlKGRvbSwgITApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dC5fX3ByZWFjdGF0dHJfID0gITA7XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG4gICAgICAgIHZhciB2bm9kZU5hbWUgPSB2bm9kZS5ub2RlTmFtZTtcbiAgICAgICAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIHZub2RlTmFtZSkgcmV0dXJuIGJ1aWxkQ29tcG9uZW50RnJvbVZOb2RlKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsKTtcbiAgICAgICAgaXNTdmdNb2RlID0gJ3N2ZycgPT09IHZub2RlTmFtZSA/ICEwIDogJ2ZvcmVpZ25PYmplY3QnID09PSB2bm9kZU5hbWUgPyAhMSA6IGlzU3ZnTW9kZTtcbiAgICAgICAgdm5vZGVOYW1lID0gU3RyaW5nKHZub2RlTmFtZSk7XG4gICAgICAgIGlmICghZG9tIHx8ICFpc05hbWVkTm9kZShkb20sIHZub2RlTmFtZSkpIHtcbiAgICAgICAgICAgIG91dCA9IGNyZWF0ZU5vZGUodm5vZGVOYW1lLCBpc1N2Z01vZGUpO1xuICAgICAgICAgICAgaWYgKGRvbSkge1xuICAgICAgICAgICAgICAgIHdoaWxlIChkb20uZmlyc3RDaGlsZCkgb3V0LmFwcGVuZENoaWxkKGRvbS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9tLnBhcmVudE5vZGUpIGRvbS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChvdXQsIGRvbSk7XG4gICAgICAgICAgICAgICAgcmVjb2xsZWN0Tm9kZVRyZWUoZG9tLCAhMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZjID0gb3V0LmZpcnN0Q2hpbGQsIHByb3BzID0gb3V0Ll9fcHJlYWN0YXR0cl8sIHZjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuICAgICAgICBpZiAobnVsbCA9PSBwcm9wcykge1xuICAgICAgICAgICAgcHJvcHMgPSBvdXQuX19wcmVhY3RhdHRyXyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgYSA9IG91dC5hdHRyaWJ1dGVzLCBpID0gYS5sZW5ndGg7IGktLTsgKSBwcm9wc1thW2ldLm5hbWVdID0gYVtpXS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWh5ZHJhdGluZyAmJiB2Y2hpbGRyZW4gJiYgMSA9PT0gdmNoaWxkcmVuLmxlbmd0aCAmJiAnc3RyaW5nJyA9PSB0eXBlb2YgdmNoaWxkcmVuWzBdICYmIG51bGwgIT0gZmMgJiYgdm9pZCAwICE9PSBmYy5zcGxpdFRleHQgJiYgbnVsbCA9PSBmYy5uZXh0U2libGluZykge1xuICAgICAgICAgICAgaWYgKGZjLm5vZGVWYWx1ZSAhPSB2Y2hpbGRyZW5bMF0pIGZjLm5vZGVWYWx1ZSA9IHZjaGlsZHJlblswXTtcbiAgICAgICAgfSBlbHNlIGlmICh2Y2hpbGRyZW4gJiYgdmNoaWxkcmVuLmxlbmd0aCB8fCBudWxsICE9IGZjKSBpbm5lckRpZmZOb2RlKG91dCwgdmNoaWxkcmVuLCBjb250ZXh0LCBtb3VudEFsbCwgaHlkcmF0aW5nIHx8IG51bGwgIT0gcHJvcHMuZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwpO1xuICAgICAgICBkaWZmQXR0cmlidXRlcyhvdXQsIHZub2RlLmF0dHJpYnV0ZXMsIHByb3BzKTtcbiAgICAgICAgaXNTdmdNb2RlID0gcHJldlN2Z01vZGU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlubmVyRGlmZk5vZGUoZG9tLCB2Y2hpbGRyZW4sIGNvbnRleHQsIG1vdW50QWxsLCBpc0h5ZHJhdGluZykge1xuICAgICAgICB2YXIgaiwgYywgZiwgdmNoaWxkLCBjaGlsZCwgb3JpZ2luYWxDaGlsZHJlbiA9IGRvbS5jaGlsZE5vZGVzLCBjaGlsZHJlbiA9IFtdLCBrZXllZCA9IHt9LCBrZXllZExlbiA9IDAsIG1pbiA9IDAsIGxlbiA9IG9yaWdpbmFsQ2hpbGRyZW4ubGVuZ3RoLCBjaGlsZHJlbkxlbiA9IDAsIHZsZW4gPSB2Y2hpbGRyZW4gPyB2Y2hpbGRyZW4ubGVuZ3RoIDogMDtcbiAgICAgICAgaWYgKDAgIT09IGxlbikgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIF9jaGlsZCA9IG9yaWdpbmFsQ2hpbGRyZW5baV0sIHByb3BzID0gX2NoaWxkLl9fcHJlYWN0YXR0cl8sIGtleSA9IHZsZW4gJiYgcHJvcHMgPyBfY2hpbGQuX2NvbXBvbmVudCA/IF9jaGlsZC5fY29tcG9uZW50Ll9fayA6IHByb3BzLmtleSA6IG51bGw7XG4gICAgICAgICAgICBpZiAobnVsbCAhPSBrZXkpIHtcbiAgICAgICAgICAgICAgICBrZXllZExlbisrO1xuICAgICAgICAgICAgICAgIGtleWVkW2tleV0gPSBfY2hpbGQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BzIHx8ICh2b2lkIDAgIT09IF9jaGlsZC5zcGxpdFRleHQgPyBpc0h5ZHJhdGluZyA/IF9jaGlsZC5ub2RlVmFsdWUudHJpbSgpIDogITAgOiBpc0h5ZHJhdGluZykpIGNoaWxkcmVuW2NoaWxkcmVuTGVuKytdID0gX2NoaWxkO1xuICAgICAgICB9XG4gICAgICAgIGlmICgwICE9PSB2bGVuKSBmb3IgKHZhciBpID0gMDsgaSA8IHZsZW47IGkrKykge1xuICAgICAgICAgICAgdmNoaWxkID0gdmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgY2hpbGQgPSBudWxsO1xuICAgICAgICAgICAgdmFyIGtleSA9IHZjaGlsZC5rZXk7XG4gICAgICAgICAgICBpZiAobnVsbCAhPSBrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ZWRMZW4gJiYgdm9pZCAwICE9PSBrZXllZFtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkID0ga2V5ZWRba2V5XTtcbiAgICAgICAgICAgICAgICAgICAga2V5ZWRba2V5XSA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICAgICAga2V5ZWRMZW4tLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1pbiA8IGNoaWxkcmVuTGVuKSBmb3IgKGogPSBtaW47IGogPCBjaGlsZHJlbkxlbjsgaisrKSBpZiAodm9pZCAwICE9PSBjaGlsZHJlbltqXSAmJiBpc1NhbWVOb2RlVHlwZShjID0gY2hpbGRyZW5bal0sIHZjaGlsZCwgaXNIeWRyYXRpbmcpKSB7XG4gICAgICAgICAgICAgICAgY2hpbGQgPSBjO1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2pdID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgIGlmIChqID09PSBjaGlsZHJlbkxlbiAtIDEpIGNoaWxkcmVuTGVuLS07XG4gICAgICAgICAgICAgICAgaWYgKGogPT09IG1pbikgbWluKys7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGlsZCA9IGlkaWZmKGNoaWxkLCB2Y2hpbGQsIGNvbnRleHQsIG1vdW50QWxsKTtcbiAgICAgICAgICAgIGYgPSBvcmlnaW5hbENoaWxkcmVuW2ldO1xuICAgICAgICAgICAgaWYgKGNoaWxkICYmIGNoaWxkICE9PSBkb20gJiYgY2hpbGQgIT09IGYpIGlmIChudWxsID09IGYpIGRvbS5hcHBlbmRDaGlsZChjaGlsZCk7IGVsc2UgaWYgKGNoaWxkID09PSBmLm5leHRTaWJsaW5nKSByZW1vdmVOb2RlKGYpOyBlbHNlIGRvbS5pbnNlcnRCZWZvcmUoY2hpbGQsIGYpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChrZXllZExlbikgZm9yICh2YXIgaSBpbiBrZXllZCkgaWYgKHZvaWQgMCAhPT0ga2V5ZWRbaV0pIHJlY29sbGVjdE5vZGVUcmVlKGtleWVkW2ldLCAhMSk7XG4gICAgICAgIHdoaWxlIChtaW4gPD0gY2hpbGRyZW5MZW4pIGlmICh2b2lkIDAgIT09IChjaGlsZCA9IGNoaWxkcmVuW2NoaWxkcmVuTGVuLS1dKSkgcmVjb2xsZWN0Tm9kZVRyZWUoY2hpbGQsICExKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVjb2xsZWN0Tm9kZVRyZWUobm9kZSwgdW5tb3VudE9ubHkpIHtcbiAgICAgICAgdmFyIGNvbXBvbmVudCA9IG5vZGUuX2NvbXBvbmVudDtcbiAgICAgICAgaWYgKGNvbXBvbmVudCkgdW5tb3VudENvbXBvbmVudChjb21wb25lbnQpOyBlbHNlIHtcbiAgICAgICAgICAgIGlmIChudWxsICE9IG5vZGUuX19wcmVhY3RhdHRyXyAmJiBub2RlLl9fcHJlYWN0YXR0cl8ucmVmKSBub2RlLl9fcHJlYWN0YXR0cl8ucmVmKG51bGwpO1xuICAgICAgICAgICAgaWYgKCExID09PSB1bm1vdW50T25seSB8fCBudWxsID09IG5vZGUuX19wcmVhY3RhdHRyXykgcmVtb3ZlTm9kZShub2RlKTtcbiAgICAgICAgICAgIHJlbW92ZUNoaWxkcmVuKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZUNoaWxkcmVuKG5vZGUpIHtcbiAgICAgICAgbm9kZSA9IG5vZGUubGFzdENoaWxkO1xuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSBub2RlLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgIHJlY29sbGVjdE5vZGVUcmVlKG5vZGUsICEwKTtcbiAgICAgICAgICAgIG5vZGUgPSBuZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRpZmZBdHRyaWJ1dGVzKGRvbSwgYXR0cnMsIG9sZCkge1xuICAgICAgICB2YXIgbmFtZTtcbiAgICAgICAgZm9yIChuYW1lIGluIG9sZCkgaWYgKCghYXR0cnMgfHwgbnVsbCA9PSBhdHRyc1tuYW1lXSkgJiYgbnVsbCAhPSBvbGRbbmFtZV0pIHNldEFjY2Vzc29yKGRvbSwgbmFtZSwgb2xkW25hbWVdLCBvbGRbbmFtZV0gPSB2b2lkIDAsIGlzU3ZnTW9kZSk7XG4gICAgICAgIGZvciAobmFtZSBpbiBhdHRycykgaWYgKCEoJ2NoaWxkcmVuJyA9PT0gbmFtZSB8fCAnaW5uZXJIVE1MJyA9PT0gbmFtZSB8fCBuYW1lIGluIG9sZCAmJiBhdHRyc1tuYW1lXSA9PT0gKCd2YWx1ZScgPT09IG5hbWUgfHwgJ2NoZWNrZWQnID09PSBuYW1lID8gZG9tW25hbWVdIDogb2xkW25hbWVdKSkpIHNldEFjY2Vzc29yKGRvbSwgbmFtZSwgb2xkW25hbWVdLCBvbGRbbmFtZV0gPSBhdHRyc1tuYW1lXSwgaXNTdmdNb2RlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY3JlYXRlQ29tcG9uZW50KEN0b3IsIHByb3BzLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBpbnN0LCBpID0gcmVjeWNsZXJDb21wb25lbnRzLmxlbmd0aDtcbiAgICAgICAgaWYgKEN0b3IucHJvdG90eXBlICYmIEN0b3IucHJvdG90eXBlLnJlbmRlcikge1xuICAgICAgICAgICAgaW5zdCA9IG5ldyBDdG9yKHByb3BzLCBjb250ZXh0KTtcbiAgICAgICAgICAgIENvbXBvbmVudC5jYWxsKGluc3QsIHByb3BzLCBjb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluc3QgPSBuZXcgQ29tcG9uZW50KHByb3BzLCBjb250ZXh0KTtcbiAgICAgICAgICAgIGluc3QuY29uc3RydWN0b3IgPSBDdG9yO1xuICAgICAgICAgICAgaW5zdC5yZW5kZXIgPSBkb1JlbmRlcjtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoaS0tKSBpZiAocmVjeWNsZXJDb21wb25lbnRzW2ldLmNvbnN0cnVjdG9yID09PSBDdG9yKSB7XG4gICAgICAgICAgICBpbnN0Ll9fYiA9IHJlY3ljbGVyQ29tcG9uZW50c1tpXS5fX2I7XG4gICAgICAgICAgICByZWN5Y2xlckNvbXBvbmVudHMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcmV0dXJuIGluc3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3Q7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRvUmVuZGVyKHByb3BzLCBzdGF0ZSwgY29udGV4dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvcihwcm9wcywgY29udGV4dCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNldENvbXBvbmVudFByb3BzKGNvbXBvbmVudCwgcHJvcHMsIHJlbmRlck1vZGUsIGNvbnRleHQsIG1vdW50QWxsKSB7XG4gICAgICAgIGlmICghY29tcG9uZW50Ll9feCkge1xuICAgICAgICAgICAgY29tcG9uZW50Ll9feCA9ICEwO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9fciA9IHByb3BzLnJlZjtcbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2sgPSBwcm9wcy5rZXk7XG4gICAgICAgICAgICBkZWxldGUgcHJvcHMucmVmO1xuICAgICAgICAgICAgZGVsZXRlIHByb3BzLmtleTtcbiAgICAgICAgICAgIGlmICh2b2lkIDAgPT09IGNvbXBvbmVudC5jb25zdHJ1Y3Rvci5nZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMpIGlmICghY29tcG9uZW50LmJhc2UgfHwgbW91bnRBbGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50LmNvbXBvbmVudFdpbGxNb3VudCkgY29tcG9uZW50LmNvbXBvbmVudFdpbGxNb3VudCgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb21wb25lbnQuY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcykgY29tcG9uZW50LmNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMocHJvcHMsIGNvbnRleHQpO1xuICAgICAgICAgICAgaWYgKGNvbnRleHQgJiYgY29udGV4dCAhPT0gY29tcG9uZW50LmNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXBvbmVudC5fX2MpIGNvbXBvbmVudC5fX2MgPSBjb21wb25lbnQuY29udGV4dDtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWNvbXBvbmVudC5fX3ApIGNvbXBvbmVudC5fX3AgPSBjb21wb25lbnQucHJvcHM7XG4gICAgICAgICAgICBjb21wb25lbnQucHJvcHMgPSBwcm9wcztcbiAgICAgICAgICAgIGNvbXBvbmVudC5fX3ggPSAhMTtcbiAgICAgICAgICAgIGlmICgwICE9PSByZW5kZXJNb2RlKSBpZiAoMSA9PT0gcmVuZGVyTW9kZSB8fCAhMSAhPT0gb3B0aW9ucy5zeW5jQ29tcG9uZW50VXBkYXRlcyB8fCAhY29tcG9uZW50LmJhc2UpIHJlbmRlckNvbXBvbmVudChjb21wb25lbnQsIDEsIG1vdW50QWxsKTsgZWxzZSBlbnF1ZXVlUmVuZGVyKGNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fcikgY29tcG9uZW50Ll9fcihjb21wb25lbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudChjb21wb25lbnQsIHJlbmRlck1vZGUsIG1vdW50QWxsLCBpc0NoaWxkKSB7XG4gICAgICAgIGlmICghY29tcG9uZW50Ll9feCkge1xuICAgICAgICAgICAgdmFyIHJlbmRlcmVkLCBpbnN0LCBjYmFzZSwgcHJvcHMgPSBjb21wb25lbnQucHJvcHMsIHN0YXRlID0gY29tcG9uZW50LnN0YXRlLCBjb250ZXh0ID0gY29tcG9uZW50LmNvbnRleHQsIHByZXZpb3VzUHJvcHMgPSBjb21wb25lbnQuX19wIHx8IHByb3BzLCBwcmV2aW91c1N0YXRlID0gY29tcG9uZW50Ll9fcyB8fCBzdGF0ZSwgcHJldmlvdXNDb250ZXh0ID0gY29tcG9uZW50Ll9fYyB8fCBjb250ZXh0LCBpc1VwZGF0ZSA9IGNvbXBvbmVudC5iYXNlLCBuZXh0QmFzZSA9IGNvbXBvbmVudC5fX2IsIGluaXRpYWxCYXNlID0gaXNVcGRhdGUgfHwgbmV4dEJhc2UsIGluaXRpYWxDaGlsZENvbXBvbmVudCA9IGNvbXBvbmVudC5fY29tcG9uZW50LCBza2lwID0gITEsIHNuYXBzaG90ID0gcHJldmlvdXNDb250ZXh0O1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5jb25zdHJ1Y3Rvci5nZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IGV4dGVuZChleHRlbmQoe30sIHN0YXRlKSwgY29tcG9uZW50LmNvbnN0cnVjdG9yLmdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyhwcm9wcywgc3RhdGUpKTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1VwZGF0ZSkge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHByZXZpb3VzUHJvcHM7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnN0YXRlID0gcHJldmlvdXNTdGF0ZTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuY29udGV4dCA9IHByZXZpb3VzQ29udGV4dDtcbiAgICAgICAgICAgICAgICBpZiAoMiAhPT0gcmVuZGVyTW9kZSAmJiBjb21wb25lbnQuc2hvdWxkQ29tcG9uZW50VXBkYXRlICYmICExID09PSBjb21wb25lbnQuc2hvdWxkQ29tcG9uZW50VXBkYXRlKHByb3BzLCBzdGF0ZSwgY29udGV4dCkpIHNraXAgPSAhMDsgZWxzZSBpZiAoY29tcG9uZW50LmNvbXBvbmVudFdpbGxVcGRhdGUpIGNvbXBvbmVudC5jb21wb25lbnRXaWxsVXBkYXRlKHByb3BzLCBzdGF0ZSwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnByb3BzID0gcHJvcHM7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnN0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50LmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29tcG9uZW50Ll9fcCA9IGNvbXBvbmVudC5fX3MgPSBjb21wb25lbnQuX19jID0gY29tcG9uZW50Ll9fYiA9IG51bGw7XG4gICAgICAgICAgICBjb21wb25lbnQuX19kID0gITE7XG4gICAgICAgICAgICBpZiAoIXNraXApIHtcbiAgICAgICAgICAgICAgICByZW5kZXJlZCA9IGNvbXBvbmVudC5yZW5kZXIocHJvcHMsIHN0YXRlLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50LmdldENoaWxkQ29udGV4dCkgY29udGV4dCA9IGV4dGVuZChleHRlbmQoe30sIGNvbnRleHQpLCBjb21wb25lbnQuZ2V0Q2hpbGRDb250ZXh0KCkpO1xuICAgICAgICAgICAgICAgIGlmIChpc1VwZGF0ZSAmJiBjb21wb25lbnQuZ2V0U25hcHNob3RCZWZvcmVVcGRhdGUpIHNuYXBzaG90ID0gY29tcG9uZW50LmdldFNuYXBzaG90QmVmb3JlVXBkYXRlKHByZXZpb3VzUHJvcHMsIHByZXZpb3VzU3RhdGUpO1xuICAgICAgICAgICAgICAgIHZhciB0b1VubW91bnQsIGJhc2UsIGNoaWxkQ29tcG9uZW50ID0gcmVuZGVyZWQgJiYgcmVuZGVyZWQubm9kZU5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGNoaWxkQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZFByb3BzID0gZ2V0Tm9kZVByb3BzKHJlbmRlcmVkKTtcbiAgICAgICAgICAgICAgICAgICAgaW5zdCA9IGluaXRpYWxDaGlsZENvbXBvbmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluc3QgJiYgaW5zdC5jb25zdHJ1Y3RvciA9PT0gY2hpbGRDb21wb25lbnQgJiYgY2hpbGRQcm9wcy5rZXkgPT0gaW5zdC5fX2spIHNldENvbXBvbmVudFByb3BzKGluc3QsIGNoaWxkUHJvcHMsIDEsIGNvbnRleHQsICExKTsgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b1VubW91bnQgPSBpbnN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50Ll9jb21wb25lbnQgPSBpbnN0ID0gY3JlYXRlQ29tcG9uZW50KGNoaWxkQ29tcG9uZW50LCBjaGlsZFByb3BzLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc3QuX19iID0gaW5zdC5fX2IgfHwgbmV4dEJhc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0Ll9fdSA9IGNvbXBvbmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldENvbXBvbmVudFByb3BzKGluc3QsIGNoaWxkUHJvcHMsIDAsIGNvbnRleHQsICExKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlckNvbXBvbmVudChpbnN0LCAxLCBtb3VudEFsbCwgITApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhc2UgPSBpbnN0LmJhc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2Jhc2UgPSBpbml0aWFsQmFzZTtcbiAgICAgICAgICAgICAgICAgICAgdG9Vbm1vdW50ID0gaW5pdGlhbENoaWxkQ29tcG9uZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAodG9Vbm1vdW50KSBjYmFzZSA9IGNvbXBvbmVudC5fY29tcG9uZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluaXRpYWxCYXNlIHx8IDEgPT09IHJlbmRlck1vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYmFzZSkgY2Jhc2UuX2NvbXBvbmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlID0gZGlmZihjYmFzZSwgcmVuZGVyZWQsIGNvbnRleHQsIG1vdW50QWxsIHx8ICFpc1VwZGF0ZSwgaW5pdGlhbEJhc2UgJiYgaW5pdGlhbEJhc2UucGFyZW50Tm9kZSwgITApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbml0aWFsQmFzZSAmJiBiYXNlICE9PSBpbml0aWFsQmFzZSAmJiBpbnN0ICE9PSBpbml0aWFsQ2hpbGRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhc2VQYXJlbnQgPSBpbml0aWFsQmFzZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYmFzZVBhcmVudCAmJiBiYXNlICE9PSBiYXNlUGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlUGFyZW50LnJlcGxhY2VDaGlsZChiYXNlLCBpbml0aWFsQmFzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRvVW5tb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxCYXNlLl9jb21wb25lbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY29sbGVjdE5vZGVUcmVlKGluaXRpYWxCYXNlLCAhMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRvVW5tb3VudCkgdW5tb3VudENvbXBvbmVudCh0b1VubW91bnQpO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5iYXNlID0gYmFzZTtcbiAgICAgICAgICAgICAgICBpZiAoYmFzZSAmJiAhaXNDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50UmVmID0gY29tcG9uZW50LCB0ID0gY29tcG9uZW50O1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodCA9IHQuX191KSAoY29tcG9uZW50UmVmID0gdCkuYmFzZSA9IGJhc2U7XG4gICAgICAgICAgICAgICAgICAgIGJhc2UuX2NvbXBvbmVudCA9IGNvbXBvbmVudFJlZjtcbiAgICAgICAgICAgICAgICAgICAgYmFzZS5fY29tcG9uZW50Q29uc3RydWN0b3IgPSBjb21wb25lbnRSZWYuY29uc3RydWN0b3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc1VwZGF0ZSB8fCBtb3VudEFsbCkgbW91bnRzLnVuc2hpZnQoY29tcG9uZW50KTsgZWxzZSBpZiAoIXNraXApIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50LmNvbXBvbmVudERpZFVwZGF0ZSkgY29tcG9uZW50LmNvbXBvbmVudERpZFVwZGF0ZShwcmV2aW91c1Byb3BzLCBwcmV2aW91c1N0YXRlLCBzbmFwc2hvdCk7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYWZ0ZXJVcGRhdGUpIG9wdGlvbnMuYWZ0ZXJVcGRhdGUoY29tcG9uZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChjb21wb25lbnQuX19oLmxlbmd0aCkgY29tcG9uZW50Ll9faC5wb3AoKS5jYWxsKGNvbXBvbmVudCk7XG4gICAgICAgICAgICBpZiAoIWRpZmZMZXZlbCAmJiAhaXNDaGlsZCkgZmx1c2hNb3VudHMoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBidWlsZENvbXBvbmVudEZyb21WTm9kZShkb20sIHZub2RlLCBjb250ZXh0LCBtb3VudEFsbCkge1xuICAgICAgICB2YXIgYyA9IGRvbSAmJiBkb20uX2NvbXBvbmVudCwgb3JpZ2luYWxDb21wb25lbnQgPSBjLCBvbGREb20gPSBkb20sIGlzRGlyZWN0T3duZXIgPSBjICYmIGRvbS5fY29tcG9uZW50Q29uc3RydWN0b3IgPT09IHZub2RlLm5vZGVOYW1lLCBpc093bmVyID0gaXNEaXJlY3RPd25lciwgcHJvcHMgPSBnZXROb2RlUHJvcHModm5vZGUpO1xuICAgICAgICB3aGlsZSAoYyAmJiAhaXNPd25lciAmJiAoYyA9IGMuX191KSkgaXNPd25lciA9IGMuY29uc3RydWN0b3IgPT09IHZub2RlLm5vZGVOYW1lO1xuICAgICAgICBpZiAoYyAmJiBpc093bmVyICYmICghbW91bnRBbGwgfHwgYy5fY29tcG9uZW50KSkge1xuICAgICAgICAgICAgc2V0Q29tcG9uZW50UHJvcHMoYywgcHJvcHMsIDMsIGNvbnRleHQsIG1vdW50QWxsKTtcbiAgICAgICAgICAgIGRvbSA9IGMuYmFzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvcmlnaW5hbENvbXBvbmVudCAmJiAhaXNEaXJlY3RPd25lcikge1xuICAgICAgICAgICAgICAgIHVubW91bnRDb21wb25lbnQob3JpZ2luYWxDb21wb25lbnQpO1xuICAgICAgICAgICAgICAgIGRvbSA9IG9sZERvbSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjID0gY3JlYXRlQ29tcG9uZW50KHZub2RlLm5vZGVOYW1lLCBwcm9wcywgY29udGV4dCk7XG4gICAgICAgICAgICBpZiAoZG9tICYmICFjLl9fYikge1xuICAgICAgICAgICAgICAgIGMuX19iID0gZG9tO1xuICAgICAgICAgICAgICAgIG9sZERvbSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRDb21wb25lbnRQcm9wcyhjLCBwcm9wcywgMSwgY29udGV4dCwgbW91bnRBbGwpO1xuICAgICAgICAgICAgZG9tID0gYy5iYXNlO1xuICAgICAgICAgICAgaWYgKG9sZERvbSAmJiBkb20gIT09IG9sZERvbSkge1xuICAgICAgICAgICAgICAgIG9sZERvbS5fY29tcG9uZW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZWNvbGxlY3ROb2RlVHJlZShvbGREb20sICExKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZG9tO1xuICAgIH1cbiAgICBmdW5jdGlvbiB1bm1vdW50Q29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgICAgICBpZiAob3B0aW9ucy5iZWZvcmVVbm1vdW50KSBvcHRpb25zLmJlZm9yZVVubW91bnQoY29tcG9uZW50KTtcbiAgICAgICAgdmFyIGJhc2UgPSBjb21wb25lbnQuYmFzZTtcbiAgICAgICAgY29tcG9uZW50Ll9feCA9ICEwO1xuICAgICAgICBpZiAoY29tcG9uZW50LmNvbXBvbmVudFdpbGxVbm1vdW50KSBjb21wb25lbnQuY29tcG9uZW50V2lsbFVubW91bnQoKTtcbiAgICAgICAgY29tcG9uZW50LmJhc2UgPSBudWxsO1xuICAgICAgICB2YXIgaW5uZXIgPSBjb21wb25lbnQuX2NvbXBvbmVudDtcbiAgICAgICAgaWYgKGlubmVyKSB1bm1vdW50Q29tcG9uZW50KGlubmVyKTsgZWxzZSBpZiAoYmFzZSkge1xuICAgICAgICAgICAgaWYgKGJhc2UuX19wcmVhY3RhdHRyXyAmJiBiYXNlLl9fcHJlYWN0YXR0cl8ucmVmKSBiYXNlLl9fcHJlYWN0YXR0cl8ucmVmKG51bGwpO1xuICAgICAgICAgICAgY29tcG9uZW50Ll9fYiA9IGJhc2U7XG4gICAgICAgICAgICByZW1vdmVOb2RlKGJhc2UpO1xuICAgICAgICAgICAgcmVjeWNsZXJDb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgICAgIHJlbW92ZUNoaWxkcmVuKGJhc2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb21wb25lbnQuX19yKSBjb21wb25lbnQuX19yKG51bGwpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBDb21wb25lbnQocHJvcHMsIGNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5fX2QgPSAhMDtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5wcm9wcyA9IHByb3BzO1xuICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5zdGF0ZSB8fCB7fTtcbiAgICAgICAgdGhpcy5fX2ggPSBbXTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVuZGVyKHZub2RlLCBwYXJlbnQsIG1lcmdlKSB7XG4gICAgICAgIHJldHVybiBkaWZmKG1lcmdlLCB2bm9kZSwge30sICExLCBwYXJlbnQsICExKTtcbiAgICB9XG4gICAgdmFyIFZOb2RlID0gZnVuY3Rpb24oKSB7fTtcbiAgICB2YXIgb3B0aW9ucyA9IHt9O1xuICAgIHZhciBzdGFjayA9IFtdO1xuICAgIHZhciBFTVBUWV9DSElMRFJFTiA9IFtdO1xuICAgIHZhciBkZWZlciA9ICdmdW5jdGlvbicgPT0gdHlwZW9mIFByb21pc2UgPyBQcm9taXNlLnJlc29sdmUoKS50aGVuLmJpbmQoUHJvbWlzZS5yZXNvbHZlKCkpIDogc2V0VGltZW91dDtcbiAgICB2YXIgSVNfTk9OX0RJTUVOU0lPTkFMID0gL2FjaXR8ZXgoPzpzfGd8bnxwfCQpfHJwaHxvd3N8bW5jfG50d3xpbmVbY2hdfHpvb3xeb3JkL2k7XG4gICAgdmFyIGl0ZW1zID0gW107XG4gICAgdmFyIG1vdW50cyA9IFtdO1xuICAgIHZhciBkaWZmTGV2ZWwgPSAwO1xuICAgIHZhciBpc1N2Z01vZGUgPSAhMTtcbiAgICB2YXIgaHlkcmF0aW5nID0gITE7XG4gICAgdmFyIHJlY3ljbGVyQ29tcG9uZW50cyA9IFtdO1xuICAgIGV4dGVuZChDb21wb25lbnQucHJvdG90eXBlLCB7XG4gICAgICAgIHNldFN0YXRlOiBmdW5jdGlvbihzdGF0ZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fX3MpIHRoaXMuX19zID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBleHRlbmQoZXh0ZW5kKHt9LCB0aGlzLnN0YXRlKSwgJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygc3RhdGUgPyBzdGF0ZSh0aGlzLnN0YXRlLCB0aGlzLnByb3BzKSA6IHN0YXRlKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgdGhpcy5fX2gucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICBlbnF1ZXVlUmVuZGVyKHRoaXMpO1xuICAgICAgICB9LFxuICAgICAgICBmb3JjZVVwZGF0ZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgdGhpcy5fX2gucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICByZW5kZXJDb21wb25lbnQodGhpcywgMik7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7fVxuICAgIH0pO1xuICAgIHZhciBwcmVhY3QgPSB7XG4gICAgICAgIGg6IGgsXG4gICAgICAgIGNyZWF0ZUVsZW1lbnQ6IGgsXG4gICAgICAgIGNsb25lRWxlbWVudDogY2xvbmVFbGVtZW50LFxuICAgICAgICBDb21wb25lbnQ6IENvbXBvbmVudCxcbiAgICAgICAgcmVuZGVyOiByZW5kZXIsXG4gICAgICAgIHJlcmVuZGVyOiByZXJlbmRlcixcbiAgICAgICAgb3B0aW9uczogb3B0aW9uc1xuICAgIH07XG4gICAgaWYgKCd1bmRlZmluZWQnICE9IHR5cGVvZiBtb2R1bGUpIG1vZHVsZS5leHBvcnRzID0gcHJlYWN0OyBlbHNlIHNlbGYucHJlYWN0ID0gcHJlYWN0O1xufSgpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJlYWN0LmpzLm1hcCIsIm1vZHVsZS5leHBvcnRzID0gcHJldHRpZXJCeXRlc1xuXG5mdW5jdGlvbiBwcmV0dGllckJ5dGVzIChudW0pIHtcbiAgaWYgKHR5cGVvZiBudW0gIT09ICdudW1iZXInIHx8IGlzTmFOKG51bSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBhIG51bWJlciwgZ290ICcgKyB0eXBlb2YgbnVtKVxuICB9XG5cbiAgdmFyIG5lZyA9IG51bSA8IDBcbiAgdmFyIHVuaXRzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJywgJ1BCJywgJ0VCJywgJ1pCJywgJ1lCJ11cblxuICBpZiAobmVnKSB7XG4gICAgbnVtID0gLW51bVxuICB9XG5cbiAgaWYgKG51bSA8IDEpIHtcbiAgICByZXR1cm4gKG5lZyA/ICctJyA6ICcnKSArIG51bSArICcgQidcbiAgfVxuXG4gIHZhciBleHBvbmVudCA9IE1hdGgubWluKE1hdGguZmxvb3IoTWF0aC5sb2cobnVtKSAvIE1hdGgubG9nKDEwMDApKSwgdW5pdHMubGVuZ3RoIC0gMSlcbiAgbnVtID0gTnVtYmVyKG51bSAvIE1hdGgucG93KDEwMDAsIGV4cG9uZW50KSlcbiAgdmFyIHVuaXQgPSB1bml0c1tleHBvbmVudF1cblxuICBpZiAobnVtID49IDEwIHx8IG51bSAlIDEgPT09IDApIHtcbiAgICAvLyBEbyBub3Qgc2hvdyBkZWNpbWFscyB3aGVuIHRoZSBudW1iZXIgaXMgdHdvLWRpZ2l0LCBvciBpZiB0aGUgbnVtYmVyIGhhcyBub1xuICAgIC8vIGRlY2ltYWwgY29tcG9uZW50LlxuICAgIHJldHVybiAobmVnID8gJy0nIDogJycpICsgbnVtLnRvRml4ZWQoMCkgKyAnICcgKyB1bml0XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIChuZWcgPyAnLScgOiAnJykgKyBudW0udG9GaXhlZCgxKSArICcgJyArIHVuaXRcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIHVuZGVmO1xuXG4vKipcbiAqIERlY29kZSBhIFVSSSBlbmNvZGVkIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIFVSSSBlbmNvZGVkIHN0cmluZy5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBkZWNvZGVkIHN0cmluZy5cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBkZWNvZGUoaW5wdXQpIHtcbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChpbnB1dC5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG59XG5cbi8qKlxuICogU2ltcGxlIHF1ZXJ5IHN0cmluZyBwYXJzZXIuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHF1ZXJ5IFRoZSBxdWVyeSBzdHJpbmcgdGhhdCBuZWVkcyB0byBiZSBwYXJzZWQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gcXVlcnlzdHJpbmcocXVlcnkpIHtcbiAgdmFyIHBhcnNlciA9IC8oW149PyZdKyk9PyhbXiZdKikvZ1xuICAgICwgcmVzdWx0ID0ge31cbiAgICAsIHBhcnQ7XG5cbiAgd2hpbGUgKHBhcnQgPSBwYXJzZXIuZXhlYyhxdWVyeSkpIHtcbiAgICB2YXIga2V5ID0gZGVjb2RlKHBhcnRbMV0pXG4gICAgICAsIHZhbHVlID0gZGVjb2RlKHBhcnRbMl0pO1xuXG4gICAgLy9cbiAgICAvLyBQcmV2ZW50IG92ZXJyaWRpbmcgb2YgZXhpc3RpbmcgcHJvcGVydGllcy4gVGhpcyBlbnN1cmVzIHRoYXQgYnVpbGQtaW5cbiAgICAvLyBtZXRob2RzIGxpa2UgYHRvU3RyaW5nYCBvciBfX3Byb3RvX18gYXJlIG5vdCBvdmVycmlkZW4gYnkgbWFsaWNpb3VzXG4gICAgLy8gcXVlcnlzdHJpbmdzLlxuICAgIC8vXG4gICAgaWYgKGtleSBpbiByZXN1bHQpIGNvbnRpbnVlO1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhIHF1ZXJ5IHN0cmluZyB0byBhbiBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBPYmplY3QgdGhhdCBzaG91bGQgYmUgdHJhbnNmb3JtZWQuXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJlZml4IE9wdGlvbmFsIHByZWZpeC5cbiAqIEByZXR1cm5zIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBxdWVyeXN0cmluZ2lmeShvYmosIHByZWZpeCkge1xuICBwcmVmaXggPSBwcmVmaXggfHwgJyc7XG5cbiAgdmFyIHBhaXJzID0gW11cbiAgICAsIHZhbHVlXG4gICAgLCBrZXk7XG5cbiAgLy9cbiAgLy8gT3B0aW9uYWxseSBwcmVmaXggd2l0aCBhICc/JyBpZiBuZWVkZWRcbiAgLy9cbiAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgcHJlZml4KSBwcmVmaXggPSAnPyc7XG5cbiAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgdmFsdWUgPSBvYmpba2V5XTtcblxuICAgICAgLy9cbiAgICAgIC8vIEVkZ2UgY2FzZXMgd2hlcmUgd2UgYWN0dWFsbHkgd2FudCB0byBlbmNvZGUgdGhlIHZhbHVlIHRvIGFuIGVtcHR5XG4gICAgICAvLyBzdHJpbmcgaW5zdGVhZCBvZiB0aGUgc3RyaW5naWZpZWQgdmFsdWUuXG4gICAgICAvL1xuICAgICAgaWYgKCF2YWx1ZSAmJiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmIHx8IGlzTmFOKHZhbHVlKSkpIHtcbiAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgIH1cblxuICAgICAgcGFpcnMucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArJz0nKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFpcnMubGVuZ3RoID8gcHJlZml4ICsgcGFpcnMuam9pbignJicpIDogJyc7XG59XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5leHBvcnRzLnN0cmluZ2lmeSA9IHF1ZXJ5c3RyaW5naWZ5O1xuZXhwb3J0cy5wYXJzZSA9IHF1ZXJ5c3RyaW5nO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENoZWNrIGlmIHdlJ3JlIHJlcXVpcmVkIHRvIGFkZCBhIHBvcnQgbnVtYmVyLlxuICpcbiAqIEBzZWUgaHR0cHM6Ly91cmwuc3BlYy53aGF0d2cub3JnLyNkZWZhdWx0LXBvcnRcbiAqIEBwYXJhbSB7TnVtYmVyfFN0cmluZ30gcG9ydCBQb3J0IG51bWJlciB3ZSBuZWVkIHRvIGNoZWNrXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2wgUHJvdG9jb2wgd2UgbmVlZCB0byBjaGVjayBhZ2FpbnN0LlxuICogQHJldHVybnMge0Jvb2xlYW59IElzIGl0IGEgZGVmYXVsdCBwb3J0IGZvciB0aGUgZ2l2ZW4gcHJvdG9jb2xcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlcXVpcmVkKHBvcnQsIHByb3RvY29sKSB7XG4gIHByb3RvY29sID0gcHJvdG9jb2wuc3BsaXQoJzonKVswXTtcbiAgcG9ydCA9ICtwb3J0O1xuXG4gIGlmICghcG9ydCkgcmV0dXJuIGZhbHNlO1xuXG4gIHN3aXRjaCAocHJvdG9jb2wpIHtcbiAgICBjYXNlICdodHRwJzpcbiAgICBjYXNlICd3cyc6XG4gICAgcmV0dXJuIHBvcnQgIT09IDgwO1xuXG4gICAgY2FzZSAnaHR0cHMnOlxuICAgIGNhc2UgJ3dzcyc6XG4gICAgcmV0dXJuIHBvcnQgIT09IDQ0MztcblxuICAgIGNhc2UgJ2Z0cCc6XG4gICAgcmV0dXJuIHBvcnQgIT09IDIxO1xuXG4gICAgY2FzZSAnZ29waGVyJzpcbiAgICByZXR1cm4gcG9ydCAhPT0gNzA7XG5cbiAgICBjYXNlICdmaWxlJzpcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gcG9ydCAhPT0gMDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJ1blBhcmFsbGVsXG5cbmZ1bmN0aW9uIHJ1blBhcmFsbGVsICh0YXNrcywgY2IpIHtcbiAgdmFyIHJlc3VsdHMsIHBlbmRpbmcsIGtleXNcbiAgdmFyIGlzU3luYyA9IHRydWVcblxuICBpZiAoQXJyYXkuaXNBcnJheSh0YXNrcykpIHtcbiAgICByZXN1bHRzID0gW11cbiAgICBwZW5kaW5nID0gdGFza3MubGVuZ3RoXG4gIH0gZWxzZSB7XG4gICAga2V5cyA9IE9iamVjdC5rZXlzKHRhc2tzKVxuICAgIHJlc3VsdHMgPSB7fVxuICAgIHBlbmRpbmcgPSBrZXlzLmxlbmd0aFxuICB9XG5cbiAgZnVuY3Rpb24gZG9uZSAoZXJyKSB7XG4gICAgZnVuY3Rpb24gZW5kICgpIHtcbiAgICAgIGlmIChjYikgY2IoZXJyLCByZXN1bHRzKVxuICAgICAgY2IgPSBudWxsXG4gICAgfVxuICAgIGlmIChpc1N5bmMpIHByb2Nlc3MubmV4dFRpY2soZW5kKVxuICAgIGVsc2UgZW5kKClcbiAgfVxuXG4gIGZ1bmN0aW9uIGVhY2ggKGksIGVyciwgcmVzdWx0KSB7XG4gICAgcmVzdWx0c1tpXSA9IHJlc3VsdFxuICAgIGlmICgtLXBlbmRpbmcgPT09IDAgfHwgZXJyKSB7XG4gICAgICBkb25lKGVycilcbiAgICB9XG4gIH1cblxuICBpZiAoIXBlbmRpbmcpIHtcbiAgICAvLyBlbXB0eVxuICAgIGRvbmUobnVsbClcbiAgfSBlbHNlIGlmIChrZXlzKSB7XG4gICAgLy8gb2JqZWN0XG4gICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHRhc2tzW2tleV0oZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7IGVhY2goa2V5LCBlcnIsIHJlc3VsdCkgfSlcbiAgICB9KVxuICB9IGVsc2Uge1xuICAgIC8vIGFycmF5XG4gICAgdGFza3MuZm9yRWFjaChmdW5jdGlvbiAodGFzaywgaSkge1xuICAgICAgdGFzayhmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHsgZWFjaChpLCBlcnIsIHJlc3VsdCkgfSlcbiAgICB9KVxuICB9XG5cbiAgaXNTeW5jID0gZmFsc2Vcbn1cbiIsIi8vIEdlbmVyYXRlZCBieSBCYWJlbFxuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmVuY29kZSA9IGVuY29kZTtcbi8qIGdsb2JhbDogd2luZG93ICovXG5cbnZhciBfd2luZG93ID0gd2luZG93O1xudmFyIGJ0b2EgPSBfd2luZG93LmJ0b2E7XG5mdW5jdGlvbiBlbmNvZGUoZGF0YSkge1xuICByZXR1cm4gYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoZGF0YSkpKTtcbn1cblxudmFyIGlzU3VwcG9ydGVkID0gZXhwb3J0cy5pc1N1cHBvcnRlZCA9IFwiYnRvYVwiIGluIHdpbmRvdzsiLCIvLyBHZW5lcmF0ZWQgYnkgQmFiZWxcblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5uZXdSZXF1ZXN0ID0gbmV3UmVxdWVzdDtcbmV4cG9ydHMucmVzb2x2ZVVybCA9IHJlc29sdmVVcmw7XG5cbnZhciBfdXJsUGFyc2UgPSByZXF1aXJlKFwidXJsLXBhcnNlXCIpO1xuXG52YXIgX3VybFBhcnNlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3VybFBhcnNlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gbmV3UmVxdWVzdCgpIHtcbiAgcmV0dXJuIG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3QoKTtcbn0gLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG5cbmZ1bmN0aW9uIHJlc29sdmVVcmwob3JpZ2luLCBsaW5rKSB7XG4gIHJldHVybiBuZXcgX3VybFBhcnNlMi5kZWZhdWx0KGxpbmssIG9yaWdpbikudG9TdHJpbmcoKTtcbn0iLCIvLyBHZW5lcmF0ZWQgYnkgQmFiZWxcblwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5nZXRTb3VyY2UgPSBnZXRTb3VyY2U7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBGaWxlU291cmNlID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBGaWxlU291cmNlKGZpbGUpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRmlsZVNvdXJjZSk7XG5cbiAgICB0aGlzLl9maWxlID0gZmlsZTtcbiAgICB0aGlzLnNpemUgPSBmaWxlLnNpemU7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoRmlsZVNvdXJjZSwgW3tcbiAgICBrZXk6IFwic2xpY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2xpY2Uoc3RhcnQsIGVuZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2ZpbGUuc2xpY2Uoc3RhcnQsIGVuZCk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcImNsb3NlXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlKCkge31cbiAgfV0pO1xuXG4gIHJldHVybiBGaWxlU291cmNlO1xufSgpO1xuXG5mdW5jdGlvbiBnZXRTb3VyY2UoaW5wdXQpIHtcbiAgLy8gU2luY2Ugd2UgZW11bGF0ZSB0aGUgQmxvYiB0eXBlIGluIG91ciB0ZXN0cyAobm90IGFsbCB0YXJnZXQgYnJvd3NlcnNcbiAgLy8gc3VwcG9ydCBpdCksIHdlIGNhbm5vdCB1c2UgYGluc3RhbmNlb2ZgIGZvciB0ZXN0aW5nIHdoZXRoZXIgdGhlIGlucHV0IHZhbHVlXG4gIC8vIGNhbiBiZSBoYW5kbGVkLiBJbnN0ZWFkLCB3ZSBzaW1wbHkgY2hlY2sgaXMgdGhlIHNsaWNlKCkgZnVuY3Rpb24gYW5kIHRoZVxuICAvLyBzaXplIHByb3BlcnR5IGFyZSBhdmFpbGFibGUuXG4gIGlmICh0eXBlb2YgaW5wdXQuc2xpY2UgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgaW5wdXQuc2l6ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHJldHVybiBuZXcgRmlsZVNvdXJjZShpbnB1dCk7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJzb3VyY2Ugb2JqZWN0IG1heSBvbmx5IGJlIGFuIGluc3RhbmNlIG9mIEZpbGUgb3IgQmxvYiBpbiB0aGlzIGVudmlyb25tZW50XCIpO1xufSIsIi8vIEdlbmVyYXRlZCBieSBCYWJlbFxuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnNldEl0ZW0gPSBzZXRJdGVtO1xuZXhwb3J0cy5nZXRJdGVtID0gZ2V0SXRlbTtcbmV4cG9ydHMucmVtb3ZlSXRlbSA9IHJlbW92ZUl0ZW07XG4vKiBnbG9iYWwgd2luZG93LCBsb2NhbFN0b3JhZ2UgKi9cblxudmFyIGhhc1N0b3JhZ2UgPSBmYWxzZTtcbnRyeSB7XG4gIGhhc1N0b3JhZ2UgPSBcImxvY2FsU3RvcmFnZVwiIGluIHdpbmRvdztcblxuICAvLyBBdHRlbXB0IHRvIHN0b3JlIGFuZCByZWFkIGVudHJpZXMgZnJvbSB0aGUgbG9jYWwgc3RvcmFnZSB0byBkZXRlY3QgUHJpdmF0ZVxuICAvLyBNb2RlIG9uIFNhZmFyaSBvbiBpT1MgKHNlZSAjNDkpXG4gIHZhciBrZXkgPSBcInR1c1N1cHBvcnRcIjtcbiAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKTtcbn0gY2F0Y2ggKGUpIHtcbiAgLy8gSWYgd2UgdHJ5IHRvIGFjY2VzcyBsb2NhbFN0b3JhZ2UgaW5zaWRlIGEgc2FuZGJveGVkIGlmcmFtZSwgYSBTZWN1cml0eUVycm9yXG4gIC8vIGlzIHRocm93bi4gV2hlbiBpbiBwcml2YXRlIG1vZGUgb24gaU9TIFNhZmFyaSwgYSBRdW90YUV4Y2VlZGVkRXJyb3IgaXNcbiAgLy8gdGhyb3duIChzZWUgIzQ5KVxuICBpZiAoZS5jb2RlID09PSBlLlNFQ1VSSVRZX0VSUiB8fCBlLmNvZGUgPT09IGUuUVVPVEFfRVhDRUVERURfRVJSKSB7XG4gICAgaGFzU3RvcmFnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRocm93IGU7XG4gIH1cbn1cblxudmFyIGNhblN0b3JlVVJMcyA9IGV4cG9ydHMuY2FuU3RvcmVVUkxzID0gaGFzU3RvcmFnZTtcblxuZnVuY3Rpb24gc2V0SXRlbShrZXksIHZhbHVlKSB7XG4gIGlmICghaGFzU3RvcmFnZSkgcmV0dXJuO1xuICByZXR1cm4gbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGdldEl0ZW0oa2V5KSB7XG4gIGlmICghaGFzU3RvcmFnZSkgcmV0dXJuO1xuICByZXR1cm4gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSXRlbShrZXkpIHtcbiAgaWYgKCFoYXNTdG9yYWdlKSByZXR1cm47XG4gIHJldHVybiBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xufSIsIi8vIEdlbmVyYXRlZCBieSBCYWJlbFxuXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbmZ1bmN0aW9uIF9wb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHNlbGYsIGNhbGwpIHsgaWYgKCFzZWxmKSB7IHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInRoaXMgaGFzbid0IGJlZW4gaW5pdGlhbGlzZWQgLSBzdXBlcigpIGhhc24ndCBiZWVuIGNhbGxlZFwiKTsgfSByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjsgfVxuXG5mdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCBcIiArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxudmFyIERldGFpbGVkRXJyb3IgPSBmdW5jdGlvbiAoX0Vycm9yKSB7XG4gIF9pbmhlcml0cyhEZXRhaWxlZEVycm9yLCBfRXJyb3IpO1xuXG4gIGZ1bmN0aW9uIERldGFpbGVkRXJyb3IoZXJyb3IpIHtcbiAgICB2YXIgY2F1c2luZ0VyciA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IG51bGwgOiBhcmd1bWVudHNbMV07XG4gICAgdmFyIHhociA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IG51bGwgOiBhcmd1bWVudHNbMl07XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRGV0YWlsZWRFcnJvcik7XG5cbiAgICB2YXIgX3RoaXMgPSBfcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoRGV0YWlsZWRFcnJvcikuY2FsbCh0aGlzLCBlcnJvci5tZXNzYWdlKSk7XG5cbiAgICBfdGhpcy5vcmlnaW5hbFJlcXVlc3QgPSB4aHI7XG4gICAgX3RoaXMuY2F1c2luZ0Vycm9yID0gY2F1c2luZ0VycjtcblxuICAgIHZhciBtZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcbiAgICBpZiAoY2F1c2luZ0VyciAhPSBudWxsKSB7XG4gICAgICBtZXNzYWdlICs9IFwiLCBjYXVzZWQgYnkgXCIgKyBjYXVzaW5nRXJyLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIGlmICh4aHIgIT0gbnVsbCkge1xuICAgICAgbWVzc2FnZSArPSBcIiwgb3JpZ2luYXRlZCBmcm9tIHJlcXVlc3QgKHJlc3BvbnNlIGNvZGU6IFwiICsgeGhyLnN0YXR1cyArIFwiLCByZXNwb25zZSB0ZXh0OiBcIiArIHhoci5yZXNwb25zZVRleHQgKyBcIilcIjtcbiAgICB9XG4gICAgX3RoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG5cbiAgcmV0dXJuIERldGFpbGVkRXJyb3I7XG59KEVycm9yKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gRGV0YWlsZWRFcnJvcjsiLCIvLyBHZW5lcmF0ZWQgYnkgQmFiZWxcblwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZmluZ2VycHJpbnQ7XG4vKipcbiAqIEdlbmVyYXRlIGEgZmluZ2VycHJpbnQgZm9yIGEgZmlsZSB3aGljaCB3aWxsIGJlIHVzZWQgdGhlIHN0b3JlIHRoZSBlbmRwb2ludFxuICpcbiAqIEBwYXJhbSB7RmlsZX0gZmlsZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBmaW5nZXJwcmludChmaWxlLCBvcHRpb25zKSB7XG4gIHJldHVybiBbXCJ0dXNcIiwgZmlsZS5uYW1lLCBmaWxlLnR5cGUsIGZpbGUuc2l6ZSwgZmlsZS5sYXN0TW9kaWZpZWQsIG9wdGlvbnMuZW5kcG9pbnRdLmpvaW4oXCItXCIpO1xufSIsIi8vIEdlbmVyYXRlZCBieSBCYWJlbFxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfdXBsb2FkID0gcmVxdWlyZShcIi4vdXBsb2FkXCIpO1xuXG52YXIgX3VwbG9hZDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91cGxvYWQpO1xuXG52YXIgX3N0b3JhZ2UgPSByZXF1aXJlKFwiLi9ub2RlL3N0b3JhZ2VcIik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qIGdsb2JhbCB3aW5kb3cgKi9cbnZhciBkZWZhdWx0T3B0aW9ucyA9IF91cGxvYWQyLmRlZmF1bHQuZGVmYXVsdE9wdGlvbnM7XG5cbnZhciBpc1N1cHBvcnRlZCA9IHZvaWQgMDtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgLy8gQnJvd3NlciBlbnZpcm9ubWVudCB1c2luZyBYTUxIdHRwUmVxdWVzdFxuICB2YXIgX3dpbmRvdyA9IHdpbmRvdztcbiAgdmFyIFhNTEh0dHBSZXF1ZXN0ID0gX3dpbmRvdy5YTUxIdHRwUmVxdWVzdDtcbiAgdmFyIEJsb2IgPSBfd2luZG93LkJsb2I7XG5cblxuICBpc1N1cHBvcnRlZCA9IFhNTEh0dHBSZXF1ZXN0ICYmIEJsb2IgJiYgdHlwZW9mIEJsb2IucHJvdG90eXBlLnNsaWNlID09PSBcImZ1bmN0aW9uXCI7XG59IGVsc2Uge1xuICAvLyBOb2RlLmpzIGVudmlyb25tZW50IHVzaW5nIGh0dHAgbW9kdWxlXG4gIGlzU3VwcG9ydGVkID0gdHJ1ZTtcbn1cblxuLy8gVGhlIHVzYWdlIG9mIHRoZSBjb21tb25qcyBleHBvcnRpbmcgc3ludGF4IGluc3RlYWQgb2YgdGhlIG5ldyBFQ01BU2NyaXB0XG4vLyBvbmUgaXMgYWN0dWFsbHkgaW50ZWRlZCBhbmQgcHJldmVudHMgd2VpcmQgYmVoYXZpb3VyIGlmIHdlIGFyZSB0cnlpbmcgdG9cbi8vIGltcG9ydCB0aGlzIG1vZHVsZSBpbiBhbm90aGVyIG1vZHVsZSB1c2luZyBCYWJlbC5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBVcGxvYWQ6IF91cGxvYWQyLmRlZmF1bHQsXG4gIGlzU3VwcG9ydGVkOiBpc1N1cHBvcnRlZCxcbiAgY2FuU3RvcmVVUkxzOiBfc3RvcmFnZS5jYW5TdG9yZVVSTHMsXG4gIGRlZmF1bHRPcHRpb25zOiBkZWZhdWx0T3B0aW9uc1xufTsiLCIvLyBHZW5lcmF0ZWQgYnkgQmFiZWxcblwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpOyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuLy8gV2UgaW1wb3J0IHRoZSBmaWxlcyB1c2VkIGluc2lkZSB0aGUgTm9kZSBlbnZpcm9ubWVudCB3aGljaCBhcmUgcmV3cml0dGVuXG4vLyBmb3IgYnJvd3NlcnMgdXNpbmcgdGhlIHJ1bGVzIGRlZmluZWQgaW4gdGhlIHBhY2thZ2UuanNvblxuXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfZmluZ2VycHJpbnQgPSByZXF1aXJlKFwiLi9maW5nZXJwcmludFwiKTtcblxudmFyIF9maW5nZXJwcmludDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9maW5nZXJwcmludCk7XG5cbnZhciBfZXJyb3IgPSByZXF1aXJlKFwiLi9lcnJvclwiKTtcblxudmFyIF9lcnJvcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9lcnJvcik7XG5cbnZhciBfZXh0ZW5kID0gcmVxdWlyZShcImV4dGVuZFwiKTtcblxudmFyIF9leHRlbmQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZXh0ZW5kKTtcblxudmFyIF9yZXF1ZXN0ID0gcmVxdWlyZShcIi4vbm9kZS9yZXF1ZXN0XCIpO1xuXG52YXIgX3NvdXJjZSA9IHJlcXVpcmUoXCIuL25vZGUvc291cmNlXCIpO1xuXG52YXIgX2Jhc2UgPSByZXF1aXJlKFwiLi9ub2RlL2Jhc2U2NFwiKTtcblxudmFyIEJhc2U2NCA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9iYXNlKTtcblxudmFyIF9zdG9yYWdlID0gcmVxdWlyZShcIi4vbm9kZS9zdG9yYWdlXCIpO1xuXG52YXIgU3RvcmFnZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9zdG9yYWdlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICBlbmRwb2ludDogbnVsbCxcbiAgZmluZ2VycHJpbnQ6IF9maW5nZXJwcmludDIuZGVmYXVsdCxcbiAgcmVzdW1lOiB0cnVlLFxuICBvblByb2dyZXNzOiBudWxsLFxuICBvbkNodW5rQ29tcGxldGU6IG51bGwsXG4gIG9uU3VjY2VzczogbnVsbCxcbiAgb25FcnJvcjogbnVsbCxcbiAgaGVhZGVyczoge30sXG4gIGNodW5rU2l6ZTogSW5maW5pdHksXG4gIHdpdGhDcmVkZW50aWFsczogZmFsc2UsXG4gIHVwbG9hZFVybDogbnVsbCxcbiAgdXBsb2FkU2l6ZTogbnVsbCxcbiAgb3ZlcnJpZGVQYXRjaE1ldGhvZDogZmFsc2UsXG4gIHJldHJ5RGVsYXlzOiBudWxsLFxuICByZW1vdmVGaW5nZXJwcmludE9uU3VjY2VzczogZmFsc2Vcbn07XG5cbnZhciBVcGxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIFVwbG9hZChmaWxlLCBvcHRpb25zKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFVwbG9hZCk7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSAoMCwgX2V4dGVuZDIuZGVmYXVsdCkodHJ1ZSwge30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblxuICAgIC8vIFRoZSB1bmRlcmx5aW5nIEZpbGUvQmxvYiBvYmplY3RcbiAgICB0aGlzLmZpbGUgPSBmaWxlO1xuXG4gICAgLy8gVGhlIFVSTCBhZ2FpbnN0IHdoaWNoIHRoZSBmaWxlIHdpbGwgYmUgdXBsb2FkZWRcbiAgICB0aGlzLnVybCA9IG51bGw7XG5cbiAgICAvLyBUaGUgdW5kZXJseWluZyBYSFIgb2JqZWN0IGZvciB0aGUgY3VycmVudCBQQVRDSCByZXF1ZXN0XG4gICAgdGhpcy5feGhyID0gbnVsbDtcblxuICAgIC8vIFRoZSBmaW5nZXJwaW5ydCBmb3IgdGhlIGN1cnJlbnQgZmlsZSAoc2V0IGFmdGVyIHN0YXJ0KCkpXG4gICAgdGhpcy5fZmluZ2VycHJpbnQgPSBudWxsO1xuXG4gICAgLy8gVGhlIG9mZnNldCB1c2VkIGluIHRoZSBjdXJyZW50IFBBVENIIHJlcXVlc3RcbiAgICB0aGlzLl9vZmZzZXQgPSBudWxsO1xuXG4gICAgLy8gVHJ1ZSBpZiB0aGUgY3VycmVudCBQQVRDSCByZXF1ZXN0IGhhcyBiZWVuIGFib3J0ZWRcbiAgICB0aGlzLl9hYm9ydGVkID0gZmFsc2U7XG5cbiAgICAvLyBUaGUgZmlsZSdzIHNpemUgaW4gYnl0ZXNcbiAgICB0aGlzLl9zaXplID0gbnVsbDtcblxuICAgIC8vIFRoZSBTb3VyY2Ugb2JqZWN0IHdoaWNoIHdpbGwgd3JhcCBhcm91bmQgdGhlIGdpdmVuIGZpbGUgYW5kIHByb3ZpZGVzIHVzXG4gICAgLy8gd2l0aCBhIHVuaWZpZWQgaW50ZXJmYWNlIGZvciBnZXR0aW5nIGl0cyBzaXplIGFuZCBzbGljZSBjaHVua3MgZnJvbSBpdHNcbiAgICAvLyBjb250ZW50IGFsbG93aW5nIHVzIHRvIGVhc2lseSBoYW5kbGUgRmlsZXMsIEJsb2JzLCBCdWZmZXJzIGFuZCBTdHJlYW1zLlxuICAgIHRoaXMuX3NvdXJjZSA9IG51bGw7XG5cbiAgICAvLyBUaGUgY3VycmVudCBjb3VudCBvZiBhdHRlbXB0cyB3aGljaCBoYXZlIGJlZW4gbWFkZS4gTnVsbCBpbmRpY2F0ZXMgbm9uZS5cbiAgICB0aGlzLl9yZXRyeUF0dGVtcHQgPSAwO1xuXG4gICAgLy8gVGhlIHRpbWVvdXQncyBJRCB3aGljaCBpcyB1c2VkIHRvIGRlbGF5IHRoZSBuZXh0IHJldHJ5XG4gICAgdGhpcy5fcmV0cnlUaW1lb3V0ID0gbnVsbDtcblxuICAgIC8vIFRoZSBvZmZzZXQgb2YgdGhlIHJlbW90ZSB1cGxvYWQgYmVmb3JlIHRoZSBsYXRlc3QgYXR0ZW1wdCB3YXMgc3RhcnRlZC5cbiAgICB0aGlzLl9vZmZzZXRCZWZvcmVSZXRyeSA9IDA7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoVXBsb2FkLCBbe1xuICAgIGtleTogXCJzdGFydFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgIHZhciBmaWxlID0gdGhpcy5maWxlO1xuXG4gICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgdGhpcy5fZW1pdEVycm9yKG5ldyBFcnJvcihcInR1czogbm8gZmlsZSBvciBzdHJlYW0gdG8gdXBsb2FkIHByb3ZpZGVkXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmRwb2ludCAmJiAhdGhpcy5vcHRpb25zLnVwbG9hZFVybCkge1xuICAgICAgICB0aGlzLl9lbWl0RXJyb3IobmV3IEVycm9yKFwidHVzOiBuZWl0aGVyIGFuIGVuZHBvaW50IG9yIGFuIHVwbG9hZCBVUkwgaXMgcHJvdmlkZWRcIikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBzb3VyY2UgPSB0aGlzLl9zb3VyY2UgPSAoMCwgX3NvdXJjZS5nZXRTb3VyY2UpKGZpbGUsIHRoaXMub3B0aW9ucy5jaHVua1NpemUpO1xuXG4gICAgICAvLyBGaXJzdGx5LCBjaGVjayBpZiB0aGUgY2FsbGVyIGhhcyBzdXBwbGllZCBhIG1hbnVhbCB1cGxvYWQgc2l6ZSBvciBlbHNlXG4gICAgICAvLyB3ZSB3aWxsIHVzZSB0aGUgY2FsY3VsYXRlZCBzaXplIGJ5IHRoZSBzb3VyY2Ugb2JqZWN0LlxuICAgICAgaWYgKHRoaXMub3B0aW9ucy51cGxvYWRTaXplICE9IG51bGwpIHtcbiAgICAgICAgdmFyIHNpemUgPSArdGhpcy5vcHRpb25zLnVwbG9hZFNpemU7XG4gICAgICAgIGlmIChpc05hTihzaXplKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInR1czogY2Fubm90IGNvbnZlcnQgYHVwbG9hZFNpemVgIG9wdGlvbiBpbnRvIGEgbnVtYmVyXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2l6ZSA9IHNpemU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgc2l6ZSA9IHNvdXJjZS5zaXplO1xuXG4gICAgICAgIC8vIFRoZSBzaXplIHByb3BlcnR5IHdpbGwgYmUgbnVsbCBpZiB3ZSBjYW5ub3QgY2FsY3VsYXRlIHRoZSBmaWxlJ3Mgc2l6ZSxcbiAgICAgICAgLy8gZm9yIGV4YW1wbGUgaWYgeW91IGhhbmRsZSBhIHN0cmVhbS5cbiAgICAgICAgaWYgKHNpemUgPT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInR1czogY2Fubm90IGF1dG9tYXRpY2FsbHkgZGVyaXZlIHVwbG9hZCdzIHNpemUgZnJvbSBpbnB1dCBhbmQgbXVzdCBiZSBzcGVjaWZpZWQgbWFudWFsbHkgdXNpbmcgdGhlIGB1cGxvYWRTaXplYCBvcHRpb25cIik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zaXplID0gc2l6ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHJldHJ5RGVsYXlzID0gdGhpcy5vcHRpb25zLnJldHJ5RGVsYXlzO1xuICAgICAgaWYgKHJldHJ5RGVsYXlzICE9IG51bGwpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChyZXRyeURlbGF5cykgIT09IFwiW29iamVjdCBBcnJheV1cIikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInR1czogdGhlIGByZXRyeURlbGF5c2Agb3B0aW9uIG11c3QgZWl0aGVyIGJlIGFuIGFycmF5IG9yIG51bGxcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBlcnJvckNhbGxiYWNrID0gX3RoaXMub3B0aW9ucy5vbkVycm9yO1xuICAgICAgICAgICAgX3RoaXMub3B0aW9ucy5vbkVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAvLyBSZXN0b3JlIHRoZSBvcmlnaW5hbCBlcnJvciBjYWxsYmFjayB3aGljaCBtYXkgaGF2ZSBiZWVuIHNldC5cbiAgICAgICAgICAgICAgX3RoaXMub3B0aW9ucy5vbkVycm9yID0gZXJyb3JDYWxsYmFjaztcblxuICAgICAgICAgICAgICAvLyBXZSB3aWxsIHJlc2V0IHRoZSBhdHRlbXB0IGNvdW50ZXIgaWZcbiAgICAgICAgICAgICAgLy8gLSB3ZSB3ZXJlIGFscmVhZHkgYWJsZSB0byBjb25uZWN0IHRvIHRoZSBzZXJ2ZXIgKG9mZnNldCAhPSBudWxsKSBhbmRcbiAgICAgICAgICAgICAgLy8gLSB3ZSB3ZXJlIGFibGUgdG8gdXBsb2FkIGEgc21hbGwgY2h1bmsgb2YgZGF0YSB0byB0aGUgc2VydmVyXG4gICAgICAgICAgICAgIHZhciBzaG91bGRSZXNldERlbGF5cyA9IF90aGlzLl9vZmZzZXQgIT0gbnVsbCAmJiBfdGhpcy5fb2Zmc2V0ID4gX3RoaXMuX29mZnNldEJlZm9yZVJldHJ5O1xuICAgICAgICAgICAgICBpZiAoc2hvdWxkUmVzZXREZWxheXMpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5fcmV0cnlBdHRlbXB0ID0gMDtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHZhciBpc09ubGluZSA9IHRydWU7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIFwibmF2aWdhdG9yXCIgaW4gd2luZG93ICYmIHdpbmRvdy5uYXZpZ2F0b3Iub25MaW5lID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGlzT25saW5lID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBXZSBvbmx5IGF0dGVtcHQgYSByZXRyeSBpZlxuICAgICAgICAgICAgICAvLyAtIHdlIGRpZG4ndCBleGNlZWQgdGhlIG1heGl1bSBudW1iZXIgb2YgcmV0cmllcywgeWV0LCBhbmRcbiAgICAgICAgICAgICAgLy8gLSB0aGlzIGVycm9yIHdhcyBjYXVzZWQgYnkgYSByZXF1ZXN0IG9yIGl0J3MgcmVzcG9uc2UgYW5kXG4gICAgICAgICAgICAgIC8vIC0gdGhlIGVycm9yIGlzIG5vdCBhIGNsaWVudCBlcnJvciAoc3RhdHVzIDR4eCkgYW5kXG4gICAgICAgICAgICAgIC8vIC0gdGhlIGJyb3dzZXIgZG9lcyBub3QgaW5kaWNhdGUgdGhhdCB3ZSBhcmUgb2ZmbGluZVxuICAgICAgICAgICAgICB2YXIgc2hvdWxkUmV0cnkgPSBfdGhpcy5fcmV0cnlBdHRlbXB0IDwgcmV0cnlEZWxheXMubGVuZ3RoICYmIGVyci5vcmlnaW5hbFJlcXVlc3QgIT0gbnVsbCAmJiAhaW5TdGF0dXNDYXRlZ29yeShlcnIub3JpZ2luYWxSZXF1ZXN0LnN0YXR1cywgNDAwKSAmJiBpc09ubGluZTtcblxuICAgICAgICAgICAgICBpZiAoIXNob3VsZFJldHJ5KSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuX2VtaXRFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHZhciBkZWxheSA9IHJldHJ5RGVsYXlzW190aGlzLl9yZXRyeUF0dGVtcHQrK107XG5cbiAgICAgICAgICAgICAgX3RoaXMuX29mZnNldEJlZm9yZVJldHJ5ID0gX3RoaXMuX29mZnNldDtcbiAgICAgICAgICAgICAgX3RoaXMub3B0aW9ucy51cGxvYWRVcmwgPSBfdGhpcy51cmw7XG5cbiAgICAgICAgICAgICAgX3RoaXMuX3JldHJ5VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLnN0YXJ0KCk7XG4gICAgICAgICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZXNldCB0aGUgYWJvcnRlZCBmbGFnIHdoZW4gdGhlIHVwbG9hZCBpcyBzdGFydGVkIG9yIGVsc2UgdGhlXG4gICAgICAvLyBfc3RhcnRVcGxvYWQgd2lsbCBzdG9wIGJlZm9yZSBzZW5kaW5nIGEgcmVxdWVzdCBpZiB0aGUgdXBsb2FkIGhhcyBiZWVuXG4gICAgICAvLyBhYm9ydGVkIHByZXZpb3VzbHkuXG4gICAgICB0aGlzLl9hYm9ydGVkID0gZmFsc2U7XG5cbiAgICAgIC8vIFRoZSB1cGxvYWQgaGFkIGJlZW4gc3RhcnRlZCBwcmV2aW91c2x5IGFuZCB3ZSBzaG91bGQgcmV1c2UgdGhpcyBVUkwuXG4gICAgICBpZiAodGhpcy51cmwgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9yZXN1bWVVcGxvYWQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBBIFVSTCBoYXMgbWFudWFsbHkgYmVlbiBzcGVjaWZpZWQsIHNvIHdlIHRyeSB0byByZXN1bWVcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudXBsb2FkVXJsICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy51cmwgPSB0aGlzLm9wdGlvbnMudXBsb2FkVXJsO1xuICAgICAgICB0aGlzLl9yZXN1bWVVcGxvYWQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBUcnkgdG8gZmluZCB0aGUgZW5kcG9pbnQgZm9yIHRoZSBmaWxlIGluIHRoZSBzdG9yYWdlXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnJlc3VtZSkge1xuICAgICAgICB0aGlzLl9maW5nZXJwcmludCA9IHRoaXMub3B0aW9ucy5maW5nZXJwcmludChmaWxlLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICB2YXIgcmVzdW1lZFVybCA9IFN0b3JhZ2UuZ2V0SXRlbSh0aGlzLl9maW5nZXJwcmludCk7XG5cbiAgICAgICAgaWYgKHJlc3VtZWRVcmwgIT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMudXJsID0gcmVzdW1lZFVybDtcbiAgICAgICAgICB0aGlzLl9yZXN1bWVVcGxvYWQoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQW4gdXBsb2FkIGhhcyBub3Qgc3RhcnRlZCBmb3IgdGhlIGZpbGUgeWV0LCBzbyB3ZSBzdGFydCBhIG5ldyBvbmVcbiAgICAgIHRoaXMuX2NyZWF0ZVVwbG9hZCgpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJhYm9ydFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBhYm9ydCgpIHtcbiAgICAgIGlmICh0aGlzLl94aHIgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5feGhyLmFib3J0KCk7XG4gICAgICAgIHRoaXMuX3NvdXJjZS5jbG9zZSgpO1xuICAgICAgICB0aGlzLl9hYm9ydGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3JldHJ5VGltZW91dCAhPSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9yZXRyeVRpbWVvdXQpO1xuICAgICAgICB0aGlzLl9yZXRyeVRpbWVvdXQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJfZW1pdFhockVycm9yXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9lbWl0WGhyRXJyb3IoeGhyLCBlcnIsIGNhdXNpbmdFcnIpIHtcbiAgICAgIHRoaXMuX2VtaXRFcnJvcihuZXcgX2Vycm9yMi5kZWZhdWx0KGVyciwgY2F1c2luZ0VyciwgeGhyKSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiBcIl9lbWl0RXJyb3JcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX2VtaXRFcnJvcihlcnIpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLm9uRXJyb3IgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aGlzLm9wdGlvbnMub25FcnJvcihlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogXCJfZW1pdFN1Y2Nlc3NcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gX2VtaXRTdWNjZXNzKCkge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub25TdWNjZXNzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uU3VjY2VzcygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFB1Ymxpc2hlcyBub3RpZmljYXRpb24gd2hlbiBkYXRhIGhhcyBiZWVuIHNlbnQgdG8gdGhlIHNlcnZlci4gVGhpc1xuICAgICAqIGRhdGEgbWF5IG5vdCBoYXZlIGJlZW4gYWNjZXB0ZWQgYnkgdGhlIHNlcnZlciB5ZXQuXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBieXRlc1NlbnQgIE51bWJlciBvZiBieXRlcyBzZW50IHRvIHRoZSBzZXJ2ZXIuXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSBieXRlc1RvdGFsIFRvdGFsIG51bWJlciBvZiBieXRlcyB0byBiZSBzZW50IHRvIHRoZSBzZXJ2ZXIuXG4gICAgICovXG5cbiAgfSwge1xuICAgIGtleTogXCJfZW1pdFByb2dyZXNzXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9lbWl0UHJvZ3Jlc3MoYnl0ZXNTZW50LCBieXRlc1RvdGFsKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vblByb2dyZXNzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uUHJvZ3Jlc3MoYnl0ZXNTZW50LCBieXRlc1RvdGFsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoZXMgbm90aWZpY2F0aW9uIHdoZW4gYSBjaHVuayBvZiBkYXRhIGhhcyBiZWVuIHNlbnQgdG8gdGhlIHNlcnZlclxuICAgICAqIGFuZCBhY2NlcHRlZCBieSB0aGUgc2VydmVyLlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gY2h1bmtTaXplICBTaXplIG9mIHRoZSBjaHVuayB0aGF0IHdhcyBhY2NlcHRlZCBieSB0aGVcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVyLlxuICAgICAqIEBwYXJhbSAge251bWJlcn0gYnl0ZXNBY2NlcHRlZCBUb3RhbCBudW1iZXIgb2YgYnl0ZXMgdGhhdCBoYXZlIGJlZW5cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXB0ZWQgYnkgdGhlIHNlcnZlci5cbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9IGJ5dGVzVG90YWwgVG90YWwgbnVtYmVyIG9mIGJ5dGVzIHRvIGJlIHNlbnQgdG8gdGhlIHNlcnZlci5cbiAgICAgKi9cblxuICB9LCB7XG4gICAga2V5OiBcIl9lbWl0Q2h1bmtDb21wbGV0ZVwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBfZW1pdENodW5rQ29tcGxldGUoY2h1bmtTaXplLCBieXRlc0FjY2VwdGVkLCBieXRlc1RvdGFsKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vbkNodW5rQ29tcGxldGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aGlzLm9wdGlvbnMub25DaHVua0NvbXBsZXRlKGNodW5rU2l6ZSwgYnl0ZXNBY2NlcHRlZCwgYnl0ZXNUb3RhbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBoZWFkZXJzIHVzZWQgaW4gdGhlIHJlcXVlc3QgYW5kIHRoZSB3aXRoQ3JlZGVudGlhbHMgcHJvcGVydHlcbiAgICAgKiBhcyBkZWZpbmVkIGluIHRoZSBvcHRpb25zXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1hNTEh0dHBSZXF1ZXN0fSB4aHJcbiAgICAgKi9cblxuICB9LCB7XG4gICAga2V5OiBcIl9zZXR1cFhIUlwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBfc2V0dXBYSFIoeGhyKSB7XG4gICAgICB0aGlzLl94aHIgPSB4aHI7XG5cbiAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiVHVzLVJlc3VtYWJsZVwiLCBcIjEuMC4wXCIpO1xuICAgICAgdmFyIGhlYWRlcnMgPSB0aGlzLm9wdGlvbnMuaGVhZGVycztcblxuICAgICAgZm9yICh2YXIgbmFtZSBpbiBoZWFkZXJzKSB7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgICAgfVxuXG4gICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdGhpcy5vcHRpb25zLndpdGhDcmVkZW50aWFscztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgdXBsb2FkIHVzaW5nIHRoZSBjcmVhdGlvbiBleHRlbnNpb24gYnkgc2VuZGluZyBhIFBPU1RcbiAgICAgKiByZXF1ZXN0IHRvIHRoZSBlbmRwb2ludC4gQWZ0ZXIgc3VjY2Vzc2Z1bCBjcmVhdGlvbiB0aGUgZmlsZSB3aWxsIGJlXG4gICAgICogdXBsb2FkZWRcbiAgICAgKlxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwiX2NyZWF0ZVVwbG9hZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBfY3JlYXRlVXBsb2FkKCkge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgIGlmICghdGhpcy5vcHRpb25zLmVuZHBvaW50KSB7XG4gICAgICAgIHRoaXMuX2VtaXRFcnJvcihuZXcgRXJyb3IoXCJ0dXM6IHVuYWJsZSB0byBjcmVhdGUgdXBsb2FkIGJlY2F1c2Ugbm8gZW5kcG9pbnQgaXMgcHJvdmlkZWRcIikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciB4aHIgPSAoMCwgX3JlcXVlc3QubmV3UmVxdWVzdCkoKTtcbiAgICAgIHhoci5vcGVuKFwiUE9TVFwiLCB0aGlzLm9wdGlvbnMuZW5kcG9pbnQsIHRydWUpO1xuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWluU3RhdHVzQ2F0ZWdvcnkoeGhyLnN0YXR1cywgMjAwKSkge1xuICAgICAgICAgIF90aGlzMi5fZW1pdFhockVycm9yKHhociwgbmV3IEVycm9yKFwidHVzOiB1bmV4cGVjdGVkIHJlc3BvbnNlIHdoaWxlIGNyZWF0aW5nIHVwbG9hZFwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxvY2F0aW9uID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKFwiTG9jYXRpb25cIik7XG4gICAgICAgIGlmIChsb2NhdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgX3RoaXMyLl9lbWl0WGhyRXJyb3IoeGhyLCBuZXcgRXJyb3IoXCJ0dXM6IGludmFsaWQgb3IgbWlzc2luZyBMb2NhdGlvbiBoZWFkZXJcIikpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzMi51cmwgPSAoMCwgX3JlcXVlc3QucmVzb2x2ZVVybCkoX3RoaXMyLm9wdGlvbnMuZW5kcG9pbnQsIGxvY2F0aW9uKTtcblxuICAgICAgICBpZiAoX3RoaXMyLl9zaXplID09PSAwKSB7XG4gICAgICAgICAgLy8gTm90aGluZyB0byB1cGxvYWQgYW5kIGZpbGUgd2FzIHN1Y2Nlc3NmdWxseSBjcmVhdGVkXG4gICAgICAgICAgX3RoaXMyLl9lbWl0U3VjY2VzcygpO1xuICAgICAgICAgIF90aGlzMi5fc291cmNlLmNsb3NlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF90aGlzMi5vcHRpb25zLnJlc3VtZSkge1xuICAgICAgICAgIFN0b3JhZ2Uuc2V0SXRlbShfdGhpczIuX2ZpbmdlcnByaW50LCBfdGhpczIudXJsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzMi5fb2Zmc2V0ID0gMDtcbiAgICAgICAgX3RoaXMyLl9zdGFydFVwbG9hZCgpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIF90aGlzMi5fZW1pdFhockVycm9yKHhociwgbmV3IEVycm9yKFwidHVzOiBmYWlsZWQgdG8gY3JlYXRlIHVwbG9hZFwiKSwgZXJyKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuX3NldHVwWEhSKHhocik7XG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlVwbG9hZC1MZW5ndGhcIiwgdGhpcy5fc2l6ZSk7XG5cbiAgICAgIC8vIEFkZCBtZXRhZGF0YSBpZiB2YWx1ZXMgaGF2ZSBiZWVuIGFkZGVkXG4gICAgICB2YXIgbWV0YWRhdGEgPSBlbmNvZGVNZXRhZGF0YSh0aGlzLm9wdGlvbnMubWV0YWRhdGEpO1xuICAgICAgaWYgKG1ldGFkYXRhICE9PSBcIlwiKSB7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiVXBsb2FkLU1ldGFkYXRhXCIsIG1ldGFkYXRhKTtcbiAgICAgIH1cblxuICAgICAgeGhyLnNlbmQobnVsbCk7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBUcnkgdG8gcmVzdW1lIGFuIGV4aXN0aW5nIHVwbG9hZC4gRmlyc3QgYSBIRUFEIHJlcXVlc3Qgd2lsbCBiZSBzZW50XG4gICAgICogdG8gcmV0cmlldmUgdGhlIG9mZnNldC4gSWYgdGhlIHJlcXVlc3QgZmFpbHMgYSBuZXcgdXBsb2FkIHdpbGwgYmVcbiAgICAgKiBjcmVhdGVkLiBJbiB0aGUgY2FzZSBvZiBhIHN1Y2Nlc3NmdWwgcmVzcG9uc2UgdGhlIGZpbGUgd2lsbCBiZSB1cGxvYWRlZC5cbiAgICAgKlxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwiX3Jlc3VtZVVwbG9hZFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBfcmVzdW1lVXBsb2FkKCkge1xuICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgIHZhciB4aHIgPSAoMCwgX3JlcXVlc3QubmV3UmVxdWVzdCkoKTtcbiAgICAgIHhoci5vcGVuKFwiSEVBRFwiLCB0aGlzLnVybCwgdHJ1ZSk7XG5cbiAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghaW5TdGF0dXNDYXRlZ29yeSh4aHIuc3RhdHVzLCAyMDApKSB7XG4gICAgICAgICAgaWYgKF90aGlzMy5vcHRpb25zLnJlc3VtZSAmJiBpblN0YXR1c0NhdGVnb3J5KHhoci5zdGF0dXMsIDQwMCkpIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSBzdG9yZWQgZmluZ2VycHJpbnQgYW5kIGNvcnJlc3BvbmRpbmcgZW5kcG9pbnQsXG4gICAgICAgICAgICAvLyBvbiBjbGllbnQgZXJyb3JzIHNpbmNlIHRoZSBmaWxlIGNhbiBub3QgYmUgZm91bmRcbiAgICAgICAgICAgIFN0b3JhZ2UucmVtb3ZlSXRlbShfdGhpczMuX2ZpbmdlcnByaW50KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJZiB0aGUgdXBsb2FkIGlzIGxvY2tlZCAoaW5kaWNhdGVkIGJ5IHRoZSA0MjMgTG9ja2VkIHN0YXR1cyBjb2RlKSwgd2VcbiAgICAgICAgICAvLyBlbWl0IGFuIGVycm9yIGluc3RlYWQgb2YgZGlyZWN0bHkgc3RhcnRpbmcgYSBuZXcgdXBsb2FkLiBUaGlzIHdheSB0aGVcbiAgICAgICAgICAvLyByZXRyeSBsb2dpYyBjYW4gY2F0Y2ggdGhlIGVycm9yIGFuZCB3aWxsIHJldHJ5IHRoZSB1cGxvYWQuIEFuIHVwbG9hZFxuICAgICAgICAgIC8vIGlzIHVzdWFsbHkgbG9ja2VkIGZvciBhIHNob3J0IHBlcmlvZCBvZiB0aW1lIGFuZCB3aWxsIGJlIGF2YWlsYWJsZVxuICAgICAgICAgIC8vIGFmdGVyd2FyZHMuXG4gICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDQyMykge1xuICAgICAgICAgICAgX3RoaXMzLl9lbWl0WGhyRXJyb3IoeGhyLCBuZXcgRXJyb3IoXCJ0dXM6IHVwbG9hZCBpcyBjdXJyZW50bHkgbG9ja2VkOyByZXRyeSBsYXRlclwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFfdGhpczMub3B0aW9ucy5lbmRwb2ludCkge1xuICAgICAgICAgICAgLy8gRG9uJ3QgYXR0ZW1wdCB0byBjcmVhdGUgYSBuZXcgdXBsb2FkIGlmIG5vIGVuZHBvaW50IGlzIHByb3ZpZGVkLlxuICAgICAgICAgICAgX3RoaXMzLl9lbWl0WGhyRXJyb3IoeGhyLCBuZXcgRXJyb3IoXCJ0dXM6IHVuYWJsZSB0byByZXN1bWUgdXBsb2FkIChuZXcgdXBsb2FkIGNhbm5vdCBiZSBjcmVhdGVkIHdpdGhvdXQgYW4gZW5kcG9pbnQpXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBUcnkgdG8gY3JlYXRlIGEgbmV3IHVwbG9hZFxuICAgICAgICAgIF90aGlzMy51cmwgPSBudWxsO1xuICAgICAgICAgIF90aGlzMy5fY3JlYXRlVXBsb2FkKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9mZnNldCA9IHBhcnNlSW50KHhoci5nZXRSZXNwb25zZUhlYWRlcihcIlVwbG9hZC1PZmZzZXRcIiksIDEwKTtcbiAgICAgICAgaWYgKGlzTmFOKG9mZnNldCkpIHtcbiAgICAgICAgICBfdGhpczMuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogaW52YWxpZCBvciBtaXNzaW5nIG9mZnNldCB2YWx1ZVwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IHBhcnNlSW50KHhoci5nZXRSZXNwb25zZUhlYWRlcihcIlVwbG9hZC1MZW5ndGhcIiksIDEwKTtcbiAgICAgICAgaWYgKGlzTmFOKGxlbmd0aCkpIHtcbiAgICAgICAgICBfdGhpczMuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogaW52YWxpZCBvciBtaXNzaW5nIGxlbmd0aCB2YWx1ZVwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBsb2FkIGhhcyBhbHJlYWR5IGJlZW4gY29tcGxldGVkIGFuZCB3ZSBkbyBub3QgbmVlZCB0byBzZW5kIGFkZGl0aW9uYWxcbiAgICAgICAgLy8gZGF0YSB0byB0aGUgc2VydmVyXG4gICAgICAgIGlmIChvZmZzZXQgPT09IGxlbmd0aCkge1xuICAgICAgICAgIF90aGlzMy5fZW1pdFByb2dyZXNzKGxlbmd0aCwgbGVuZ3RoKTtcbiAgICAgICAgICBfdGhpczMuX2VtaXRTdWNjZXNzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXMzLl9vZmZzZXQgPSBvZmZzZXQ7XG4gICAgICAgIF90aGlzMy5fc3RhcnRVcGxvYWQoKTtcbiAgICAgIH07XG5cbiAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICBfdGhpczMuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogZmFpbGVkIHRvIHJlc3VtZSB1cGxvYWRcIiksIGVycik7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLl9zZXR1cFhIUih4aHIpO1xuICAgICAgeGhyLnNlbmQobnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgdXBsb2FkaW5nIHRoZSBmaWxlIHVzaW5nIFBBVENIIHJlcXVlc3RzLiBUaGUgZmlsZSB3aWxsIGJlIGRpdmlkZWRcbiAgICAgKiBpbnRvIGNodW5rcyBhcyBzcGVjaWZpZWQgaW4gdGhlIGNodW5rU2l6ZSBvcHRpb24uIER1cmluZyB0aGUgdXBsb2FkXG4gICAgICogdGhlIG9uUHJvZ3Jlc3MgZXZlbnQgaGFuZGxlciBtYXkgYmUgaW52b2tlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICAgKlxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwiX3N0YXJ0VXBsb2FkXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIF9zdGFydFVwbG9hZCgpIHtcbiAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG4gICAgICAvLyBJZiB0aGUgdXBsb2FkIGhhcyBiZWVuIGFib3J0ZWQsIHdlIHdpbGwgbm90IHNlbmQgdGhlIG5leHQgUEFUQ0ggcmVxdWVzdC5cbiAgICAgIC8vIFRoaXMgaXMgaW1wb3J0YW50IGlmIHRoZSBhYm9ydCBtZXRob2Qgd2FzIGNhbGxlZCBkdXJpbmcgYSBjYWxsYmFjaywgc3VjaFxuICAgICAgLy8gYXMgb25DaHVua0NvbXBsZXRlIG9yIG9uUHJvZ3Jlc3MuXG4gICAgICBpZiAodGhpcy5fYWJvcnRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciB4aHIgPSAoMCwgX3JlcXVlc3QubmV3UmVxdWVzdCkoKTtcblxuICAgICAgLy8gU29tZSBicm93c2VyIGFuZCBzZXJ2ZXJzIG1heSBub3Qgc3VwcG9ydCB0aGUgUEFUQ0ggbWV0aG9kLiBGb3IgdGhvc2VcbiAgICAgIC8vIGNhc2VzLCB5b3UgY2FuIHRlbGwgdHVzLWpzLWNsaWVudCB0byB1c2UgYSBQT1NUIHJlcXVlc3Qgd2l0aCB0aGVcbiAgICAgIC8vIFgtSFRUUC1NZXRob2QtT3ZlcnJpZGUgaGVhZGVyIGZvciBzaW11bGF0aW5nIGEgUEFUQ0ggcmVxdWVzdC5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcnJpZGVQYXRjaE1ldGhvZCkge1xuICAgICAgICB4aHIub3BlbihcIlBPU1RcIiwgdGhpcy51cmwsIHRydWUpO1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlgtSFRUUC1NZXRob2QtT3ZlcnJpZGVcIiwgXCJQQVRDSFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHhoci5vcGVuKFwiUEFUQ0hcIiwgdGhpcy51cmwsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWluU3RhdHVzQ2F0ZWdvcnkoeGhyLnN0YXR1cywgMjAwKSkge1xuICAgICAgICAgIF90aGlzNC5fZW1pdFhockVycm9yKHhociwgbmV3IEVycm9yKFwidHVzOiB1bmV4cGVjdGVkIHJlc3BvbnNlIHdoaWxlIHVwbG9hZGluZyBjaHVua1wiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9mZnNldCA9IHBhcnNlSW50KHhoci5nZXRSZXNwb25zZUhlYWRlcihcIlVwbG9hZC1PZmZzZXRcIiksIDEwKTtcbiAgICAgICAgaWYgKGlzTmFOKG9mZnNldCkpIHtcbiAgICAgICAgICBfdGhpczQuX2VtaXRYaHJFcnJvcih4aHIsIG5ldyBFcnJvcihcInR1czogaW52YWxpZCBvciBtaXNzaW5nIG9mZnNldCB2YWx1ZVwiKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXM0Ll9lbWl0UHJvZ3Jlc3Mob2Zmc2V0LCBfdGhpczQuX3NpemUpO1xuICAgICAgICBfdGhpczQuX2VtaXRDaHVua0NvbXBsZXRlKG9mZnNldCAtIF90aGlzNC5fb2Zmc2V0LCBvZmZzZXQsIF90aGlzNC5fc2l6ZSk7XG5cbiAgICAgICAgX3RoaXM0Ll9vZmZzZXQgPSBvZmZzZXQ7XG5cbiAgICAgICAgaWYgKG9mZnNldCA9PSBfdGhpczQuX3NpemUpIHtcbiAgICAgICAgICBpZiAoX3RoaXM0Lm9wdGlvbnMucmVtb3ZlRmluZ2VycHJpbnRPblN1Y2Nlc3MgJiYgX3RoaXM0Lm9wdGlvbnMucmVzdW1lKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgc3RvcmVkIGZpbmdlcnByaW50IGFuZCBjb3JyZXNwb25kaW5nIGVuZHBvaW50LiBUaGlzIGNhdXNlc1xuICAgICAgICAgICAgLy8gbmV3IHVwbG9hZCBvZiB0aGUgc2FtZSBmaWxlIG11c3QgYmUgdHJlYXRlZCBhcyBhIGRpZmZlcmVudCBmaWxlLlxuICAgICAgICAgICAgU3RvcmFnZS5yZW1vdmVJdGVtKF90aGlzNC5fZmluZ2VycHJpbnQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFlheSwgZmluYWxseSBkb25lIDopXG4gICAgICAgICAgX3RoaXM0Ll9lbWl0U3VjY2VzcygpO1xuICAgICAgICAgIF90aGlzNC5fc291cmNlLmNsb3NlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXM0Ll9zdGFydFVwbG9hZCgpO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIC8vIERvbid0IGVtaXQgYW4gZXJyb3IgaWYgdGhlIHVwbG9hZCB3YXMgYWJvcnRlZCBtYW51YWxseVxuICAgICAgICBpZiAoX3RoaXM0Ll9hYm9ydGVkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX3RoaXM0Ll9lbWl0WGhyRXJyb3IoeGhyLCBuZXcgRXJyb3IoXCJ0dXM6IGZhaWxlZCB0byB1cGxvYWQgY2h1bmsgYXQgb2Zmc2V0IFwiICsgX3RoaXM0Ll9vZmZzZXQpLCBlcnIpO1xuICAgICAgfTtcblxuICAgICAgLy8gVGVzdCBzdXBwb3J0IGZvciBwcm9ncmVzcyBldmVudHMgYmVmb3JlIGF0dGFjaGluZyBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgaWYgKFwidXBsb2FkXCIgaW4geGhyKSB7XG4gICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgaWYgKCFlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBfdGhpczQuX2VtaXRQcm9ncmVzcyhzdGFydCArIGUubG9hZGVkLCBfdGhpczQuX3NpemUpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9zZXR1cFhIUih4aHIpO1xuXG4gICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlVwbG9hZC1PZmZzZXRcIiwgdGhpcy5fb2Zmc2V0KTtcbiAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vb2Zmc2V0K29jdGV0LXN0cmVhbVwiKTtcblxuICAgICAgdmFyIHN0YXJ0ID0gdGhpcy5fb2Zmc2V0O1xuICAgICAgdmFyIGVuZCA9IHRoaXMuX29mZnNldCArIHRoaXMub3B0aW9ucy5jaHVua1NpemU7XG5cbiAgICAgIC8vIFRoZSBzcGVjaWZpZWQgY2h1bmtTaXplIG1heSBiZSBJbmZpbml0eSBvciB0aGUgY2FsY2x1YXRlZCBlbmQgcG9zaXRpb25cbiAgICAgIC8vIG1heSBleGNlZWQgdGhlIGZpbGUncyBzaXplLiBJbiBib3RoIGNhc2VzLCB3ZSBsaW1pdCB0aGUgZW5kIHBvc2l0aW9uIHRvXG4gICAgICAvLyB0aGUgaW5wdXQncyB0b3RhbCBzaXplIGZvciBzaW1wbGVyIGNhbGN1bGF0aW9ucyBhbmQgY29ycmVjdG5lc3MuXG4gICAgICBpZiAoZW5kID09PSBJbmZpbml0eSB8fCBlbmQgPiB0aGlzLl9zaXplKSB7XG4gICAgICAgIGVuZCA9IHRoaXMuX3NpemU7XG4gICAgICB9XG5cbiAgICAgIHhoci5zZW5kKHRoaXMuX3NvdXJjZS5zbGljZShzdGFydCwgZW5kKSk7XG5cbiAgICAgIC8vIEVtaXQgYW4gcHJvZ3Jlc3MgZXZlbnQgd2hlbiBhIG5ldyBjaHVuayBiZWdpbnMgYmVpbmcgdXBsb2FkZWQuXG4gICAgICB0aGlzLl9lbWl0UHJvZ3Jlc3ModGhpcy5fb2Zmc2V0LCB0aGlzLl9zaXplKTtcbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gVXBsb2FkO1xufSgpO1xuXG5mdW5jdGlvbiBlbmNvZGVNZXRhZGF0YShtZXRhZGF0YSkge1xuICBpZiAoIUJhc2U2NC5pc1N1cHBvcnRlZCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgdmFyIGVuY29kZWQgPSBbXTtcblxuICBmb3IgKHZhciBrZXkgaW4gbWV0YWRhdGEpIHtcbiAgICBlbmNvZGVkLnB1c2goa2V5ICsgXCIgXCIgKyBCYXNlNjQuZW5jb2RlKG1ldGFkYXRhW2tleV0pKTtcbiAgfVxuXG4gIHJldHVybiBlbmNvZGVkLmpvaW4oXCIsXCIpO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gc3RhdHVzIGlzIGluIHRoZSByYW5nZSBvZiB0aGUgZXhwZWN0ZWQgY2F0ZWdvcnkuXG4gKiBGb3IgZXhhbXBsZSwgb25seSBhIHN0YXR1cyBiZXR3ZWVuIDIwMCBhbmQgMjk5IHdpbGwgc2F0aXNmeSB0aGUgY2F0ZWdvcnkgMjAwLlxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBpblN0YXR1c0NhdGVnb3J5KHN0YXR1cywgY2F0ZWdvcnkpIHtcbiAgcmV0dXJuIHN0YXR1cyA+PSBjYXRlZ29yeSAmJiBzdGF0dXMgPCBjYXRlZ29yeSArIDEwMDtcbn1cblxuVXBsb2FkLmRlZmF1bHRPcHRpb25zID0gZGVmYXVsdE9wdGlvbnM7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IFVwbG9hZDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciByZXF1aXJlZCA9IHJlcXVpcmUoJ3JlcXVpcmVzLXBvcnQnKVxuICAsIHFzID0gcmVxdWlyZSgncXVlcnlzdHJpbmdpZnknKVxuICAsIHByb3RvY29scmUgPSAvXihbYS16XVthLXowLTkuKy1dKjopPyhcXC9cXC8pPyhbXFxTXFxzXSopL2lcbiAgLCBzbGFzaGVzID0gL15bQS1aYS16XVtBLVphLXowLTkrLS5dKjpcXC9cXC8vO1xuXG4vKipcbiAqIFRoZXNlIGFyZSB0aGUgcGFyc2UgcnVsZXMgZm9yIHRoZSBVUkwgcGFyc2VyLCBpdCBpbmZvcm1zIHRoZSBwYXJzZXJcbiAqIGFib3V0OlxuICpcbiAqIDAuIFRoZSBjaGFyIGl0IE5lZWRzIHRvIHBhcnNlLCBpZiBpdCdzIGEgc3RyaW5nIGl0IHNob3VsZCBiZSBkb25lIHVzaW5nXG4gKiAgICBpbmRleE9mLCBSZWdFeHAgdXNpbmcgZXhlYyBhbmQgTmFOIG1lYW5zIHNldCBhcyBjdXJyZW50IHZhbHVlLlxuICogMS4gVGhlIHByb3BlcnR5IHdlIHNob3VsZCBzZXQgd2hlbiBwYXJzaW5nIHRoaXMgdmFsdWUuXG4gKiAyLiBJbmRpY2F0aW9uIGlmIGl0J3MgYmFja3dhcmRzIG9yIGZvcndhcmQgcGFyc2luZywgd2hlbiBzZXQgYXMgbnVtYmVyIGl0J3NcbiAqICAgIHRoZSB2YWx1ZSBvZiBleHRyYSBjaGFycyB0aGF0IHNob3VsZCBiZSBzcGxpdCBvZmYuXG4gKiAzLiBJbmhlcml0IGZyb20gbG9jYXRpb24gaWYgbm9uIGV4aXN0aW5nIGluIHRoZSBwYXJzZXIuXG4gKiA0LiBgdG9Mb3dlckNhc2VgIHRoZSByZXN1bHRpbmcgdmFsdWUuXG4gKi9cbnZhciBydWxlcyA9IFtcbiAgWycjJywgJ2hhc2gnXSwgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGZyb20gdGhlIGJhY2suXG4gIFsnPycsICdxdWVyeSddLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBmcm9tIHRoZSBiYWNrLlxuICBmdW5jdGlvbiBzYW5pdGl6ZShhZGRyZXNzKSB7ICAgICAgICAgIC8vIFNhbml0aXplIHdoYXQgaXMgbGVmdCBvZiB0aGUgYWRkcmVzc1xuICAgIHJldHVybiBhZGRyZXNzLnJlcGxhY2UoJ1xcXFwnLCAnLycpO1xuICB9LFxuICBbJy8nLCAncGF0aG5hbWUnXSwgICAgICAgICAgICAgICAgICAgIC8vIEV4dHJhY3QgZnJvbSB0aGUgYmFjay5cbiAgWydAJywgJ2F1dGgnLCAxXSwgICAgICAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGZyb20gdGhlIGZyb250LlxuICBbTmFOLCAnaG9zdCcsIHVuZGVmaW5lZCwgMSwgMV0sICAgICAgIC8vIFNldCBsZWZ0IG92ZXIgdmFsdWUuXG4gIFsvOihcXGQrKSQvLCAncG9ydCcsIHVuZGVmaW5lZCwgMV0sICAgIC8vIFJlZ0V4cCB0aGUgYmFjay5cbiAgW05hTiwgJ2hvc3RuYW1lJywgdW5kZWZpbmVkLCAxLCAxXSAgICAvLyBTZXQgbGVmdCBvdmVyLlxuXTtcblxuLyoqXG4gKiBUaGVzZSBwcm9wZXJ0aWVzIHNob3VsZCBub3QgYmUgY29waWVkIG9yIGluaGVyaXRlZCBmcm9tLiBUaGlzIGlzIG9ubHkgbmVlZGVkXG4gKiBmb3IgYWxsIG5vbiBibG9iIFVSTCdzIGFzIGEgYmxvYiBVUkwgZG9lcyBub3QgaW5jbHVkZSBhIGhhc2gsIG9ubHkgdGhlXG4gKiBvcmlnaW4uXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbnZhciBpZ25vcmUgPSB7IGhhc2g6IDEsIHF1ZXJ5OiAxIH07XG5cbi8qKlxuICogVGhlIGxvY2F0aW9uIG9iamVjdCBkaWZmZXJzIHdoZW4geW91ciBjb2RlIGlzIGxvYWRlZCB0aHJvdWdoIGEgbm9ybWFsIHBhZ2UsXG4gKiBXb3JrZXIgb3IgdGhyb3VnaCBhIHdvcmtlciB1c2luZyBhIGJsb2IuIEFuZCB3aXRoIHRoZSBibG9iYmxlIGJlZ2lucyB0aGVcbiAqIHRyb3VibGUgYXMgdGhlIGxvY2F0aW9uIG9iamVjdCB3aWxsIGNvbnRhaW4gdGhlIFVSTCBvZiB0aGUgYmxvYiwgbm90IHRoZVxuICogbG9jYXRpb24gb2YgdGhlIHBhZ2Ugd2hlcmUgb3VyIGNvZGUgaXMgbG9hZGVkIGluLiBUaGUgYWN0dWFsIG9yaWdpbiBpc1xuICogZW5jb2RlZCBpbiB0aGUgYHBhdGhuYW1lYCBzbyB3ZSBjYW4gdGhhbmtmdWxseSBnZW5lcmF0ZSBhIGdvb2QgXCJkZWZhdWx0XCJcbiAqIGxvY2F0aW9uIGZyb20gaXQgc28gd2UgY2FuIGdlbmVyYXRlIHByb3BlciByZWxhdGl2ZSBVUkwncyBhZ2Fpbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IGxvYyBPcHRpb25hbCBkZWZhdWx0IGxvY2F0aW9uIG9iamVjdC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IGxvbGNhdGlvbiBvYmplY3QuXG4gKiBAcHVibGljXG4gKi9cbmZ1bmN0aW9uIGxvbGNhdGlvbihsb2MpIHtcbiAgdmFyIGdsb2JhbFZhcjtcblxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIGdsb2JhbFZhciA9IHdpbmRvdztcbiAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIGdsb2JhbFZhciA9IGdsb2JhbDtcbiAgZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSBnbG9iYWxWYXIgPSBzZWxmO1xuICBlbHNlIGdsb2JhbFZhciA9IHt9O1xuXG4gIHZhciBsb2NhdGlvbiA9IGdsb2JhbFZhci5sb2NhdGlvbiB8fCB7fTtcbiAgbG9jID0gbG9jIHx8IGxvY2F0aW9uO1xuXG4gIHZhciBmaW5hbGRlc3RpbmF0aW9uID0ge31cbiAgICAsIHR5cGUgPSB0eXBlb2YgbG9jXG4gICAgLCBrZXk7XG5cbiAgaWYgKCdibG9iOicgPT09IGxvYy5wcm90b2NvbCkge1xuICAgIGZpbmFsZGVzdGluYXRpb24gPSBuZXcgVXJsKHVuZXNjYXBlKGxvYy5wYXRobmFtZSksIHt9KTtcbiAgfSBlbHNlIGlmICgnc3RyaW5nJyA9PT0gdHlwZSkge1xuICAgIGZpbmFsZGVzdGluYXRpb24gPSBuZXcgVXJsKGxvYywge30pO1xuICAgIGZvciAoa2V5IGluIGlnbm9yZSkgZGVsZXRlIGZpbmFsZGVzdGluYXRpb25ba2V5XTtcbiAgfSBlbHNlIGlmICgnb2JqZWN0JyA9PT0gdHlwZSkge1xuICAgIGZvciAoa2V5IGluIGxvYykge1xuICAgICAgaWYgKGtleSBpbiBpZ25vcmUpIGNvbnRpbnVlO1xuICAgICAgZmluYWxkZXN0aW5hdGlvbltrZXldID0gbG9jW2tleV07XG4gICAgfVxuXG4gICAgaWYgKGZpbmFsZGVzdGluYXRpb24uc2xhc2hlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmaW5hbGRlc3RpbmF0aW9uLnNsYXNoZXMgPSBzbGFzaGVzLnRlc3QobG9jLmhyZWYpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmaW5hbGRlc3RpbmF0aW9uO1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIFByb3RvY29sRXh0cmFjdFxuICogQHR5cGUgT2JqZWN0XG4gKiBAcHJvcGVydHkge1N0cmluZ30gcHJvdG9jb2wgUHJvdG9jb2wgbWF0Y2hlZCBpbiB0aGUgVVJMLCBpbiBsb3dlcmNhc2UuXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IHNsYXNoZXMgYHRydWVgIGlmIHByb3RvY29sIGlzIGZvbGxvd2VkIGJ5IFwiLy9cIiwgZWxzZSBgZmFsc2VgLlxuICogQHByb3BlcnR5IHtTdHJpbmd9IHJlc3QgUmVzdCBvZiB0aGUgVVJMIHRoYXQgaXMgbm90IHBhcnQgb2YgdGhlIHByb3RvY29sLlxuICovXG5cbi8qKlxuICogRXh0cmFjdCBwcm90b2NvbCBpbmZvcm1hdGlvbiBmcm9tIGEgVVJMIHdpdGgvd2l0aG91dCBkb3VibGUgc2xhc2ggKFwiLy9cIikuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFkZHJlc3MgVVJMIHdlIHdhbnQgdG8gZXh0cmFjdCBmcm9tLlxuICogQHJldHVybiB7UHJvdG9jb2xFeHRyYWN0fSBFeHRyYWN0ZWQgaW5mb3JtYXRpb24uXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBleHRyYWN0UHJvdG9jb2woYWRkcmVzcykge1xuICB2YXIgbWF0Y2ggPSBwcm90b2NvbHJlLmV4ZWMoYWRkcmVzcyk7XG5cbiAgcmV0dXJuIHtcbiAgICBwcm90b2NvbDogbWF0Y2hbMV0gPyBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpIDogJycsXG4gICAgc2xhc2hlczogISFtYXRjaFsyXSxcbiAgICByZXN0OiBtYXRjaFszXVxuICB9O1xufVxuXG4vKipcbiAqIFJlc29sdmUgYSByZWxhdGl2ZSBVUkwgcGF0aG5hbWUgYWdhaW5zdCBhIGJhc2UgVVJMIHBhdGhuYW1lLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSByZWxhdGl2ZSBQYXRobmFtZSBvZiB0aGUgcmVsYXRpdmUgVVJMLlxuICogQHBhcmFtIHtTdHJpbmd9IGJhc2UgUGF0aG5hbWUgb2YgdGhlIGJhc2UgVVJMLlxuICogQHJldHVybiB7U3RyaW5nfSBSZXNvbHZlZCBwYXRobmFtZS5cbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmUocmVsYXRpdmUsIGJhc2UpIHtcbiAgdmFyIHBhdGggPSAoYmFzZSB8fCAnLycpLnNwbGl0KCcvJykuc2xpY2UoMCwgLTEpLmNvbmNhdChyZWxhdGl2ZS5zcGxpdCgnLycpKVxuICAgICwgaSA9IHBhdGgubGVuZ3RoXG4gICAgLCBsYXN0ID0gcGF0aFtpIC0gMV1cbiAgICAsIHVuc2hpZnQgPSBmYWxzZVxuICAgICwgdXAgPSAwO1xuXG4gIHdoaWxlIChpLS0pIHtcbiAgICBpZiAocGF0aFtpXSA9PT0gJy4nKSB7XG4gICAgICBwYXRoLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKHBhdGhbaV0gPT09ICcuLicpIHtcbiAgICAgIHBhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBpZiAoaSA9PT0gMCkgdW5zaGlmdCA9IHRydWU7XG4gICAgICBwYXRoLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgaWYgKHVuc2hpZnQpIHBhdGgudW5zaGlmdCgnJyk7XG4gIGlmIChsYXN0ID09PSAnLicgfHwgbGFzdCA9PT0gJy4uJykgcGF0aC5wdXNoKCcnKTtcblxuICByZXR1cm4gcGF0aC5qb2luKCcvJyk7XG59XG5cbi8qKlxuICogVGhlIGFjdHVhbCBVUkwgaW5zdGFuY2UuIEluc3RlYWQgb2YgcmV0dXJuaW5nIGFuIG9iamVjdCB3ZSd2ZSBvcHRlZC1pbiB0b1xuICogY3JlYXRlIGFuIGFjdHVhbCBjb25zdHJ1Y3RvciBhcyBpdCdzIG11Y2ggbW9yZSBtZW1vcnkgZWZmaWNpZW50IGFuZFxuICogZmFzdGVyIGFuZCBpdCBwbGVhc2VzIG15IE9DRC5cbiAqXG4gKiBJdCBpcyB3b3J0aCBub3RpbmcgdGhhdCB3ZSBzaG91bGQgbm90IHVzZSBgVVJMYCBhcyBjbGFzcyBuYW1lIHRvIHByZXZlbnRcbiAqIGNsYXNoZXMgd2l0aCB0aGUgZ2xvYmFsIFVSTCBpbnN0YW5jZSB0aGF0IGdvdCBpbnRyb2R1Y2VkIGluIGJyb3dzZXJzLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtTdHJpbmd9IGFkZHJlc3MgVVJMIHdlIHdhbnQgdG8gcGFyc2UuXG4gKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IFtsb2NhdGlvbl0gTG9jYXRpb24gZGVmYXVsdHMgZm9yIHJlbGF0aXZlIHBhdGhzLlxuICogQHBhcmFtIHtCb29sZWFufEZ1bmN0aW9ufSBbcGFyc2VyXSBQYXJzZXIgZm9yIHRoZSBxdWVyeSBzdHJpbmcuXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBVcmwoYWRkcmVzcywgbG9jYXRpb24sIHBhcnNlcikge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVXJsKSkge1xuICAgIHJldHVybiBuZXcgVXJsKGFkZHJlc3MsIGxvY2F0aW9uLCBwYXJzZXIpO1xuICB9XG5cbiAgdmFyIHJlbGF0aXZlLCBleHRyYWN0ZWQsIHBhcnNlLCBpbnN0cnVjdGlvbiwgaW5kZXgsIGtleVxuICAgICwgaW5zdHJ1Y3Rpb25zID0gcnVsZXMuc2xpY2UoKVxuICAgICwgdHlwZSA9IHR5cGVvZiBsb2NhdGlvblxuICAgICwgdXJsID0gdGhpc1xuICAgICwgaSA9IDA7XG5cbiAgLy9cbiAgLy8gVGhlIGZvbGxvd2luZyBpZiBzdGF0ZW1lbnRzIGFsbG93cyB0aGlzIG1vZHVsZSB0d28gaGF2ZSBjb21wYXRpYmlsaXR5IHdpdGhcbiAgLy8gMiBkaWZmZXJlbnQgQVBJOlxuICAvL1xuICAvLyAxLiBOb2RlLmpzJ3MgYHVybC5wYXJzZWAgYXBpIHdoaWNoIGFjY2VwdHMgYSBVUkwsIGJvb2xlYW4gYXMgYXJndW1lbnRzXG4gIC8vICAgIHdoZXJlIHRoZSBib29sZWFuIGluZGljYXRlcyB0aGF0IHRoZSBxdWVyeSBzdHJpbmcgc2hvdWxkIGFsc28gYmUgcGFyc2VkLlxuICAvL1xuICAvLyAyLiBUaGUgYFVSTGAgaW50ZXJmYWNlIG9mIHRoZSBicm93c2VyIHdoaWNoIGFjY2VwdHMgYSBVUkwsIG9iamVjdCBhc1xuICAvLyAgICBhcmd1bWVudHMuIFRoZSBzdXBwbGllZCBvYmplY3Qgd2lsbCBiZSB1c2VkIGFzIGRlZmF1bHQgdmFsdWVzIC8gZmFsbC1iYWNrXG4gIC8vICAgIGZvciByZWxhdGl2ZSBwYXRocy5cbiAgLy9cbiAgaWYgKCdvYmplY3QnICE9PSB0eXBlICYmICdzdHJpbmcnICE9PSB0eXBlKSB7XG4gICAgcGFyc2VyID0gbG9jYXRpb247XG4gICAgbG9jYXRpb24gPSBudWxsO1xuICB9XG5cbiAgaWYgKHBhcnNlciAmJiAnZnVuY3Rpb24nICE9PSB0eXBlb2YgcGFyc2VyKSBwYXJzZXIgPSBxcy5wYXJzZTtcblxuICBsb2NhdGlvbiA9IGxvbGNhdGlvbihsb2NhdGlvbik7XG5cbiAgLy9cbiAgLy8gRXh0cmFjdCBwcm90b2NvbCBpbmZvcm1hdGlvbiBiZWZvcmUgcnVubmluZyB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAvL1xuICBleHRyYWN0ZWQgPSBleHRyYWN0UHJvdG9jb2woYWRkcmVzcyB8fCAnJyk7XG4gIHJlbGF0aXZlID0gIWV4dHJhY3RlZC5wcm90b2NvbCAmJiAhZXh0cmFjdGVkLnNsYXNoZXM7XG4gIHVybC5zbGFzaGVzID0gZXh0cmFjdGVkLnNsYXNoZXMgfHwgcmVsYXRpdmUgJiYgbG9jYXRpb24uc2xhc2hlcztcbiAgdXJsLnByb3RvY29sID0gZXh0cmFjdGVkLnByb3RvY29sIHx8IGxvY2F0aW9uLnByb3RvY29sIHx8ICcnO1xuICBhZGRyZXNzID0gZXh0cmFjdGVkLnJlc3Q7XG5cbiAgLy9cbiAgLy8gV2hlbiB0aGUgYXV0aG9yaXR5IGNvbXBvbmVudCBpcyBhYnNlbnQgdGhlIFVSTCBzdGFydHMgd2l0aCBhIHBhdGhcbiAgLy8gY29tcG9uZW50LlxuICAvL1xuICBpZiAoIWV4dHJhY3RlZC5zbGFzaGVzKSBpbnN0cnVjdGlvbnNbM10gPSBbLyguKikvLCAncGF0aG5hbWUnXTtcblxuICBmb3IgKDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGluc3RydWN0aW9uID0gaW5zdHJ1Y3Rpb25zW2ldO1xuXG4gICAgaWYgKHR5cGVvZiBpbnN0cnVjdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYWRkcmVzcyA9IGluc3RydWN0aW9uKGFkZHJlc3MpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcGFyc2UgPSBpbnN0cnVjdGlvblswXTtcbiAgICBrZXkgPSBpbnN0cnVjdGlvblsxXTtcblxuICAgIGlmIChwYXJzZSAhPT0gcGFyc2UpIHtcbiAgICAgIHVybFtrZXldID0gYWRkcmVzcztcbiAgICB9IGVsc2UgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgcGFyc2UpIHtcbiAgICAgIGlmICh+KGluZGV4ID0gYWRkcmVzcy5pbmRleE9mKHBhcnNlKSkpIHtcbiAgICAgICAgaWYgKCdudW1iZXInID09PSB0eXBlb2YgaW5zdHJ1Y3Rpb25bMl0pIHtcbiAgICAgICAgICB1cmxba2V5XSA9IGFkZHJlc3Muc2xpY2UoMCwgaW5kZXgpO1xuICAgICAgICAgIGFkZHJlc3MgPSBhZGRyZXNzLnNsaWNlKGluZGV4ICsgaW5zdHJ1Y3Rpb25bMl0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVybFtrZXldID0gYWRkcmVzcy5zbGljZShpbmRleCk7XG4gICAgICAgICAgYWRkcmVzcyA9IGFkZHJlc3Muc2xpY2UoMCwgaW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICgoaW5kZXggPSBwYXJzZS5leGVjKGFkZHJlc3MpKSkge1xuICAgICAgdXJsW2tleV0gPSBpbmRleFsxXTtcbiAgICAgIGFkZHJlc3MgPSBhZGRyZXNzLnNsaWNlKDAsIGluZGV4LmluZGV4KTtcbiAgICB9XG5cbiAgICB1cmxba2V5XSA9IHVybFtrZXldIHx8IChcbiAgICAgIHJlbGF0aXZlICYmIGluc3RydWN0aW9uWzNdID8gbG9jYXRpb25ba2V5XSB8fCAnJyA6ICcnXG4gICAgKTtcblxuICAgIC8vXG4gICAgLy8gSG9zdG5hbWUsIGhvc3QgYW5kIHByb3RvY29sIHNob3VsZCBiZSBsb3dlcmNhc2VkIHNvIHRoZXkgY2FuIGJlIHVzZWQgdG9cbiAgICAvLyBjcmVhdGUgYSBwcm9wZXIgYG9yaWdpbmAuXG4gICAgLy9cbiAgICBpZiAoaW5zdHJ1Y3Rpb25bNF0pIHVybFtrZXldID0gdXJsW2tleV0udG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIC8vXG4gIC8vIEFsc28gcGFyc2UgdGhlIHN1cHBsaWVkIHF1ZXJ5IHN0cmluZyBpbiB0byBhbiBvYmplY3QuIElmIHdlJ3JlIHN1cHBsaWVkXG4gIC8vIHdpdGggYSBjdXN0b20gcGFyc2VyIGFzIGZ1bmN0aW9uIHVzZSB0aGF0IGluc3RlYWQgb2YgdGhlIGRlZmF1bHQgYnVpbGQtaW5cbiAgLy8gcGFyc2VyLlxuICAvL1xuICBpZiAocGFyc2VyKSB1cmwucXVlcnkgPSBwYXJzZXIodXJsLnF1ZXJ5KTtcblxuICAvL1xuICAvLyBJZiB0aGUgVVJMIGlzIHJlbGF0aXZlLCByZXNvbHZlIHRoZSBwYXRobmFtZSBhZ2FpbnN0IHRoZSBiYXNlIFVSTC5cbiAgLy9cbiAgaWYgKFxuICAgICAgcmVsYXRpdmVcbiAgICAmJiBsb2NhdGlvbi5zbGFzaGVzXG4gICAgJiYgdXJsLnBhdGhuYW1lLmNoYXJBdCgwKSAhPT0gJy8nXG4gICAgJiYgKHVybC5wYXRobmFtZSAhPT0gJycgfHwgbG9jYXRpb24ucGF0aG5hbWUgIT09ICcnKVxuICApIHtcbiAgICB1cmwucGF0aG5hbWUgPSByZXNvbHZlKHVybC5wYXRobmFtZSwgbG9jYXRpb24ucGF0aG5hbWUpO1xuICB9XG5cbiAgLy9cbiAgLy8gV2Ugc2hvdWxkIG5vdCBhZGQgcG9ydCBudW1iZXJzIGlmIHRoZXkgYXJlIGFscmVhZHkgdGhlIGRlZmF1bHQgcG9ydCBudW1iZXJcbiAgLy8gZm9yIGEgZ2l2ZW4gcHJvdG9jb2wuIEFzIHRoZSBob3N0IGFsc28gY29udGFpbnMgdGhlIHBvcnQgbnVtYmVyIHdlJ3JlIGdvaW5nXG4gIC8vIG92ZXJyaWRlIGl0IHdpdGggdGhlIGhvc3RuYW1lIHdoaWNoIGNvbnRhaW5zIG5vIHBvcnQgbnVtYmVyLlxuICAvL1xuICBpZiAoIXJlcXVpcmVkKHVybC5wb3J0LCB1cmwucHJvdG9jb2wpKSB7XG4gICAgdXJsLmhvc3QgPSB1cmwuaG9zdG5hbWU7XG4gICAgdXJsLnBvcnQgPSAnJztcbiAgfVxuXG4gIC8vXG4gIC8vIFBhcnNlIGRvd24gdGhlIGBhdXRoYCBmb3IgdGhlIHVzZXJuYW1lIGFuZCBwYXNzd29yZC5cbiAgLy9cbiAgdXJsLnVzZXJuYW1lID0gdXJsLnBhc3N3b3JkID0gJyc7XG4gIGlmICh1cmwuYXV0aCkge1xuICAgIGluc3RydWN0aW9uID0gdXJsLmF1dGguc3BsaXQoJzonKTtcbiAgICB1cmwudXNlcm5hbWUgPSBpbnN0cnVjdGlvblswXSB8fCAnJztcbiAgICB1cmwucGFzc3dvcmQgPSBpbnN0cnVjdGlvblsxXSB8fCAnJztcbiAgfVxuXG4gIHVybC5vcmlnaW4gPSB1cmwucHJvdG9jb2wgJiYgdXJsLmhvc3QgJiYgdXJsLnByb3RvY29sICE9PSAnZmlsZTonXG4gICAgPyB1cmwucHJvdG9jb2wgKycvLycrIHVybC5ob3N0XG4gICAgOiAnbnVsbCc7XG5cbiAgLy9cbiAgLy8gVGhlIGhyZWYgaXMganVzdCB0aGUgY29tcGlsZWQgcmVzdWx0LlxuICAvL1xuICB1cmwuaHJlZiA9IHVybC50b1N0cmluZygpO1xufVxuXG4vKipcbiAqIFRoaXMgaXMgY29udmVuaWVuY2UgbWV0aG9kIGZvciBjaGFuZ2luZyBwcm9wZXJ0aWVzIGluIHRoZSBVUkwgaW5zdGFuY2UgdG9cbiAqIGluc3VyZSB0aGF0IHRoZXkgYWxsIHByb3BhZ2F0ZSBjb3JyZWN0bHkuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhcnQgICAgICAgICAgUHJvcGVydHkgd2UgbmVlZCB0byBhZGp1c3QuXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSAgICAgICAgICBUaGUgbmV3bHkgYXNzaWduZWQgdmFsdWUuXG4gKiBAcGFyYW0ge0Jvb2xlYW58RnVuY3Rpb259IGZuICBXaGVuIHNldHRpbmcgdGhlIHF1ZXJ5LCBpdCB3aWxsIGJlIHRoZSBmdW5jdGlvblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlZCB0byBwYXJzZSB0aGUgcXVlcnkuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXaGVuIHNldHRpbmcgdGhlIHByb3RvY29sLCBkb3VibGUgc2xhc2ggd2lsbCBiZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZCBmcm9tIHRoZSBmaW5hbCB1cmwgaWYgaXQgaXMgdHJ1ZS5cbiAqIEByZXR1cm5zIHtVUkx9IFVSTCBpbnN0YW5jZSBmb3IgY2hhaW5pbmcuXG4gKiBAcHVibGljXG4gKi9cbmZ1bmN0aW9uIHNldChwYXJ0LCB2YWx1ZSwgZm4pIHtcbiAgdmFyIHVybCA9IHRoaXM7XG5cbiAgc3dpdGNoIChwYXJ0KSB7XG4gICAgY2FzZSAncXVlcnknOlxuICAgICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgdmFsdWUgJiYgdmFsdWUubGVuZ3RoKSB7XG4gICAgICAgIHZhbHVlID0gKGZuIHx8IHFzLnBhcnNlKSh2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIHVybFtwYXJ0XSA9IHZhbHVlO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlICdwb3J0JzpcbiAgICAgIHVybFtwYXJ0XSA9IHZhbHVlO1xuXG4gICAgICBpZiAoIXJlcXVpcmVkKHZhbHVlLCB1cmwucHJvdG9jb2wpKSB7XG4gICAgICAgIHVybC5ob3N0ID0gdXJsLmhvc3RuYW1lO1xuICAgICAgICB1cmxbcGFydF0gPSAnJztcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUpIHtcbiAgICAgICAgdXJsLmhvc3QgPSB1cmwuaG9zdG5hbWUgKyc6JysgdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAnaG9zdG5hbWUnOlxuICAgICAgdXJsW3BhcnRdID0gdmFsdWU7XG5cbiAgICAgIGlmICh1cmwucG9ydCkgdmFsdWUgKz0gJzonKyB1cmwucG9ydDtcbiAgICAgIHVybC5ob3N0ID0gdmFsdWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ2hvc3QnOlxuICAgICAgdXJsW3BhcnRdID0gdmFsdWU7XG5cbiAgICAgIGlmICgvOlxcZCskLy50ZXN0KHZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnNwbGl0KCc6Jyk7XG4gICAgICAgIHVybC5wb3J0ID0gdmFsdWUucG9wKCk7XG4gICAgICAgIHVybC5ob3N0bmFtZSA9IHZhbHVlLmpvaW4oJzonKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVybC5ob3N0bmFtZSA9IHZhbHVlO1xuICAgICAgICB1cmwucG9ydCA9ICcnO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcblxuICAgIGNhc2UgJ3Byb3RvY29sJzpcbiAgICAgIHVybC5wcm90b2NvbCA9IHZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgICB1cmwuc2xhc2hlcyA9ICFmbjtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAncGF0aG5hbWUnOlxuICAgIGNhc2UgJ2hhc2gnOlxuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHZhciBjaGFyID0gcGFydCA9PT0gJ3BhdGhuYW1lJyA/ICcvJyA6ICcjJztcbiAgICAgICAgdXJsW3BhcnRdID0gdmFsdWUuY2hhckF0KDApICE9PSBjaGFyID8gY2hhciArIHZhbHVlIDogdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmxbcGFydF0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHVybFtwYXJ0XSA9IHZhbHVlO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpbnMgPSBydWxlc1tpXTtcblxuICAgIGlmIChpbnNbNF0pIHVybFtpbnNbMV1dID0gdXJsW2luc1sxXV0udG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIHVybC5vcmlnaW4gPSB1cmwucHJvdG9jb2wgJiYgdXJsLmhvc3QgJiYgdXJsLnByb3RvY29sICE9PSAnZmlsZTonXG4gICAgPyB1cmwucHJvdG9jb2wgKycvLycrIHVybC5ob3N0XG4gICAgOiAnbnVsbCc7XG5cbiAgdXJsLmhyZWYgPSB1cmwudG9TdHJpbmcoKTtcblxuICByZXR1cm4gdXJsO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybSB0aGUgcHJvcGVydGllcyBiYWNrIGluIHRvIGEgdmFsaWQgYW5kIGZ1bGwgVVJMIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdHJpbmdpZnkgT3B0aW9uYWwgcXVlcnkgc3RyaW5naWZ5IGZ1bmN0aW9uLlxuICogQHJldHVybnMge1N0cmluZ30gQ29tcGlsZWQgdmVyc2lvbiBvZiB0aGUgVVJMLlxuICogQHB1YmxpY1xuICovXG5mdW5jdGlvbiB0b1N0cmluZyhzdHJpbmdpZnkpIHtcbiAgaWYgKCFzdHJpbmdpZnkgfHwgJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIHN0cmluZ2lmeSkgc3RyaW5naWZ5ID0gcXMuc3RyaW5naWZ5O1xuXG4gIHZhciBxdWVyeVxuICAgICwgdXJsID0gdGhpc1xuICAgICwgcHJvdG9jb2wgPSB1cmwucHJvdG9jb2w7XG5cbiAgaWYgKHByb3RvY29sICYmIHByb3RvY29sLmNoYXJBdChwcm90b2NvbC5sZW5ndGggLSAxKSAhPT0gJzonKSBwcm90b2NvbCArPSAnOic7XG5cbiAgdmFyIHJlc3VsdCA9IHByb3RvY29sICsgKHVybC5zbGFzaGVzID8gJy8vJyA6ICcnKTtcblxuICBpZiAodXJsLnVzZXJuYW1lKSB7XG4gICAgcmVzdWx0ICs9IHVybC51c2VybmFtZTtcbiAgICBpZiAodXJsLnBhc3N3b3JkKSByZXN1bHQgKz0gJzonKyB1cmwucGFzc3dvcmQ7XG4gICAgcmVzdWx0ICs9ICdAJztcbiAgfVxuXG4gIHJlc3VsdCArPSB1cmwuaG9zdCArIHVybC5wYXRobmFtZTtcblxuICBxdWVyeSA9ICdvYmplY3QnID09PSB0eXBlb2YgdXJsLnF1ZXJ5ID8gc3RyaW5naWZ5KHVybC5xdWVyeSkgOiB1cmwucXVlcnk7XG4gIGlmIChxdWVyeSkgcmVzdWx0ICs9ICc/JyAhPT0gcXVlcnkuY2hhckF0KDApID8gJz8nKyBxdWVyeSA6IHF1ZXJ5O1xuXG4gIGlmICh1cmwuaGFzaCkgcmVzdWx0ICs9IHVybC5oYXNoO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblVybC5wcm90b3R5cGUgPSB7IHNldDogc2V0LCB0b1N0cmluZzogdG9TdHJpbmcgfTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgVVJMIHBhcnNlciBhbmQgc29tZSBhZGRpdGlvbmFsIHByb3BlcnRpZXMgdGhhdCBtaWdodCBiZSB1c2VmdWwgZm9yXG4vLyBvdGhlcnMgb3IgdGVzdGluZy5cbi8vXG5VcmwuZXh0cmFjdFByb3RvY29sID0gZXh0cmFjdFByb3RvY29sO1xuVXJsLmxvY2F0aW9uID0gbG9sY2F0aW9uO1xuVXJsLnFzID0gcXM7XG5cbm1vZHVsZS5leHBvcnRzID0gVXJsO1xuIiwiLyoganNoaW50IG5vZGU6IHRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gICMgd2lsZGNhcmRcblxuICBWZXJ5IHNpbXBsZSB3aWxkY2FyZCBtYXRjaGluZywgd2hpY2ggaXMgZGVzaWduZWQgdG8gcHJvdmlkZSB0aGUgc2FtZVxuICBmdW5jdGlvbmFsaXR5IHRoYXQgaXMgZm91bmQgaW4gdGhlXG4gIFtldmVdKGh0dHBzOi8vZ2l0aHViLmNvbS9hZG9iZS13ZWJwbGF0Zm9ybS9ldmUpIGV2ZW50aW5nIGxpYnJhcnkuXG5cbiAgIyMgVXNhZ2VcblxuICBJdCB3b3JrcyB3aXRoIHN0cmluZ3M6XG5cbiAgPDw8IGV4YW1wbGVzL3N0cmluZ3MuanNcblxuICBBcnJheXM6XG5cbiAgPDw8IGV4YW1wbGVzL2FycmF5cy5qc1xuXG4gIE9iamVjdHMgKG1hdGNoaW5nIGFnYWluc3Qga2V5cyk6XG5cbiAgPDw8IGV4YW1wbGVzL29iamVjdHMuanNcblxuICBXaGlsZSB0aGUgbGlicmFyeSB3b3JrcyBpbiBOb2RlLCBpZiB5b3UgYXJlIGFyZSBsb29raW5nIGZvciBmaWxlLWJhc2VkXG4gIHdpbGRjYXJkIG1hdGNoaW5nIHRoZW4geW91IHNob3VsZCBoYXZlIGEgbG9vayBhdDpcblxuICA8aHR0cHM6Ly9naXRodWIuY29tL2lzYWFjcy9ub2RlLWdsb2I+XG4qKi9cblxuZnVuY3Rpb24gV2lsZGNhcmRNYXRjaGVyKHRleHQsIHNlcGFyYXRvcikge1xuICB0aGlzLnRleHQgPSB0ZXh0ID0gdGV4dCB8fCAnJztcbiAgdGhpcy5oYXNXaWxkID0gfnRleHQuaW5kZXhPZignKicpO1xuICB0aGlzLnNlcGFyYXRvciA9IHNlcGFyYXRvcjtcbiAgdGhpcy5wYXJ0cyA9IHRleHQuc3BsaXQoc2VwYXJhdG9yKTtcbn1cblxuV2lsZGNhcmRNYXRjaGVyLnByb3RvdHlwZS5tYXRjaCA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBtYXRjaGVzID0gdHJ1ZTtcbiAgdmFyIHBhcnRzID0gdGhpcy5wYXJ0cztcbiAgdmFyIGlpO1xuICB2YXIgcGFydHNDb3VudCA9IHBhcnRzLmxlbmd0aDtcbiAgdmFyIHRlc3RQYXJ0cztcblxuICBpZiAodHlwZW9mIGlucHV0ID09ICdzdHJpbmcnIHx8IGlucHV0IGluc3RhbmNlb2YgU3RyaW5nKSB7XG4gICAgaWYgKCF0aGlzLmhhc1dpbGQgJiYgdGhpcy50ZXh0ICE9IGlucHV0KSB7XG4gICAgICBtYXRjaGVzID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRlc3RQYXJ0cyA9IChpbnB1dCB8fCAnJykuc3BsaXQodGhpcy5zZXBhcmF0b3IpO1xuICAgICAgZm9yIChpaSA9IDA7IG1hdGNoZXMgJiYgaWkgPCBwYXJ0c0NvdW50OyBpaSsrKSB7XG4gICAgICAgIGlmIChwYXJ0c1tpaV0gPT09ICcqJykgIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIGlmIChpaSA8IHRlc3RQYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgICBtYXRjaGVzID0gcGFydHNbaWldID09PSB0ZXN0UGFydHNbaWldO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBtYXRjaGVzLCB0aGVuIHJldHVybiB0aGUgY29tcG9uZW50IHBhcnRzXG4gICAgICBtYXRjaGVzID0gbWF0Y2hlcyAmJiB0ZXN0UGFydHM7XG4gICAgfVxuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBpbnB1dC5zcGxpY2UgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG1hdGNoZXMgPSBbXTtcblxuICAgIGZvciAoaWkgPSBpbnB1dC5sZW5ndGg7IGlpLS07ICkge1xuICAgICAgaWYgKHRoaXMubWF0Y2goaW5wdXRbaWldKSkge1xuICAgICAgICBtYXRjaGVzW21hdGNoZXMubGVuZ3RoXSA9IGlucHV0W2lpXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSBpZiAodHlwZW9mIGlucHV0ID09ICdvYmplY3QnKSB7XG4gICAgbWF0Y2hlcyA9IHt9O1xuXG4gICAgZm9yICh2YXIga2V5IGluIGlucHV0KSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChrZXkpKSB7XG4gICAgICAgIG1hdGNoZXNba2V5XSA9IGlucHV0W2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1hdGNoZXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRleHQsIHRlc3QsIHNlcGFyYXRvcikge1xuICB2YXIgbWF0Y2hlciA9IG5ldyBXaWxkY2FyZE1hdGNoZXIodGV4dCwgc2VwYXJhdG9yIHx8IC9bXFwvXFwuXS8pO1xuICBpZiAodHlwZW9mIHRlc3QgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gbWF0Y2hlci5tYXRjaCh0ZXN0KTtcbiAgfVxuXG4gIHJldHVybiBtYXRjaGVyO1xufTtcbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBSZXF1ZXN0Q2xpZW50ID0gcmVxdWlyZSgnLi9SZXF1ZXN0Q2xpZW50JylcblxuY29uc3QgX2dldE5hbWUgPSAoaWQpID0+IHtcbiAgcmV0dXJuIGlkLnNwbGl0KCctJykubWFwKChzKSA9PiBzLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcy5zbGljZSgxKSkuam9pbignICcpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUHJvdmlkZXIgZXh0ZW5kcyBSZXF1ZXN0Q2xpZW50IHtcbiAgY29uc3RydWN0b3IgKHVwcHksIG9wdHMpIHtcbiAgICBzdXBlcih1cHB5LCBvcHRzKVxuICAgIHRoaXMucHJvdmlkZXIgPSBvcHRzLnByb3ZpZGVyXG4gICAgdGhpcy5pZCA9IHRoaXMucHJvdmlkZXJcbiAgICB0aGlzLmF1dGhQcm92aWRlciA9IG9wdHMuYXV0aFByb3ZpZGVyIHx8IHRoaXMucHJvdmlkZXJcbiAgICB0aGlzLm5hbWUgPSB0aGlzLm9wdHMubmFtZSB8fCBfZ2V0TmFtZSh0aGlzLmlkKVxuICAgIHRoaXMudG9rZW5LZXkgPSBgY29tcGFuaW9uLSR7dGhpcy5pZH0tYXV0aC10b2tlbmBcbiAgfVxuXG4gIGdldCBkZWZhdWx0SGVhZGVycyAoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHN1cGVyLmRlZmF1bHRIZWFkZXJzLCB7J3VwcHktYXV0aC10b2tlbic6IGxvY2FsU3RvcmFnZS5nZXRJdGVtKHRoaXMudG9rZW5LZXkpfSlcbiAgfVxuXG4gIC8vIEB0b2RvKGkub2xhcmV3YWp1KSBjb25zaWRlciB3aGV0aGVyIG9yIG5vdCB0aGlzIG1ldGhvZCBzaG91bGQgYmUgZXhwb3NlZFxuICBzZXRBdXRoVG9rZW4gKHRva2VuKSB7XG4gICAgLy8gQHRvZG8oaS5vbGFyZXdhanUpIGFkZCBmYWxsYmFjayBmb3IgT09NIHN0b3JhZ2VcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLnRva2VuS2V5LCB0b2tlbilcbiAgfVxuXG4gIGNoZWNrQXV0aCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KGAke3RoaXMuaWR9L2F1dGhvcml6ZWRgKVxuICAgICAgLnRoZW4oKHBheWxvYWQpID0+IHtcbiAgICAgICAgcmV0dXJuIHBheWxvYWQuYXV0aGVudGljYXRlZFxuICAgICAgfSlcbiAgfVxuXG4gIGF1dGhVcmwgKCkge1xuICAgIHJldHVybiBgJHt0aGlzLmhvc3RuYW1lfS8ke3RoaXMuaWR9L2Nvbm5lY3RgXG4gIH1cblxuICBmaWxlVXJsIChpZCkge1xuICAgIHJldHVybiBgJHt0aGlzLmhvc3RuYW1lfS8ke3RoaXMuaWR9L2dldC8ke2lkfWBcbiAgfVxuXG4gIGxpc3QgKGRpcmVjdG9yeSkge1xuICAgIHJldHVybiB0aGlzLmdldChgJHt0aGlzLmlkfS9saXN0LyR7ZGlyZWN0b3J5IHx8ICcnfWApXG4gIH1cblxuICBsb2dvdXQgKHJlZGlyZWN0ID0gbG9jYXRpb24uaHJlZikge1xuICAgIHJldHVybiB0aGlzLmdldChgJHt0aGlzLmlkfS9sb2dvdXQ/cmVkaXJlY3Q9JHtyZWRpcmVjdH1gKVxuICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLnRva2VuS2V5KVxuICAgICAgICByZXR1cm4gcmVzXG4gICAgICB9KVxuICB9XG5cbiAgc3RhdGljIGluaXRQbHVnaW4gKHBsdWdpbiwgb3B0cywgZGVmYXVsdE9wdHMpIHtcbiAgICBwbHVnaW4udHlwZSA9ICdhY3F1aXJlcidcbiAgICBwbHVnaW4uZmlsZXMgPSBbXVxuICAgIGlmIChkZWZhdWx0T3B0cykge1xuICAgICAgcGx1Z2luLm9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0cywgb3B0cylcbiAgICB9XG4gICAgaWYgKG9wdHMuc2VydmVyUGF0dGVybikge1xuICAgICAgY29uc3QgcGF0dGVybiA9IG9wdHMuc2VydmVyUGF0dGVyblxuICAgICAgLy8gdmFsaWRhdGUgc2VydmVyUGF0dGVybiBwYXJhbVxuICAgICAgaWYgKHR5cGVvZiBwYXR0ZXJuICE9PSAnc3RyaW5nJyAmJiAhQXJyYXkuaXNBcnJheShwYXR0ZXJuKSAmJiAhKHBhdHRlcm4gaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCR7cGx1Z2luLmlkfTogdGhlIG9wdGlvbiBcInNlcnZlclBhdHRlcm5cIiBtdXN0IGJlIG9uZSBvZiBzdHJpbmcsIEFycmF5LCBSZWdFeHBgKVxuICAgICAgfVxuICAgICAgcGx1Z2luLm9wdHMuc2VydmVyUGF0dGVybiA9IHBhdHRlcm5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZG9lcyBub3Qgc3RhcnQgd2l0aCBodHRwczovL1xuICAgICAgaWYgKC9eKD8haHR0cHM/OlxcL1xcLykuKiQvLnRlc3Qob3B0cy5zZXJ2ZXJVcmwpKSB7XG4gICAgICAgIHBsdWdpbi5vcHRzLnNlcnZlclBhdHRlcm4gPSBgJHtsb2NhdGlvbi5wcm90b2NvbH0vLyR7b3B0cy5zZXJ2ZXJVcmwucmVwbGFjZSgvXlxcL1xcLy8sICcnKX1gXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbHVnaW4ub3B0cy5zZXJ2ZXJQYXR0ZXJuID0gb3B0cy5zZXJ2ZXJVcmxcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG4vLyBSZW1vdmUgdGhlIHRyYWlsaW5nIHNsYXNoIHNvIHdlIGNhbiBhbHdheXMgc2FmZWx5IGFwcGVuZCAveHl6LlxuZnVuY3Rpb24gc3RyaXBTbGFzaCAodXJsKSB7XG4gIHJldHVybiB1cmwucmVwbGFjZSgvXFwvJC8sICcnKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlcXVlc3RDbGllbnQge1xuICBjb25zdHJ1Y3RvciAodXBweSwgb3B0cykge1xuICAgIHRoaXMudXBweSA9IHVwcHlcbiAgICB0aGlzLm9wdHMgPSBvcHRzXG4gICAgdGhpcy5vblJlY2VpdmVSZXNwb25zZSA9IHRoaXMub25SZWNlaXZlUmVzcG9uc2UuYmluZCh0aGlzKVxuICB9XG5cbiAgZ2V0IGhvc3RuYW1lICgpIHtcbiAgICBjb25zdCB7IGNvbXBhbmlvbiB9ID0gdGhpcy51cHB5LmdldFN0YXRlKClcbiAgICBjb25zdCBob3N0ID0gdGhpcy5vcHRzLnNlcnZlclVybFxuICAgIHJldHVybiBzdHJpcFNsYXNoKGNvbXBhbmlvbiAmJiBjb21wYW5pb25baG9zdF0gPyBjb21wYW5pb25baG9zdF0gOiBob3N0KVxuICB9XG5cbiAgZ2V0IGRlZmF1bHRIZWFkZXJzICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9XG4gIH1cblxuICBnZXQgaGVhZGVycyAoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZGVmYXVsdEhlYWRlcnMsIHRoaXMub3B0cy5zZXJ2ZXJIZWFkZXJzIHx8IHt9KVxuICB9XG5cbiAgb25SZWNlaXZlUmVzcG9uc2UgKHJlc3BvbnNlKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnVwcHkuZ2V0U3RhdGUoKVxuICAgIGNvbnN0IGNvbXBhbmlvbiA9IHN0YXRlLmNvbXBhbmlvbiB8fCB7fVxuICAgIGNvbnN0IGhvc3QgPSB0aGlzLm9wdHMuc2VydmVyVXJsXG4gICAgY29uc3QgaGVhZGVycyA9IHJlc3BvbnNlLmhlYWRlcnNcbiAgICAvLyBTdG9yZSB0aGUgc2VsZi1pZGVudGlmaWVkIGRvbWFpbiBuYW1lIGZvciB0aGUgQ29tcGFuaW9uIGluc3RhbmNlIHdlIGp1c3QgaGl0LlxuICAgIGlmIChoZWFkZXJzLmhhcygnaS1hbScpICYmIGhlYWRlcnMuZ2V0KCdpLWFtJykgIT09IGNvbXBhbmlvbltob3N0XSkge1xuICAgICAgdGhpcy51cHB5LnNldFN0YXRlKHtcbiAgICAgICAgY29tcGFuaW9uOiBPYmplY3QuYXNzaWduKHt9LCBjb21wYW5pb24sIHtcbiAgICAgICAgICBbaG9zdF06IGhlYWRlcnMuZ2V0KCdpLWFtJylcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgX2dldFVybCAodXJsKSB7XG4gICAgaWYgKC9eKGh0dHBzPzp8KVxcL1xcLy8udGVzdCh1cmwpKSB7XG4gICAgICByZXR1cm4gdXJsXG4gICAgfVxuICAgIHJldHVybiBgJHt0aGlzLmhvc3RuYW1lfS8ke3VybH1gXG4gIH1cblxuICBnZXQgKHBhdGgpIHtcbiAgICByZXR1cm4gZmV0Y2godGhpcy5fZ2V0VXJsKHBhdGgpLCB7XG4gICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgaGVhZGVyczogdGhpcy5oZWFkZXJzLFxuICAgICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbidcbiAgICB9KVxuICAgICAgLy8gQHRvZG8gdmFsaWRhdGUgcmVzcG9uc2Ugc3RhdHVzIGJlZm9yZSBjYWxsaW5nIGpzb25cbiAgICAgIC50aGVuKHRoaXMub25SZWNlaXZlUmVzcG9uc2UpXG4gICAgICAudGhlbigocmVzKSA9PiByZXMuanNvbigpKVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZ2V0ICR7dGhpcy5fZ2V0VXJsKHBhdGgpfS4gJHtlcnJ9YClcbiAgICAgIH0pXG4gIH1cblxuICBwb3N0IChwYXRoLCBkYXRhKSB7XG4gICAgcmV0dXJuIGZldGNoKHRoaXMuX2dldFVybChwYXRoKSwge1xuICAgICAgbWV0aG9kOiAncG9zdCcsXG4gICAgICBoZWFkZXJzOiB0aGlzLmhlYWRlcnMsXG4gICAgICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpXG4gICAgfSlcbiAgICAgIC50aGVuKHRoaXMub25SZWNlaXZlUmVzcG9uc2UpXG4gICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgIGlmIChyZXMuc3RhdHVzIDwgMjAwIHx8IHJlcy5zdGF0dXMgPiAzMDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBwb3N0ICR7dGhpcy5fZ2V0VXJsKHBhdGgpfS4gJHtyZXMuc3RhdHVzVGV4dH1gKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuanNvbigpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcG9zdCAke3RoaXMuX2dldFVybChwYXRoKX0uICR7ZXJyfWApXG4gICAgICB9KVxuICB9XG5cbiAgZGVsZXRlIChwYXRoLCBkYXRhKSB7XG4gICAgcmV0dXJuIGZldGNoKGAke3RoaXMuaG9zdG5hbWV9LyR7cGF0aH1gLCB7XG4gICAgICBtZXRob2Q6ICdkZWxldGUnLFxuICAgICAgaGVhZGVyczogdGhpcy5oZWFkZXJzLFxuICAgICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbicsXG4gICAgICBib2R5OiBkYXRhID8gSlNPTi5zdHJpbmdpZnkoZGF0YSkgOiBudWxsXG4gICAgfSlcbiAgICAgIC50aGVuKHRoaXMub25SZWNlaXZlUmVzcG9uc2UpXG4gICAgICAvLyBAdG9kbyB2YWxpZGF0ZSByZXNwb25zZSBzdGF0dXMgYmVmb3JlIGNhbGxpbmcganNvblxuICAgICAgLnRoZW4oKHJlcykgPT4gcmVzLmpzb24oKSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGRlbGV0ZSAke3RoaXMuX2dldFVybChwYXRoKX0uICR7ZXJyfWApXG4gICAgICB9KVxuICB9XG59XG4iLCJjb25zdCBlZSA9IHJlcXVpcmUoJ25hbWVzcGFjZS1lbWl0dGVyJylcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBVcHB5U29ja2V0IHtcbiAgY29uc3RydWN0b3IgKG9wdHMpIHtcbiAgICB0aGlzLnF1ZXVlZCA9IFtdXG4gICAgdGhpcy5pc09wZW4gPSBmYWxzZVxuICAgIHRoaXMuc29ja2V0ID0gbmV3IFdlYlNvY2tldChvcHRzLnRhcmdldClcbiAgICB0aGlzLmVtaXR0ZXIgPSBlZSgpXG5cbiAgICB0aGlzLnNvY2tldC5vbm9wZW4gPSAoZSkgPT4ge1xuICAgICAgdGhpcy5pc09wZW4gPSB0cnVlXG5cbiAgICAgIHdoaWxlICh0aGlzLnF1ZXVlZC5sZW5ndGggPiAwICYmIHRoaXMuaXNPcGVuKSB7XG4gICAgICAgIGNvbnN0IGZpcnN0ID0gdGhpcy5xdWV1ZWRbMF1cbiAgICAgICAgdGhpcy5zZW5kKGZpcnN0LmFjdGlvbiwgZmlyc3QucGF5bG9hZClcbiAgICAgICAgdGhpcy5xdWV1ZWQgPSB0aGlzLnF1ZXVlZC5zbGljZSgxKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc29ja2V0Lm9uY2xvc2UgPSAoZSkgPT4ge1xuICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuX2hhbmRsZU1lc3NhZ2UgPSB0aGlzLl9oYW5kbGVNZXNzYWdlLmJpbmQodGhpcylcblxuICAgIHRoaXMuc29ja2V0Lm9ubWVzc2FnZSA9IHRoaXMuX2hhbmRsZU1lc3NhZ2VcblxuICAgIHRoaXMuY2xvc2UgPSB0aGlzLmNsb3NlLmJpbmQodGhpcylcbiAgICB0aGlzLmVtaXQgPSB0aGlzLmVtaXQuYmluZCh0aGlzKVxuICAgIHRoaXMub24gPSB0aGlzLm9uLmJpbmQodGhpcylcbiAgICB0aGlzLm9uY2UgPSB0aGlzLm9uY2UuYmluZCh0aGlzKVxuICAgIHRoaXMuc2VuZCA9IHRoaXMuc2VuZC5iaW5kKHRoaXMpXG4gIH1cblxuICBjbG9zZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc29ja2V0LmNsb3NlKClcbiAgfVxuXG4gIHNlbmQgKGFjdGlvbiwgcGF5bG9hZCkge1xuICAgIC8vIGF0dGFjaCB1dWlkXG5cbiAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICB0aGlzLnF1ZXVlZC5wdXNoKHthY3Rpb24sIHBheWxvYWR9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5zb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICBhY3Rpb24sXG4gICAgICBwYXlsb2FkXG4gICAgfSkpXG4gIH1cblxuICBvbiAoYWN0aW9uLCBoYW5kbGVyKSB7XG4gICAgdGhpcy5lbWl0dGVyLm9uKGFjdGlvbiwgaGFuZGxlcilcbiAgfVxuXG4gIGVtaXQgKGFjdGlvbiwgcGF5bG9hZCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KGFjdGlvbiwgcGF5bG9hZClcbiAgfVxuXG4gIG9uY2UgKGFjdGlvbiwgaGFuZGxlcikge1xuICAgIHRoaXMuZW1pdHRlci5vbmNlKGFjdGlvbiwgaGFuZGxlcilcbiAgfVxuXG4gIF9oYW5kbGVNZXNzYWdlIChlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnBhcnNlKGUuZGF0YSlcbiAgICAgIHRoaXMuZW1pdChtZXNzYWdlLmFjdGlvbiwgbWVzc2FnZS5wYXlsb2FkKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5sb2coZXJyKVxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZS1zdHJpY3QnXG4vKipcbiAqIE1hbmFnZXMgY29tbXVuaWNhdGlvbnMgd2l0aCBDb21wYW5pb25cbiAqL1xuXG5jb25zdCBSZXF1ZXN0Q2xpZW50ID0gcmVxdWlyZSgnLi9SZXF1ZXN0Q2xpZW50JylcbmNvbnN0IFByb3ZpZGVyID0gcmVxdWlyZSgnLi9Qcm92aWRlcicpXG5jb25zdCBTb2NrZXQgPSByZXF1aXJlKCcuL1NvY2tldCcpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBSZXF1ZXN0Q2xpZW50LFxuICBQcm92aWRlcixcbiAgU29ja2V0XG59XG4iLCJjb25zdCBwcmVhY3QgPSByZXF1aXJlKCdwcmVhY3QnKVxuY29uc3QgZmluZERPTUVsZW1lbnQgPSByZXF1aXJlKCdAdXBweS91dGlscy9saWIvZmluZERPTUVsZW1lbnQnKVxuXG4vKipcbiAqIERlZmVyIGEgZnJlcXVlbnQgY2FsbCB0byB0aGUgbWljcm90YXNrIHF1ZXVlLlxuICovXG5mdW5jdGlvbiBkZWJvdW5jZSAoZm4pIHtcbiAgbGV0IGNhbGxpbmcgPSBudWxsXG4gIGxldCBsYXRlc3RBcmdzID0gbnVsbFxuICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICBsYXRlc3RBcmdzID0gYXJnc1xuICAgIGlmICghY2FsbGluZykge1xuICAgICAgY2FsbGluZyA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjYWxsaW5nID0gbnVsbFxuICAgICAgICAvLyBBdCB0aGlzIHBvaW50IGBhcmdzYCBtYXkgYmUgZGlmZmVyZW50IGZyb20gdGhlIG1vc3RcbiAgICAgICAgLy8gcmVjZW50IHN0YXRlLCBpZiBtdWx0aXBsZSBjYWxscyBoYXBwZW5lZCBzaW5jZSB0aGlzIHRhc2tcbiAgICAgICAgLy8gd2FzIHF1ZXVlZC4gU28gd2UgdXNlIHRoZSBgbGF0ZXN0QXJnc2AsIHdoaWNoIGRlZmluaXRlbHlcbiAgICAgICAgLy8gaXMgdGhlIG1vc3QgcmVjZW50IGNhbGwuXG4gICAgICAgIHJldHVybiBmbiguLi5sYXRlc3RBcmdzKVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIGNhbGxpbmdcbiAgfVxufVxuXG4vKipcbiAqIEJvaWxlcnBsYXRlIHRoYXQgYWxsIFBsdWdpbnMgc2hhcmUgLSBhbmQgc2hvdWxkIG5vdCBiZSB1c2VkXG4gKiBkaXJlY3RseS4gSXQgYWxzbyBzaG93cyB3aGljaCBtZXRob2RzIGZpbmFsIHBsdWdpbnMgc2hvdWxkIGltcGxlbWVudC9vdmVycmlkZSxcbiAqIHRoaXMgZGVjaWRpbmcgb24gc3RydWN0dXJlLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBtYWluIFVwcHkgY29yZSBvYmplY3RcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3Qgd2l0aCBwbHVnaW4gb3B0aW9uc1xuICogQHJldHVybiB7YXJyYXkgfCBzdHJpbmd9IGZpbGVzIG9yIHN1Y2Nlc3MvZmFpbCBtZXNzYWdlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUGx1Z2luIHtcbiAgY29uc3RydWN0b3IgKHVwcHksIG9wdHMpIHtcbiAgICB0aGlzLnVwcHkgPSB1cHB5XG4gICAgdGhpcy5vcHRzID0gb3B0cyB8fCB7fVxuXG4gICAgdGhpcy51cGRhdGUgPSB0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5tb3VudCA9IHRoaXMubW91bnQuYmluZCh0aGlzKVxuICAgIHRoaXMuaW5zdGFsbCA9IHRoaXMuaW5zdGFsbC5iaW5kKHRoaXMpXG4gICAgdGhpcy51bmluc3RhbGwgPSB0aGlzLnVuaW5zdGFsbC5iaW5kKHRoaXMpXG4gIH1cblxuICBnZXRQbHVnaW5TdGF0ZSAoKSB7XG4gICAgY29uc3QgeyBwbHVnaW5zIH0gPSB0aGlzLnVwcHkuZ2V0U3RhdGUoKVxuICAgIHJldHVybiBwbHVnaW5zW3RoaXMuaWRdIHx8IHt9XG4gIH1cblxuICBzZXRQbHVnaW5TdGF0ZSAodXBkYXRlKSB7XG4gICAgY29uc3QgeyBwbHVnaW5zIH0gPSB0aGlzLnVwcHkuZ2V0U3RhdGUoKVxuXG4gICAgdGhpcy51cHB5LnNldFN0YXRlKHtcbiAgICAgIHBsdWdpbnM6IHtcbiAgICAgICAgLi4ucGx1Z2lucyxcbiAgICAgICAgW3RoaXMuaWRdOiB7XG4gICAgICAgICAgLi4ucGx1Z2luc1t0aGlzLmlkXSxcbiAgICAgICAgICAuLi51cGRhdGVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICB1cGRhdGUgKHN0YXRlKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmVsID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3VwZGF0ZVVJKSB7XG4gICAgICB0aGlzLl91cGRhdGVVSShzdGF0ZSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBDYWxsZWQgd2hlbiBwbHVnaW4gaXMgbW91bnRlZCwgd2hldGhlciBpbiBET00gb3IgaW50byBhbm90aGVyIHBsdWdpbi5cbiAgKiBOZWVkZWQgYmVjYXVzZSBzb21ldGltZXMgcGx1Z2lucyBhcmUgbW91bnRlZCBzZXBhcmF0ZWx5L2FmdGVyIGBpbnN0YWxsYCxcbiAgKiBzbyB0aGlzLmVsIGFuZCB0aGlzLnBhcmVudCBtaWdodCBub3QgYmUgYXZhaWxhYmxlIGluIGBpbnN0YWxsYC5cbiAgKiBUaGlzIGlzIHRoZSBjYXNlIHdpdGggQHVwcHkvcmVhY3QgcGx1Z2lucywgZm9yIGV4YW1wbGUuXG4gICovXG4gIG9uTW91bnQgKCkge1xuXG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgc3VwcGxpZWQgYHRhcmdldGAgaXMgYSBET00gZWxlbWVudCBvciBhbiBgb2JqZWN0YC5cbiAgICogSWYgaXTigJlzIGFuIG9iamVjdCDigJQgdGFyZ2V0IGlzIGEgcGx1Z2luLCBhbmQgd2Ugc2VhcmNoIGBwbHVnaW5zYFxuICAgKiBmb3IgYSBwbHVnaW4gd2l0aCBzYW1lIG5hbWUgYW5kIHJldHVybiBpdHMgdGFyZ2V0LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHRhcmdldFxuICAgKlxuICAgKi9cbiAgbW91bnQgKHRhcmdldCwgcGx1Z2luKSB7XG4gICAgY29uc3QgY2FsbGVyUGx1Z2luTmFtZSA9IHBsdWdpbi5pZFxuXG4gICAgY29uc3QgdGFyZ2V0RWxlbWVudCA9IGZpbmRET01FbGVtZW50KHRhcmdldClcblxuICAgIGlmICh0YXJnZXRFbGVtZW50KSB7XG4gICAgICB0aGlzLmlzVGFyZ2V0RE9NRWwgPSB0cnVlXG5cbiAgICAgIC8vIEFQSSBmb3IgcGx1Z2lucyB0aGF0IHJlcXVpcmUgYSBzeW5jaHJvbm91cyByZXJlbmRlci5cbiAgICAgIHRoaXMucmVyZW5kZXIgPSAoc3RhdGUpID0+IHtcbiAgICAgICAgLy8gcGx1Z2luIGNvdWxkIGJlIHJlbW92ZWQsIGJ1dCB0aGlzLnJlcmVuZGVyIGlzIGRlYm91bmNlZCBiZWxvdyxcbiAgICAgICAgLy8gc28gaXQgY291bGQgc3RpbGwgYmUgY2FsbGVkIGV2ZW4gYWZ0ZXIgdXBweS5yZW1vdmVQbHVnaW4gb3IgdXBweS5jbG9zZVxuICAgICAgICAvLyBoZW5jZSB0aGUgY2hlY2tcbiAgICAgICAgaWYgKCF0aGlzLnVwcHkuZ2V0UGx1Z2luKHRoaXMuaWQpKSByZXR1cm5cbiAgICAgICAgdGhpcy5lbCA9IHByZWFjdC5yZW5kZXIodGhpcy5yZW5kZXIoc3RhdGUpLCB0YXJnZXRFbGVtZW50LCB0aGlzLmVsKVxuICAgICAgfVxuICAgICAgdGhpcy5fdXBkYXRlVUkgPSBkZWJvdW5jZSh0aGlzLnJlcmVuZGVyKVxuXG4gICAgICB0aGlzLnVwcHkubG9nKGBJbnN0YWxsaW5nICR7Y2FsbGVyUGx1Z2luTmFtZX0gdG8gYSBET00gZWxlbWVudGApXG5cbiAgICAgIC8vIGNsZWFyIGV2ZXJ5dGhpbmcgaW5zaWRlIHRoZSB0YXJnZXQgY29udGFpbmVyXG4gICAgICBpZiAodGhpcy5vcHRzLnJlcGxhY2VUYXJnZXRDb250ZW50KSB7XG4gICAgICAgIHRhcmdldEVsZW1lbnQuaW5uZXJIVE1MID0gJydcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbCA9IHByZWFjdC5yZW5kZXIodGhpcy5yZW5kZXIodGhpcy51cHB5LmdldFN0YXRlKCkpLCB0YXJnZXRFbGVtZW50KVxuXG4gICAgICB0aGlzLm9uTW91bnQoKVxuICAgICAgcmV0dXJuIHRoaXMuZWxcbiAgICB9XG5cbiAgICBsZXQgdGFyZ2V0UGx1Z2luXG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09ICdvYmplY3QnICYmIHRhcmdldCBpbnN0YW5jZW9mIFBsdWdpbikge1xuICAgICAgLy8gVGFyZ2V0aW5nIGEgcGx1Z2luICppbnN0YW5jZSpcbiAgICAgIHRhcmdldFBsdWdpbiA9IHRhcmdldFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gVGFyZ2V0aW5nIGEgcGx1Z2luIHR5cGVcbiAgICAgIGNvbnN0IFRhcmdldCA9IHRhcmdldFxuICAgICAgLy8gRmluZCB0aGUgdGFyZ2V0IHBsdWdpbiBpbnN0YW5jZS5cbiAgICAgIHRoaXMudXBweS5pdGVyYXRlUGx1Z2lucygocGx1Z2luKSA9PiB7XG4gICAgICAgIGlmIChwbHVnaW4gaW5zdGFuY2VvZiBUYXJnZXQpIHtcbiAgICAgICAgICB0YXJnZXRQbHVnaW4gPSBwbHVnaW5cbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGFyZ2V0UGx1Z2luKSB7XG4gICAgICB0aGlzLnVwcHkubG9nKGBJbnN0YWxsaW5nICR7Y2FsbGVyUGx1Z2luTmFtZX0gdG8gJHt0YXJnZXRQbHVnaW4uaWR9YClcbiAgICAgIHRoaXMucGFyZW50ID0gdGFyZ2V0UGx1Z2luXG4gICAgICB0aGlzLmVsID0gdGFyZ2V0UGx1Z2luLmFkZFRhcmdldChwbHVnaW4pXG5cbiAgICAgIHRoaXMub25Nb3VudCgpXG4gICAgICByZXR1cm4gdGhpcy5lbFxuICAgIH1cblxuICAgIHRoaXMudXBweS5sb2coYE5vdCBpbnN0YWxsaW5nICR7Y2FsbGVyUGx1Z2luTmFtZX1gKVxuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB0YXJnZXQgb3B0aW9uIGdpdmVuIHRvICR7Y2FsbGVyUGx1Z2luTmFtZX0uIFBsZWFzZSBtYWtlIHN1cmUgdGhhdCB0aGUgZWxlbWVudCBcbiAgICAgIGV4aXN0cyBvbiB0aGUgcGFnZSwgb3IgdGhhdCB0aGUgcGx1Z2luIHlvdSBhcmUgdGFyZ2V0aW5nIGhhcyBiZWVuIGluc3RhbGxlZC4gQ2hlY2sgdGhhdCB0aGUgPHNjcmlwdD4gdGFnIGluaXRpYWxpemluZyBVcHB5IFxuICAgICAgY29tZXMgYXQgdGhlIGJvdHRvbSBvZiB0aGUgcGFnZSwgYmVmb3JlIHRoZSBjbG9zaW5nIDwvYm9keT4gdGFnIChzZWUgaHR0cHM6Ly9naXRodWIuY29tL3RyYW5zbG9hZGl0L3VwcHkvaXNzdWVzLzEwNDIpLmApXG4gIH1cblxuICByZW5kZXIgKHN0YXRlKSB7XG4gICAgdGhyb3cgKG5ldyBFcnJvcignRXh0ZW5kIHRoZSByZW5kZXIgbWV0aG9kIHRvIGFkZCB5b3VyIHBsdWdpbiB0byBhIERPTSBlbGVtZW50JykpXG4gIH1cblxuICBhZGRUYXJnZXQgKHBsdWdpbikge1xuICAgIHRocm93IChuZXcgRXJyb3IoJ0V4dGVuZCB0aGUgYWRkVGFyZ2V0IG1ldGhvZCB0byBhZGQgeW91ciBwbHVnaW4gdG8gYW5vdGhlciBwbHVnaW5cXCdzIHRhcmdldCcpKVxuICB9XG5cbiAgdW5tb3VudCAoKSB7XG4gICAgaWYgKHRoaXMuaXNUYXJnZXRET01FbCAmJiB0aGlzLmVsICYmIHRoaXMuZWwucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5lbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWwpXG4gICAgfVxuICB9XG5cbiAgaW5zdGFsbCAoKSB7XG5cbiAgfVxuXG4gIHVuaW5zdGFsbCAoKSB7XG4gICAgdGhpcy51bm1vdW50KClcbiAgfVxufVxuIiwiY29uc3QgVHJhbnNsYXRvciA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9UcmFuc2xhdG9yJylcbmNvbnN0IGVlID0gcmVxdWlyZSgnbmFtZXNwYWNlLWVtaXR0ZXInKVxuY29uc3QgY3VpZCA9IHJlcXVpcmUoJ2N1aWQnKVxuLy8gY29uc3QgdGhyb3R0bGUgPSByZXF1aXJlKCdsb2Rhc2gudGhyb3R0bGUnKVxuY29uc3QgcHJldHR5Qnl0ZXMgPSByZXF1aXJlKCdwcmV0dGllci1ieXRlcycpXG5jb25zdCBtYXRjaCA9IHJlcXVpcmUoJ21pbWUtbWF0Y2gnKVxuY29uc3QgRGVmYXVsdFN0b3JlID0gcmVxdWlyZSgnQHVwcHkvc3RvcmUtZGVmYXVsdCcpXG5jb25zdCBnZXRGaWxlVHlwZSA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9nZXRGaWxlVHlwZScpXG5jb25zdCBnZXRGaWxlTmFtZUFuZEV4dGVuc2lvbiA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9nZXRGaWxlTmFtZUFuZEV4dGVuc2lvbicpXG5jb25zdCBnZW5lcmF0ZUZpbGVJRCA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9nZW5lcmF0ZUZpbGVJRCcpXG5jb25zdCBnZXRUaW1lU3RhbXAgPSByZXF1aXJlKCdAdXBweS91dGlscy9saWIvZ2V0VGltZVN0YW1wJylcbmNvbnN0IFBsdWdpbiA9IHJlcXVpcmUoJy4vUGx1Z2luJykgLy8gRXhwb3J0ZWQgZnJvbSBoZXJlLlxuXG4vKipcbiAqIFVwcHkgQ29yZSBtb2R1bGUuXG4gKiBNYW5hZ2VzIHBsdWdpbnMsIHN0YXRlIHVwZGF0ZXMsIGFjdHMgYXMgYW4gZXZlbnQgYnVzLFxuICogYWRkcy9yZW1vdmVzIGZpbGVzIGFuZCBtZXRhZGF0YS5cbiAqL1xuY2xhc3MgVXBweSB7XG4gIC8qKlxuICAqIEluc3RhbnRpYXRlIFVwcHlcbiAgKiBAcGFyYW0ge29iamVjdH0gb3B0cyDigJQgVXBweSBvcHRpb25zXG4gICovXG4gIGNvbnN0cnVjdG9yIChvcHRzKSB7XG4gICAgY29uc3QgZGVmYXVsdExvY2FsZSA9IHtcbiAgICAgIHN0cmluZ3M6IHtcbiAgICAgICAgeW91Q2FuT25seVVwbG9hZFg6IHtcbiAgICAgICAgICAwOiAnWW91IGNhbiBvbmx5IHVwbG9hZCAle3NtYXJ0X2NvdW50fSBmaWxlJyxcbiAgICAgICAgICAxOiAnWW91IGNhbiBvbmx5IHVwbG9hZCAle3NtYXJ0X2NvdW50fSBmaWxlcydcbiAgICAgICAgfSxcbiAgICAgICAgeW91SGF2ZVRvQXRMZWFzdFNlbGVjdFg6IHtcbiAgICAgICAgICAwOiAnWW91IGhhdmUgdG8gc2VsZWN0IGF0IGxlYXN0ICV7c21hcnRfY291bnR9IGZpbGUnLFxuICAgICAgICAgIDE6ICdZb3UgaGF2ZSB0byBzZWxlY3QgYXQgbGVhc3QgJXtzbWFydF9jb3VudH0gZmlsZXMnXG4gICAgICAgIH0sXG4gICAgICAgIGV4Y2VlZHNTaXplOiAnVGhpcyBmaWxlIGV4Y2VlZHMgbWF4aW11bSBhbGxvd2VkIHNpemUgb2YnLFxuICAgICAgICB5b3VDYW5Pbmx5VXBsb2FkRmlsZVR5cGVzOiAnWW91IGNhbiBvbmx5IHVwbG9hZDonLFxuICAgICAgICBjb21wYW5pb25FcnJvcjogJ0Nvbm5lY3Rpb24gd2l0aCBDb21wYW5pb24gZmFpbGVkJyxcbiAgICAgICAgZmFpbGVkVG9VcGxvYWQ6ICdGYWlsZWQgdG8gdXBsb2FkICV7ZmlsZX0nLFxuICAgICAgICBub0ludGVybmV0Q29ubmVjdGlvbjogJ05vIEludGVybmV0IGNvbm5lY3Rpb24nLFxuICAgICAgICBjb25uZWN0ZWRUb0ludGVybmV0OiAnQ29ubmVjdGVkIHRvIHRoZSBJbnRlcm5ldCcsXG4gICAgICAgIC8vIFN0cmluZ3MgZm9yIHJlbW90ZSBwcm92aWRlcnNcbiAgICAgICAgbm9GaWxlc0ZvdW5kOiAnWW91IGhhdmUgbm8gZmlsZXMgb3IgZm9sZGVycyBoZXJlJyxcbiAgICAgICAgc2VsZWN0WEZpbGVzOiB7XG4gICAgICAgICAgMDogJ1NlbGVjdCAle3NtYXJ0X2NvdW50fSBmaWxlJyxcbiAgICAgICAgICAxOiAnU2VsZWN0ICV7c21hcnRfY291bnR9IGZpbGVzJ1xuICAgICAgICB9LFxuICAgICAgICBjYW5jZWw6ICdDYW5jZWwnLFxuICAgICAgICBsb2dPdXQ6ICdMb2cgb3V0J1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIGlkOiAndXBweScsXG4gICAgICBhdXRvUHJvY2VlZDogZmFsc2UsXG4gICAgICBhbGxvd011bHRpcGxlVXBsb2FkczogdHJ1ZSxcbiAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgIHJlc3RyaWN0aW9uczoge1xuICAgICAgICBtYXhGaWxlU2l6ZTogbnVsbCxcbiAgICAgICAgbWF4TnVtYmVyT2ZGaWxlczogbnVsbCxcbiAgICAgICAgbWluTnVtYmVyT2ZGaWxlczogbnVsbCxcbiAgICAgICAgYWxsb3dlZEZpbGVUeXBlczogbnVsbFxuICAgICAgfSxcbiAgICAgIG1ldGE6IHt9LFxuICAgICAgb25CZWZvcmVGaWxlQWRkZWQ6IChjdXJyZW50RmlsZSwgZmlsZXMpID0+IGN1cnJlbnRGaWxlLFxuICAgICAgb25CZWZvcmVVcGxvYWQ6IChmaWxlcykgPT4gZmlsZXMsXG4gICAgICBsb2NhbGU6IGRlZmF1bHRMb2NhbGUsXG4gICAgICBzdG9yZTogRGVmYXVsdFN0b3JlKClcbiAgICB9XG5cbiAgICAvLyBNZXJnZSBkZWZhdWx0IG9wdGlvbnMgd2l0aCB0aGUgb25lcyBzZXQgYnkgdXNlclxuICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBvcHRzKVxuICAgIHRoaXMub3B0cy5yZXN0cmljdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucy5yZXN0cmljdGlvbnMsIHRoaXMub3B0cy5yZXN0cmljdGlvbnMpXG5cbiAgICAvLyBpMThuXG4gICAgdGhpcy50cmFuc2xhdG9yID0gbmV3IFRyYW5zbGF0b3IoWyBkZWZhdWx0TG9jYWxlLCB0aGlzLm9wdHMubG9jYWxlIF0pXG4gICAgdGhpcy5sb2NhbGUgPSB0aGlzLnRyYW5zbGF0b3IubG9jYWxlXG4gICAgdGhpcy5pMThuID0gdGhpcy50cmFuc2xhdG9yLnRyYW5zbGF0ZS5iaW5kKHRoaXMudHJhbnNsYXRvcilcblxuICAgIC8vIENvbnRhaW5lciBmb3IgZGlmZmVyZW50IHR5cGVzIG9mIHBsdWdpbnNcbiAgICB0aGlzLnBsdWdpbnMgPSB7fVxuXG4gICAgdGhpcy5nZXRTdGF0ZSA9IHRoaXMuZ2V0U3RhdGUuYmluZCh0aGlzKVxuICAgIHRoaXMuZ2V0UGx1Z2luID0gdGhpcy5nZXRQbHVnaW4uYmluZCh0aGlzKVxuICAgIHRoaXMuc2V0RmlsZU1ldGEgPSB0aGlzLnNldEZpbGVNZXRhLmJpbmQodGhpcylcbiAgICB0aGlzLnNldEZpbGVTdGF0ZSA9IHRoaXMuc2V0RmlsZVN0YXRlLmJpbmQodGhpcylcbiAgICB0aGlzLmxvZyA9IHRoaXMubG9nLmJpbmQodGhpcylcbiAgICB0aGlzLmluZm8gPSB0aGlzLmluZm8uYmluZCh0aGlzKVxuICAgIHRoaXMuaGlkZUluZm8gPSB0aGlzLmhpZGVJbmZvLmJpbmQodGhpcylcbiAgICB0aGlzLmFkZEZpbGUgPSB0aGlzLmFkZEZpbGUuYmluZCh0aGlzKVxuICAgIHRoaXMucmVtb3ZlRmlsZSA9IHRoaXMucmVtb3ZlRmlsZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5wYXVzZVJlc3VtZSA9IHRoaXMucGF1c2VSZXN1bWUuYmluZCh0aGlzKVxuICAgIHRoaXMuX2NhbGN1bGF0ZVByb2dyZXNzID0gdGhpcy5fY2FsY3VsYXRlUHJvZ3Jlc3MuYmluZCh0aGlzKVxuICAgIHRoaXMudXBkYXRlT25saW5lU3RhdHVzID0gdGhpcy51cGRhdGVPbmxpbmVTdGF0dXMuYmluZCh0aGlzKVxuICAgIHRoaXMucmVzZXRQcm9ncmVzcyA9IHRoaXMucmVzZXRQcm9ncmVzcy5iaW5kKHRoaXMpXG5cbiAgICB0aGlzLnBhdXNlQWxsID0gdGhpcy5wYXVzZUFsbC5iaW5kKHRoaXMpXG4gICAgdGhpcy5yZXN1bWVBbGwgPSB0aGlzLnJlc3VtZUFsbC5iaW5kKHRoaXMpXG4gICAgdGhpcy5yZXRyeUFsbCA9IHRoaXMucmV0cnlBbGwuYmluZCh0aGlzKVxuICAgIHRoaXMuY2FuY2VsQWxsID0gdGhpcy5jYW5jZWxBbGwuYmluZCh0aGlzKVxuICAgIHRoaXMucmV0cnlVcGxvYWQgPSB0aGlzLnJldHJ5VXBsb2FkLmJpbmQodGhpcylcbiAgICB0aGlzLnVwbG9hZCA9IHRoaXMudXBsb2FkLmJpbmQodGhpcylcblxuICAgIHRoaXMuZW1pdHRlciA9IGVlKClcbiAgICB0aGlzLm9uID0gdGhpcy5vbi5iaW5kKHRoaXMpXG4gICAgdGhpcy5vZmYgPSB0aGlzLm9mZi5iaW5kKHRoaXMpXG4gICAgdGhpcy5vbmNlID0gdGhpcy5lbWl0dGVyLm9uY2UuYmluZCh0aGlzLmVtaXR0ZXIpXG4gICAgdGhpcy5lbWl0ID0gdGhpcy5lbWl0dGVyLmVtaXQuYmluZCh0aGlzLmVtaXR0ZXIpXG5cbiAgICB0aGlzLnByZVByb2Nlc3NvcnMgPSBbXVxuICAgIHRoaXMudXBsb2FkZXJzID0gW11cbiAgICB0aGlzLnBvc3RQcm9jZXNzb3JzID0gW11cblxuICAgIHRoaXMuc3RvcmUgPSB0aGlzLm9wdHMuc3RvcmVcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHBsdWdpbnM6IHt9LFxuICAgICAgZmlsZXM6IHt9LFxuICAgICAgY3VycmVudFVwbG9hZHM6IHt9LFxuICAgICAgYWxsb3dOZXdVcGxvYWQ6IHRydWUsXG4gICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgcmVzdW1hYmxlVXBsb2FkczogZmFsc2VcbiAgICAgIH0sXG4gICAgICB0b3RhbFByb2dyZXNzOiAwLFxuICAgICAgbWV0YTogeyAuLi50aGlzLm9wdHMubWV0YSB9LFxuICAgICAgaW5mbzoge1xuICAgICAgICBpc0hpZGRlbjogdHJ1ZSxcbiAgICAgICAgdHlwZTogJ2luZm8nLFxuICAgICAgICBtZXNzYWdlOiAnJ1xuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLl9zdG9yZVVuc3Vic2NyaWJlID0gdGhpcy5zdG9yZS5zdWJzY3JpYmUoKHByZXZTdGF0ZSwgbmV4dFN0YXRlLCBwYXRjaCkgPT4ge1xuICAgICAgdGhpcy5lbWl0KCdzdGF0ZS11cGRhdGUnLCBwcmV2U3RhdGUsIG5leHRTdGF0ZSwgcGF0Y2gpXG4gICAgICB0aGlzLnVwZGF0ZUFsbChuZXh0U3RhdGUpXG4gICAgfSlcblxuICAgIC8vIGZvciBkZWJ1Z2dpbmcgYW5kIHRlc3RpbmdcbiAgICAvLyB0aGlzLnVwZGF0ZU51bSA9IDBcbiAgICBpZiAodGhpcy5vcHRzLmRlYnVnICYmIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB3aW5kb3dbJ3VwcHlMb2cnXSA9ICcnXG4gICAgICB3aW5kb3dbdGhpcy5vcHRzLmlkXSA9IHRoaXNcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRMaXN0ZW5lcnMoKVxuICB9XG5cbiAgb24gKGV2ZW50LCBjYWxsYmFjaykge1xuICAgIHRoaXMuZW1pdHRlci5vbihldmVudCwgY2FsbGJhY2spXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIG9mZiAoZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5lbWl0dGVyLm9mZihldmVudCwgY2FsbGJhY2spXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG9uIGFsbCBwbHVnaW5zIGFuZCBydW4gYHVwZGF0ZWAgb24gdGhlbS5cbiAgICogQ2FsbGVkIGVhY2ggdGltZSBzdGF0ZSBjaGFuZ2VzLlxuICAgKlxuICAgKi9cbiAgdXBkYXRlQWxsIChzdGF0ZSkge1xuICAgIHRoaXMuaXRlcmF0ZVBsdWdpbnMocGx1Z2luID0+IHtcbiAgICAgIHBsdWdpbi51cGRhdGUoc3RhdGUpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHN0YXRlIHdpdGggYSBwYXRjaFxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gcGF0Y2gge2ZvbzogJ2Jhcid9XG4gICAqL1xuICBzZXRTdGF0ZSAocGF0Y2gpIHtcbiAgICB0aGlzLnN0b3JlLnNldFN0YXRlKHBhdGNoKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgY3VycmVudCBzdGF0ZS5cbiAgICogQHJldHVybiB7b2JqZWN0fVxuICAgKi9cbiAgZ2V0U3RhdGUgKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3JlLmdldFN0YXRlKClcbiAgfVxuXG4gIC8qKlxuICAqIEJhY2sgY29tcGF0IGZvciB3aGVuIHVwcHkuc3RhdGUgaXMgdXNlZCBpbnN0ZWFkIG9mIHVwcHkuZ2V0U3RhdGUoKS5cbiAgKi9cbiAgZ2V0IHN0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRTdGF0ZSgpXG4gIH1cblxuICAvKipcbiAgKiBTaG9ydGhhbmQgdG8gc2V0IHN0YXRlIGZvciBhIHNwZWNpZmljIGZpbGUuXG4gICovXG4gIHNldEZpbGVTdGF0ZSAoZmlsZUlELCBzdGF0ZSkge1xuICAgIGlmICghdGhpcy5nZXRTdGF0ZSgpLmZpbGVzW2ZpbGVJRF0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fu4oCZdCBzZXQgc3RhdGUgZm9yICR7ZmlsZUlEfSAodGhlIGZpbGUgY291bGQgaGF2ZSBiZWVuIHJlbW92ZWQpYClcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGZpbGVzOiBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMsIHtcbiAgICAgICAgW2ZpbGVJRF06IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5maWxlc1tmaWxlSURdLCBzdGF0ZSlcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHJlc2V0UHJvZ3Jlc3MgKCkge1xuICAgIGNvbnN0IGRlZmF1bHRQcm9ncmVzcyA9IHtcbiAgICAgIHBlcmNlbnRhZ2U6IDAsXG4gICAgICBieXRlc1VwbG9hZGVkOiAwLFxuICAgICAgdXBsb2FkQ29tcGxldGU6IGZhbHNlLFxuICAgICAgdXBsb2FkU3RhcnRlZDogZmFsc2VcbiAgICB9XG4gICAgY29uc3QgZmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgY29uc3QgdXBkYXRlZEZpbGVzID0ge31cbiAgICBPYmplY3Qua2V5cyhmaWxlcykuZm9yRWFjaChmaWxlSUQgPT4ge1xuICAgICAgY29uc3QgdXBkYXRlZEZpbGUgPSBPYmplY3QuYXNzaWduKHt9LCBmaWxlc1tmaWxlSURdKVxuICAgICAgdXBkYXRlZEZpbGUucHJvZ3Jlc3MgPSBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZS5wcm9ncmVzcywgZGVmYXVsdFByb2dyZXNzKVxuICAgICAgdXBkYXRlZEZpbGVzW2ZpbGVJRF0gPSB1cGRhdGVkRmlsZVxuICAgIH0pXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGZpbGVzOiB1cGRhdGVkRmlsZXMsXG4gICAgICB0b3RhbFByb2dyZXNzOiAwXG4gICAgfSlcblxuICAgIC8vIFRPRE8gRG9jdW1lbnQgb24gdGhlIHdlYnNpdGVcbiAgICB0aGlzLmVtaXQoJ3Jlc2V0LXByb2dyZXNzJylcbiAgfVxuXG4gIGFkZFByZVByb2Nlc3NvciAoZm4pIHtcbiAgICB0aGlzLnByZVByb2Nlc3NvcnMucHVzaChmbilcbiAgfVxuXG4gIHJlbW92ZVByZVByb2Nlc3NvciAoZm4pIHtcbiAgICBjb25zdCBpID0gdGhpcy5wcmVQcm9jZXNzb3JzLmluZGV4T2YoZm4pXG4gICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICB0aGlzLnByZVByb2Nlc3NvcnMuc3BsaWNlKGksIDEpXG4gICAgfVxuICB9XG5cbiAgYWRkUG9zdFByb2Nlc3NvciAoZm4pIHtcbiAgICB0aGlzLnBvc3RQcm9jZXNzb3JzLnB1c2goZm4pXG4gIH1cblxuICByZW1vdmVQb3N0UHJvY2Vzc29yIChmbikge1xuICAgIGNvbnN0IGkgPSB0aGlzLnBvc3RQcm9jZXNzb3JzLmluZGV4T2YoZm4pXG4gICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICB0aGlzLnBvc3RQcm9jZXNzb3JzLnNwbGljZShpLCAxKVxuICAgIH1cbiAgfVxuXG4gIGFkZFVwbG9hZGVyIChmbikge1xuICAgIHRoaXMudXBsb2FkZXJzLnB1c2goZm4pXG4gIH1cblxuICByZW1vdmVVcGxvYWRlciAoZm4pIHtcbiAgICBjb25zdCBpID0gdGhpcy51cGxvYWRlcnMuaW5kZXhPZihmbilcbiAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgIHRoaXMudXBsb2FkZXJzLnNwbGljZShpLCAxKVxuICAgIH1cbiAgfVxuXG4gIHNldE1ldGEgKGRhdGEpIHtcbiAgICBjb25zdCB1cGRhdGVkTWV0YSA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5tZXRhLCBkYXRhKVxuICAgIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5maWxlcylcblxuICAgIE9iamVjdC5rZXlzKHVwZGF0ZWRGaWxlcykuZm9yRWFjaCgoZmlsZUlEKSA9PiB7XG4gICAgICB1cGRhdGVkRmlsZXNbZmlsZUlEXSA9IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZWRGaWxlc1tmaWxlSURdLCB7XG4gICAgICAgIG1ldGE6IE9iamVjdC5hc3NpZ24oe30sIHVwZGF0ZWRGaWxlc1tmaWxlSURdLm1ldGEsIGRhdGEpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLmxvZygnQWRkaW5nIG1ldGFkYXRhOicpXG4gICAgdGhpcy5sb2coZGF0YSlcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbWV0YTogdXBkYXRlZE1ldGEsXG4gICAgICBmaWxlczogdXBkYXRlZEZpbGVzXG4gICAgfSlcbiAgfVxuXG4gIHNldEZpbGVNZXRhIChmaWxlSUQsIGRhdGEpIHtcbiAgICBjb25zdCB1cGRhdGVkRmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgaWYgKCF1cGRhdGVkRmlsZXNbZmlsZUlEXSkge1xuICAgICAgdGhpcy5sb2coJ1dhcyB0cnlpbmcgdG8gc2V0IG1ldGFkYXRhIGZvciBhIGZpbGUgdGhhdOKAmXMgbm90IHdpdGggdXMgYW55bW9yZTogJywgZmlsZUlEKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IG5ld01ldGEgPSBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZUlEXS5tZXRhLCBkYXRhKVxuICAgIHVwZGF0ZWRGaWxlc1tmaWxlSURdID0gT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlZEZpbGVzW2ZpbGVJRF0sIHtcbiAgICAgIG1ldGE6IG5ld01ldGFcbiAgICB9KVxuICAgIHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB1cGRhdGVkRmlsZXN9KVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGZpbGUgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZUlEIFRoZSBJRCBvZiB0aGUgZmlsZSBvYmplY3QgdG8gcmV0dXJuLlxuICAgKi9cbiAgZ2V0RmlsZSAoZmlsZUlEKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0U3RhdGUoKS5maWxlc1tmaWxlSURdXG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBmaWxlcyBpbiBhbiBhcnJheS5cbiAgICovXG4gIGdldEZpbGVzICgpIHtcbiAgICBjb25zdCB7IGZpbGVzIH0gPSB0aGlzLmdldFN0YXRlKClcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoZmlsZXMpLm1hcCgoZmlsZUlEKSA9PiBmaWxlc1tmaWxlSURdKVxuICB9XG5cbiAgLyoqXG4gICogQ2hlY2sgaWYgbWluTnVtYmVyT2ZGaWxlcyByZXN0cmljdGlvbiBpcyByZWFjaGVkIGJlZm9yZSB1cGxvYWRpbmcuXG4gICpcbiAgKiBAcHJpdmF0ZVxuICAqL1xuICBfY2hlY2tNaW5OdW1iZXJPZkZpbGVzIChmaWxlcykge1xuICAgIGNvbnN0IHttaW5OdW1iZXJPZkZpbGVzfSA9IHRoaXMub3B0cy5yZXN0cmljdGlvbnNcbiAgICBpZiAoT2JqZWN0LmtleXMoZmlsZXMpLmxlbmd0aCA8IG1pbk51bWJlck9mRmlsZXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmkxOG4oJ3lvdUhhdmVUb0F0TGVhc3RTZWxlY3RYJywgeyBzbWFydF9jb3VudDogbWluTnVtYmVyT2ZGaWxlcyB9KX1gKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAqIENoZWNrIGlmIGZpbGUgcGFzc2VzIGEgc2V0IG9mIHJlc3RyaWN0aW9ucyBzZXQgaW4gb3B0aW9uczogbWF4RmlsZVNpemUsXG4gICogbWF4TnVtYmVyT2ZGaWxlcyBhbmQgYWxsb3dlZEZpbGVUeXBlcy5cbiAgKlxuICAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlIG9iamVjdCB0byBjaGVja1xuICAqIEBwcml2YXRlXG4gICovXG4gIF9jaGVja1Jlc3RyaWN0aW9ucyAoZmlsZSkge1xuICAgIGNvbnN0IHttYXhGaWxlU2l6ZSwgbWF4TnVtYmVyT2ZGaWxlcywgYWxsb3dlZEZpbGVUeXBlc30gPSB0aGlzLm9wdHMucmVzdHJpY3Rpb25zXG5cbiAgICBpZiAobWF4TnVtYmVyT2ZGaWxlcykge1xuICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuZ2V0U3RhdGUoKS5maWxlcykubGVuZ3RoICsgMSA+IG1heE51bWJlck9mRmlsZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuaTE4bigneW91Q2FuT25seVVwbG9hZFgnLCB7IHNtYXJ0X2NvdW50OiBtYXhOdW1iZXJPZkZpbGVzIH0pfWApXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGFsbG93ZWRGaWxlVHlwZXMpIHtcbiAgICAgIGNvbnN0IGlzQ29ycmVjdEZpbGVUeXBlID0gYWxsb3dlZEZpbGVUeXBlcy5maWx0ZXIoKHR5cGUpID0+IHtcbiAgICAgICAgLy8gaWYgKCFmaWxlLnR5cGUpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIC8vIGlzIHRoaXMgaXMgYSBtaW1lLXR5cGVcbiAgICAgICAgaWYgKHR5cGUuaW5kZXhPZignLycpID4gLTEpIHtcbiAgICAgICAgICBpZiAoIWZpbGUudHlwZSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgcmV0dXJuIG1hdGNoKGZpbGUudHlwZSwgdHlwZSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG90aGVyd2lzZSB0aGlzIGlzIGxpa2VseSBhbiBleHRlbnNpb25cbiAgICAgICAgaWYgKHR5cGVbMF0gPT09ICcuJykge1xuICAgICAgICAgIGlmIChmaWxlLmV4dGVuc2lvbiA9PT0gdHlwZS5zdWJzdHIoMSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWxlLmV4dGVuc2lvblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkubGVuZ3RoID4gMFxuXG4gICAgICBpZiAoIWlzQ29ycmVjdEZpbGVUeXBlKSB7XG4gICAgICAgIGNvbnN0IGFsbG93ZWRGaWxlVHlwZXNTdHJpbmcgPSBhbGxvd2VkRmlsZVR5cGVzLmpvaW4oJywgJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuaTE4bigneW91Q2FuT25seVVwbG9hZEZpbGVUeXBlcycpfSAke2FsbG93ZWRGaWxlVHlwZXNTdHJpbmd9YClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobWF4RmlsZVNpemUpIHtcbiAgICAgIGlmIChmaWxlLmRhdGEuc2l6ZSA+IG1heEZpbGVTaXplKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmkxOG4oJ2V4Y2VlZHNTaXplJyl9ICR7cHJldHR5Qnl0ZXMobWF4RmlsZVNpemUpfWApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogQWRkIGEgbmV3IGZpbGUgdG8gYHN0YXRlLmZpbGVzYC4gVGhpcyB3aWxsIHJ1biBgb25CZWZvcmVGaWxlQWRkZWRgLFxuICAqIHRyeSB0byBndWVzcyBmaWxlIHR5cGUgaW4gYSBjbGV2ZXIgd2F5LCBjaGVjayBmaWxlIGFnYWluc3QgcmVzdHJpY3Rpb25zLFxuICAqIGFuZCBzdGFydCBhbiB1cGxvYWQgaWYgYGF1dG9Qcm9jZWVkID09PSB0cnVlYC5cbiAgKlxuICAqIEBwYXJhbSB7b2JqZWN0fSBmaWxlIG9iamVjdCB0byBhZGRcbiAgKi9cbiAgYWRkRmlsZSAoZmlsZSkge1xuICAgIGNvbnN0IHsgZmlsZXMsIGFsbG93TmV3VXBsb2FkIH0gPSB0aGlzLmdldFN0YXRlKClcblxuICAgIGNvbnN0IG9uRXJyb3IgPSAobXNnKSA9PiB7XG4gICAgICBjb25zdCBlcnIgPSB0eXBlb2YgbXNnID09PSAnb2JqZWN0JyA/IG1zZyA6IG5ldyBFcnJvcihtc2cpXG4gICAgICB0aGlzLmxvZyhlcnIubWVzc2FnZSlcbiAgICAgIHRoaXMuaW5mbyhlcnIubWVzc2FnZSwgJ2Vycm9yJywgNTAwMClcbiAgICAgIHRocm93IGVyclxuICAgIH1cblxuICAgIGlmIChhbGxvd05ld1VwbG9hZCA9PT0gZmFsc2UpIHtcbiAgICAgIG9uRXJyb3IobmV3IEVycm9yKCdDYW5ub3QgYWRkIG5ldyBmaWxlczogYWxyZWFkeSB1cGxvYWRpbmcuJykpXG4gICAgfVxuXG4gICAgY29uc3Qgb25CZWZvcmVGaWxlQWRkZWRSZXN1bHQgPSB0aGlzLm9wdHMub25CZWZvcmVGaWxlQWRkZWQoZmlsZSwgZmlsZXMpXG5cbiAgICBpZiAob25CZWZvcmVGaWxlQWRkZWRSZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLmxvZygnTm90IGFkZGluZyBmaWxlIGJlY2F1c2Ugb25CZWZvcmVGaWxlQWRkZWQgcmV0dXJuZWQgZmFsc2UnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvbkJlZm9yZUZpbGVBZGRlZFJlc3VsdCA9PT0gJ29iamVjdCcgJiYgb25CZWZvcmVGaWxlQWRkZWRSZXN1bHQpIHtcbiAgICAgIC8vIHdhcm5pbmcgYWZ0ZXIgdGhlIGNoYW5nZSBpbiAwLjI0XG4gICAgICBpZiAob25CZWZvcmVGaWxlQWRkZWRSZXN1bHQudGhlbikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvbkJlZm9yZUZpbGVBZGRlZCgpIHJldHVybmVkIGEgUHJvbWlzZSwgYnV0IHRoaXMgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC4gSXQgbXVzdCBiZSBzeW5jaHJvbm91cy4nKVxuICAgICAgfVxuICAgICAgZmlsZSA9IG9uQmVmb3JlRmlsZUFkZGVkUmVzdWx0XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZVR5cGUgPSBnZXRGaWxlVHlwZShmaWxlKVxuICAgIGxldCBmaWxlTmFtZVxuICAgIGlmIChmaWxlLm5hbWUpIHtcbiAgICAgIGZpbGVOYW1lID0gZmlsZS5uYW1lXG4gICAgfSBlbHNlIGlmIChmaWxlVHlwZS5zcGxpdCgnLycpWzBdID09PSAnaW1hZ2UnKSB7XG4gICAgICBmaWxlTmFtZSA9IGZpbGVUeXBlLnNwbGl0KCcvJylbMF0gKyAnLicgKyBmaWxlVHlwZS5zcGxpdCgnLycpWzFdXG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbGVOYW1lID0gJ25vbmFtZSdcbiAgICB9XG4gICAgY29uc3QgZmlsZUV4dGVuc2lvbiA9IGdldEZpbGVOYW1lQW5kRXh0ZW5zaW9uKGZpbGVOYW1lKS5leHRlbnNpb25cbiAgICBjb25zdCBpc1JlbW90ZSA9IGZpbGUuaXNSZW1vdGUgfHwgZmFsc2VcblxuICAgIGNvbnN0IGZpbGVJRCA9IGdlbmVyYXRlRmlsZUlEKGZpbGUpXG5cbiAgICBjb25zdCBtZXRhID0gZmlsZS5tZXRhIHx8IHt9XG4gICAgbWV0YS5uYW1lID0gZmlsZU5hbWVcbiAgICBtZXRhLnR5cGUgPSBmaWxlVHlwZVxuXG4gICAgY29uc3QgbmV3RmlsZSA9IHtcbiAgICAgIHNvdXJjZTogZmlsZS5zb3VyY2UgfHwgJycsXG4gICAgICBpZDogZmlsZUlELFxuICAgICAgbmFtZTogZmlsZU5hbWUsXG4gICAgICBleHRlbnNpb246IGZpbGVFeHRlbnNpb24gfHwgJycsXG4gICAgICBtZXRhOiBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkubWV0YSwgbWV0YSksXG4gICAgICB0eXBlOiBmaWxlVHlwZSxcbiAgICAgIGRhdGE6IGZpbGUuZGF0YSxcbiAgICAgIHByb2dyZXNzOiB7XG4gICAgICAgIHBlcmNlbnRhZ2U6IDAsXG4gICAgICAgIGJ5dGVzVXBsb2FkZWQ6IDAsXG4gICAgICAgIGJ5dGVzVG90YWw6IGZpbGUuZGF0YS5zaXplIHx8IDAsXG4gICAgICAgIHVwbG9hZENvbXBsZXRlOiBmYWxzZSxcbiAgICAgICAgdXBsb2FkU3RhcnRlZDogZmFsc2VcbiAgICAgIH0sXG4gICAgICBzaXplOiBmaWxlLmRhdGEuc2l6ZSB8fCAwLFxuICAgICAgaXNSZW1vdGU6IGlzUmVtb3RlLFxuICAgICAgcmVtb3RlOiBmaWxlLnJlbW90ZSB8fCAnJyxcbiAgICAgIHByZXZpZXc6IGZpbGUucHJldmlld1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9jaGVja1Jlc3RyaWN0aW9ucyhuZXdGaWxlKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgb25FcnJvcihlcnIpXG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBmaWxlczogT2JqZWN0LmFzc2lnbih7fSwgZmlsZXMsIHtcbiAgICAgICAgW2ZpbGVJRF06IG5ld0ZpbGVcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHRoaXMuZW1pdCgnZmlsZS1hZGRlZCcsIG5ld0ZpbGUpXG4gICAgdGhpcy5sb2coYEFkZGVkIGZpbGU6ICR7ZmlsZU5hbWV9LCAke2ZpbGVJRH0sIG1pbWUgdHlwZTogJHtmaWxlVHlwZX1gKVxuXG4gICAgaWYgKHRoaXMub3B0cy5hdXRvUHJvY2VlZCAmJiAhdGhpcy5zY2hlZHVsZWRBdXRvUHJvY2VlZCkge1xuICAgICAgdGhpcy5zY2hlZHVsZWRBdXRvUHJvY2VlZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnNjaGVkdWxlZEF1dG9Qcm9jZWVkID0gbnVsbFxuICAgICAgICB0aGlzLnVwbG9hZCgpLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayB8fCBlcnIubWVzc2FnZSB8fCBlcnIpXG4gICAgICAgIH0pXG4gICAgICB9LCA0KVxuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUZpbGUgKGZpbGVJRCkge1xuICAgIGNvbnN0IHsgZmlsZXMsIGN1cnJlbnRVcGxvYWRzIH0gPSB0aGlzLmdldFN0YXRlKClcbiAgICBjb25zdCB1cGRhdGVkRmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCBmaWxlcylcbiAgICBjb25zdCByZW1vdmVkRmlsZSA9IHVwZGF0ZWRGaWxlc1tmaWxlSURdXG4gICAgZGVsZXRlIHVwZGF0ZWRGaWxlc1tmaWxlSURdXG5cbiAgICAvLyBSZW1vdmUgdGhpcyBmaWxlIGZyb20gaXRzIGBjdXJyZW50VXBsb2FkYC5cbiAgICBjb25zdCB1cGRhdGVkVXBsb2FkcyA9IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRVcGxvYWRzKVxuICAgIGNvbnN0IHJlbW92ZVVwbG9hZHMgPSBbXVxuICAgIE9iamVjdC5rZXlzKHVwZGF0ZWRVcGxvYWRzKS5mb3JFYWNoKCh1cGxvYWRJRCkgPT4ge1xuICAgICAgY29uc3QgbmV3RmlsZUlEcyA9IGN1cnJlbnRVcGxvYWRzW3VwbG9hZElEXS5maWxlSURzLmZpbHRlcigodXBsb2FkRmlsZUlEKSA9PiB1cGxvYWRGaWxlSUQgIT09IGZpbGVJRClcbiAgICAgIC8vIFJlbW92ZSB0aGUgdXBsb2FkIGlmIG5vIGZpbGVzIGFyZSBhc3NvY2lhdGVkIHdpdGggaXQgYW55bW9yZS5cbiAgICAgIGlmIChuZXdGaWxlSURzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZW1vdmVVcGxvYWRzLnB1c2godXBsb2FkSUQpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICB1cGRhdGVkVXBsb2Fkc1t1cGxvYWRJRF0gPSBPYmplY3QuYXNzaWduKHt9LCBjdXJyZW50VXBsb2Fkc1t1cGxvYWRJRF0sIHtcbiAgICAgICAgZmlsZUlEczogbmV3RmlsZUlEc1xuICAgICAgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjdXJyZW50VXBsb2FkczogdXBkYXRlZFVwbG9hZHMsXG4gICAgICBmaWxlczogdXBkYXRlZEZpbGVzXG4gICAgfSlcblxuICAgIHJlbW92ZVVwbG9hZHMuZm9yRWFjaCgodXBsb2FkSUQpID0+IHtcbiAgICAgIHRoaXMuX3JlbW92ZVVwbG9hZCh1cGxvYWRJRClcbiAgICB9KVxuXG4gICAgdGhpcy5fY2FsY3VsYXRlVG90YWxQcm9ncmVzcygpXG4gICAgdGhpcy5lbWl0KCdmaWxlLXJlbW92ZWQnLCByZW1vdmVkRmlsZSlcbiAgICB0aGlzLmxvZyhgRmlsZSByZW1vdmVkOiAke3JlbW92ZWRGaWxlLmlkfWApXG4gIH1cblxuICBwYXVzZVJlc3VtZSAoZmlsZUlEKSB7XG4gICAgaWYgKCF0aGlzLmdldFN0YXRlKCkuY2FwYWJpbGl0aWVzLnJlc3VtYWJsZVVwbG9hZHMgfHxcbiAgICAgICAgIHRoaXMuZ2V0RmlsZShmaWxlSUQpLnVwbG9hZENvbXBsZXRlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB3YXNQYXVzZWQgPSB0aGlzLmdldEZpbGUoZmlsZUlEKS5pc1BhdXNlZCB8fCBmYWxzZVxuICAgIGNvbnN0IGlzUGF1c2VkID0gIXdhc1BhdXNlZFxuXG4gICAgdGhpcy5zZXRGaWxlU3RhdGUoZmlsZUlELCB7XG4gICAgICBpc1BhdXNlZDogaXNQYXVzZWRcbiAgICB9KVxuXG4gICAgdGhpcy5lbWl0KCd1cGxvYWQtcGF1c2UnLCBmaWxlSUQsIGlzUGF1c2VkKVxuXG4gICAgcmV0dXJuIGlzUGF1c2VkXG4gIH1cblxuICBwYXVzZUFsbCAoKSB7XG4gICAgY29uc3QgdXBkYXRlZEZpbGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmZpbGVzKVxuICAgIGNvbnN0IGluUHJvZ3Jlc3NVcGRhdGVkRmlsZXMgPSBPYmplY3Qua2V5cyh1cGRhdGVkRmlsZXMpLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgcmV0dXJuICF1cGRhdGVkRmlsZXNbZmlsZV0ucHJvZ3Jlc3MudXBsb2FkQ29tcGxldGUgJiZcbiAgICAgICAgICAgICB1cGRhdGVkRmlsZXNbZmlsZV0ucHJvZ3Jlc3MudXBsb2FkU3RhcnRlZFxuICAgIH0pXG5cbiAgICBpblByb2dyZXNzVXBkYXRlZEZpbGVzLmZvckVhY2goKGZpbGUpID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZWRGaWxlID0gT2JqZWN0LmFzc2lnbih7fSwgdXBkYXRlZEZpbGVzW2ZpbGVdLCB7XG4gICAgICAgIGlzUGF1c2VkOiB0cnVlXG4gICAgICB9KVxuICAgICAgdXBkYXRlZEZpbGVzW2ZpbGVdID0gdXBkYXRlZEZpbGVcbiAgICB9KVxuICAgIHRoaXMuc2V0U3RhdGUoe2ZpbGVzOiB1cGRhdGVkRmlsZXN9KVxuXG4gICAgdGhpcy5lbWl0KCdwYXVzZS1hbGwnKVxuICB9XG5cbiAgcmVzdW1lQWxsICgpIHtcbiAgICBjb25zdCB1cGRhdGVkRmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgY29uc3QgaW5Qcm9ncmVzc1VwZGF0ZWRGaWxlcyA9IE9iamVjdC5rZXlzKHVwZGF0ZWRGaWxlcykuZmlsdGVyKChmaWxlKSA9PiB7XG4gICAgICByZXR1cm4gIXVwZGF0ZWRGaWxlc1tmaWxlXS5wcm9ncmVzcy51cGxvYWRDb21wbGV0ZSAmJlxuICAgICAgICAgICAgIHVwZGF0ZWRGaWxlc1tmaWxlXS5wcm9ncmVzcy51cGxvYWRTdGFydGVkXG4gICAgfSlcblxuICAgIGluUHJvZ3Jlc3NVcGRhdGVkRmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgY29uc3QgdXBkYXRlZEZpbGUgPSBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZV0sIHtcbiAgICAgICAgaXNQYXVzZWQ6IGZhbHNlLFxuICAgICAgICBlcnJvcjogbnVsbFxuICAgICAgfSlcbiAgICAgIHVwZGF0ZWRGaWxlc1tmaWxlXSA9IHVwZGF0ZWRGaWxlXG4gICAgfSlcbiAgICB0aGlzLnNldFN0YXRlKHtmaWxlczogdXBkYXRlZEZpbGVzfSlcblxuICAgIHRoaXMuZW1pdCgncmVzdW1lLWFsbCcpXG4gIH1cblxuICByZXRyeUFsbCAoKSB7XG4gICAgY29uc3QgdXBkYXRlZEZpbGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmZpbGVzKVxuICAgIGNvbnN0IGZpbGVzVG9SZXRyeSA9IE9iamVjdC5rZXlzKHVwZGF0ZWRGaWxlcykuZmlsdGVyKGZpbGUgPT4ge1xuICAgICAgcmV0dXJuIHVwZGF0ZWRGaWxlc1tmaWxlXS5lcnJvclxuICAgIH0pXG5cbiAgICBmaWxlc1RvUmV0cnkuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgY29uc3QgdXBkYXRlZEZpbGUgPSBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZV0sIHtcbiAgICAgICAgaXNQYXVzZWQ6IGZhbHNlLFxuICAgICAgICBlcnJvcjogbnVsbFxuICAgICAgfSlcbiAgICAgIHVwZGF0ZWRGaWxlc1tmaWxlXSA9IHVwZGF0ZWRGaWxlXG4gICAgfSlcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGZpbGVzOiB1cGRhdGVkRmlsZXMsXG4gICAgICBlcnJvcjogbnVsbFxuICAgIH0pXG5cbiAgICB0aGlzLmVtaXQoJ3JldHJ5LWFsbCcsIGZpbGVzVG9SZXRyeSlcblxuICAgIGNvbnN0IHVwbG9hZElEID0gdGhpcy5fY3JlYXRlVXBsb2FkKGZpbGVzVG9SZXRyeSlcbiAgICByZXR1cm4gdGhpcy5fcnVuVXBsb2FkKHVwbG9hZElEKVxuICB9XG5cbiAgY2FuY2VsQWxsICgpIHtcbiAgICB0aGlzLmVtaXQoJ2NhbmNlbC1hbGwnKVxuXG4gICAgY29uc3QgZmlsZXMgPSBPYmplY3Qua2V5cyh0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgZmlsZXMuZm9yRWFjaCgoZmlsZUlEKSA9PiB7XG4gICAgICB0aGlzLnJlbW92ZUZpbGUoZmlsZUlEKVxuICAgIH0pXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGFsbG93TmV3VXBsb2FkOiB0cnVlLFxuICAgICAgdG90YWxQcm9ncmVzczogMCxcbiAgICAgIGVycm9yOiBudWxsXG4gICAgfSlcbiAgfVxuXG4gIHJldHJ5VXBsb2FkIChmaWxlSUQpIHtcbiAgICBjb25zdCB1cGRhdGVkRmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgY29uc3QgdXBkYXRlZEZpbGUgPSBPYmplY3QuYXNzaWduKHt9LCB1cGRhdGVkRmlsZXNbZmlsZUlEXSxcbiAgICAgIHsgZXJyb3I6IG51bGwsIGlzUGF1c2VkOiBmYWxzZSB9XG4gICAgKVxuICAgIHVwZGF0ZWRGaWxlc1tmaWxlSURdID0gdXBkYXRlZEZpbGVcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGZpbGVzOiB1cGRhdGVkRmlsZXNcbiAgICB9KVxuXG4gICAgdGhpcy5lbWl0KCd1cGxvYWQtcmV0cnknLCBmaWxlSUQpXG5cbiAgICBjb25zdCB1cGxvYWRJRCA9IHRoaXMuX2NyZWF0ZVVwbG9hZChbIGZpbGVJRCBdKVxuICAgIHJldHVybiB0aGlzLl9ydW5VcGxvYWQodXBsb2FkSUQpXG4gIH1cblxuICByZXNldCAoKSB7XG4gICAgdGhpcy5jYW5jZWxBbGwoKVxuICB9XG5cbiAgX2NhbGN1bGF0ZVByb2dyZXNzIChmaWxlLCBkYXRhKSB7XG4gICAgaWYgKCF0aGlzLmdldEZpbGUoZmlsZS5pZCkpIHtcbiAgICAgIHRoaXMubG9nKGBOb3Qgc2V0dGluZyBwcm9ncmVzcyBmb3IgYSBmaWxlIHRoYXQgaGFzIGJlZW4gcmVtb3ZlZDogJHtmaWxlLmlkfWApXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLnNldEZpbGVTdGF0ZShmaWxlLmlkLCB7XG4gICAgICBwcm9ncmVzczogT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRGaWxlKGZpbGUuaWQpLnByb2dyZXNzLCB7XG4gICAgICAgIGJ5dGVzVXBsb2FkZWQ6IGRhdGEuYnl0ZXNVcGxvYWRlZCxcbiAgICAgICAgYnl0ZXNUb3RhbDogZGF0YS5ieXRlc1RvdGFsLFxuICAgICAgICBwZXJjZW50YWdlOiBNYXRoLmZsb29yKChkYXRhLmJ5dGVzVXBsb2FkZWQgLyBkYXRhLmJ5dGVzVG90YWwgKiAxMDApLnRvRml4ZWQoMikpXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICB0aGlzLl9jYWxjdWxhdGVUb3RhbFByb2dyZXNzKClcbiAgfVxuXG4gIF9jYWxjdWxhdGVUb3RhbFByb2dyZXNzICgpIHtcbiAgICAvLyBjYWxjdWxhdGUgdG90YWwgcHJvZ3Jlc3MsIHVzaW5nIHRoZSBudW1iZXIgb2YgZmlsZXMgY3VycmVudGx5IHVwbG9hZGluZyxcbiAgICAvLyBtdWx0aXBsaWVkIGJ5IDEwMCBhbmQgdGhlIHN1bW0gb2YgaW5kaXZpZHVhbCBwcm9ncmVzcyBvZiBlYWNoIGZpbGVcbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuZ2V0RmlsZXMoKVxuXG4gICAgY29uc3QgaW5Qcm9ncmVzcyA9IGZpbGVzLmZpbHRlcigoZmlsZSkgPT4ge1xuICAgICAgcmV0dXJuIGZpbGUucHJvZ3Jlc3MudXBsb2FkU3RhcnRlZFxuICAgIH0pXG5cbiAgICBpZiAoaW5Qcm9ncmVzcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyB0b3RhbFByb2dyZXNzOiAwIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBzaXplZEZpbGVzID0gaW5Qcm9ncmVzcy5maWx0ZXIoKGZpbGUpID0+IGZpbGUucHJvZ3Jlc3MuYnl0ZXNUb3RhbCAhPSBudWxsKVxuICAgIGNvbnN0IHVuc2l6ZWRGaWxlcyA9IGluUHJvZ3Jlc3MuZmlsdGVyKChmaWxlKSA9PiBmaWxlLnByb2dyZXNzLmJ5dGVzVG90YWwgPT0gbnVsbClcblxuICAgIGlmIChzaXplZEZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3QgcHJvZ3Jlc3NNYXggPSBpblByb2dyZXNzLmxlbmd0aFxuICAgICAgY29uc3QgY3VycmVudFByb2dyZXNzID0gdW5zaXplZEZpbGVzLnJlZHVjZSgoYWNjLCBmaWxlKSA9PiB7XG4gICAgICAgIHJldHVybiBhY2MgKyBmaWxlLnByb2dyZXNzLnBlcmNlbnRhZ2VcbiAgICAgIH0sIDApXG4gICAgICBjb25zdCB0b3RhbFByb2dyZXNzID0gTWF0aC5yb3VuZChjdXJyZW50UHJvZ3Jlc3MgLyBwcm9ncmVzc01heCAqIDEwMClcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyB0b3RhbFByb2dyZXNzIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBsZXQgdG90YWxTaXplID0gc2l6ZWRGaWxlcy5yZWR1Y2UoKGFjYywgZmlsZSkgPT4ge1xuICAgICAgcmV0dXJuIGFjYyArIGZpbGUucHJvZ3Jlc3MuYnl0ZXNUb3RhbFxuICAgIH0sIDApXG4gICAgY29uc3QgYXZlcmFnZVNpemUgPSB0b3RhbFNpemUgLyBzaXplZEZpbGVzLmxlbmd0aFxuICAgIHRvdGFsU2l6ZSArPSBhdmVyYWdlU2l6ZSAqIHVuc2l6ZWRGaWxlcy5sZW5ndGhcblxuICAgIGxldCB1cGxvYWRlZFNpemUgPSAwXG4gICAgc2l6ZWRGaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICB1cGxvYWRlZFNpemUgKz0gZmlsZS5wcm9ncmVzcy5ieXRlc1VwbG9hZGVkXG4gICAgfSlcbiAgICB1bnNpemVkRmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgdXBsb2FkZWRTaXplICs9IGF2ZXJhZ2VTaXplICogKGZpbGUucHJvZ3Jlc3MucGVyY2VudGFnZSB8fCAwKVxuICAgIH0pXG5cbiAgICBjb25zdCB0b3RhbFByb2dyZXNzID0gdG90YWxTaXplID09PSAwXG4gICAgICA/IDBcbiAgICAgIDogTWF0aC5yb3VuZCh1cGxvYWRlZFNpemUgLyB0b3RhbFNpemUgKiAxMDApXG5cbiAgICB0aGlzLnNldFN0YXRlKHsgdG90YWxQcm9ncmVzcyB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBsaXN0ZW5lcnMgZm9yIGFsbCBnbG9iYWwgYWN0aW9ucywgbGlrZTpcbiAgICogYGVycm9yYCwgYGZpbGUtcmVtb3ZlZGAsIGB1cGxvYWQtcHJvZ3Jlc3NgXG4gICAqL1xuICBfYWRkTGlzdGVuZXJzICgpIHtcbiAgICB0aGlzLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pXG4gICAgfSlcblxuICAgIHRoaXMub24oJ3VwbG9hZC1lcnJvcicsIChmaWxlLCBlcnJvcikgPT4ge1xuICAgICAgdGhpcy5zZXRGaWxlU3RhdGUoZmlsZS5pZCwgeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pXG5cbiAgICAgIGxldCBtZXNzYWdlID0gdGhpcy5pMThuKCdmYWlsZWRUb1VwbG9hZCcsIHsgZmlsZTogZmlsZS5uYW1lIH0pXG4gICAgICBpZiAodHlwZW9mIGVycm9yID09PSAnb2JqZWN0JyAmJiBlcnJvci5tZXNzYWdlKSB7XG4gICAgICAgIG1lc3NhZ2UgPSB7IG1lc3NhZ2U6IG1lc3NhZ2UsIGRldGFpbHM6IGVycm9yLm1lc3NhZ2UgfVxuICAgICAgfVxuICAgICAgdGhpcy5pbmZvKG1lc3NhZ2UsICdlcnJvcicsIDUwMDApXG4gICAgfSlcblxuICAgIHRoaXMub24oJ3VwbG9hZCcsICgpID0+IHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBlcnJvcjogbnVsbCB9KVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCd1cGxvYWQtc3RhcnRlZCcsIChmaWxlLCB1cGxvYWQpID0+IHtcbiAgICAgIGlmICghdGhpcy5nZXRGaWxlKGZpbGUuaWQpKSB7XG4gICAgICAgIHRoaXMubG9nKGBOb3Qgc2V0dGluZyBwcm9ncmVzcyBmb3IgYSBmaWxlIHRoYXQgaGFzIGJlZW4gcmVtb3ZlZDogJHtmaWxlLmlkfWApXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhpcy5zZXRGaWxlU3RhdGUoZmlsZS5pZCwge1xuICAgICAgICBwcm9ncmVzczoge1xuICAgICAgICAgIHVwbG9hZFN0YXJ0ZWQ6IERhdGUubm93KCksXG4gICAgICAgICAgdXBsb2FkQ29tcGxldGU6IGZhbHNlLFxuICAgICAgICAgIHBlcmNlbnRhZ2U6IDAsXG4gICAgICAgICAgYnl0ZXNVcGxvYWRlZDogMCxcbiAgICAgICAgICBieXRlc1RvdGFsOiBmaWxlLnNpemVcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgLy8gdXBsb2FkIHByb2dyZXNzIGV2ZW50cyBjYW4gb2NjdXIgZnJlcXVlbnRseSwgZXNwZWNpYWxseSB3aGVuIHlvdSBoYXZlIGEgZ29vZFxuICAgIC8vIGNvbm5lY3Rpb24gdG8gdGhlIHJlbW90ZSBzZXJ2ZXIuIFRoZXJlZm9yZSwgd2UgYXJlIHRocm90dGVsaW5nIHRoZW0gdG9cbiAgICAvLyBwcmV2ZW50IGFjY2Vzc2l2ZSBmdW5jdGlvbiBjYWxscy5cbiAgICAvLyBzZWUgYWxzbzogaHR0cHM6Ly9naXRodWIuY29tL3R1cy90dXMtanMtY2xpZW50L2NvbW1pdC85OTQwZjI3YjIzNjFmZDdlMTBiYTU4YjA5YjYwZDgyNDIyMTgzYmJiXG4gICAgLy8gY29uc3QgX3Rocm90dGxlZENhbGN1bGF0ZVByb2dyZXNzID0gdGhyb3R0bGUodGhpcy5fY2FsY3VsYXRlUHJvZ3Jlc3MsIDEwMCwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KVxuXG4gICAgdGhpcy5vbigndXBsb2FkLXByb2dyZXNzJywgdGhpcy5fY2FsY3VsYXRlUHJvZ3Jlc3MpXG5cbiAgICB0aGlzLm9uKCd1cGxvYWQtc3VjY2VzcycsIChmaWxlLCB1cGxvYWRSZXNwLCB1cGxvYWRVUkwpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRQcm9ncmVzcyA9IHRoaXMuZ2V0RmlsZShmaWxlLmlkKS5wcm9ncmVzc1xuICAgICAgdGhpcy5zZXRGaWxlU3RhdGUoZmlsZS5pZCwge1xuICAgICAgICBwcm9ncmVzczogT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudFByb2dyZXNzLCB7XG4gICAgICAgICAgdXBsb2FkQ29tcGxldGU6IHRydWUsXG4gICAgICAgICAgcGVyY2VudGFnZTogMTAwLFxuICAgICAgICAgIGJ5dGVzVXBsb2FkZWQ6IGN1cnJlbnRQcm9ncmVzcy5ieXRlc1RvdGFsXG4gICAgICAgIH0pLFxuICAgICAgICB1cGxvYWRVUkw6IHVwbG9hZFVSTCxcbiAgICAgICAgaXNQYXVzZWQ6IGZhbHNlXG4gICAgICB9KVxuXG4gICAgICB0aGlzLl9jYWxjdWxhdGVUb3RhbFByb2dyZXNzKClcbiAgICB9KVxuXG4gICAgdGhpcy5vbigncHJlcHJvY2Vzcy1wcm9ncmVzcycsIChmaWxlLCBwcm9ncmVzcykgPT4ge1xuICAgICAgaWYgKCF0aGlzLmdldEZpbGUoZmlsZS5pZCkpIHtcbiAgICAgICAgdGhpcy5sb2coYE5vdCBzZXR0aW5nIHByb2dyZXNzIGZvciBhIGZpbGUgdGhhdCBoYXMgYmVlbiByZW1vdmVkOiAke2ZpbGUuaWR9YClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLnNldEZpbGVTdGF0ZShmaWxlLmlkLCB7XG4gICAgICAgIHByb2dyZXNzOiBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldEZpbGUoZmlsZS5pZCkucHJvZ3Jlc3MsIHtcbiAgICAgICAgICBwcmVwcm9jZXNzOiBwcm9ncmVzc1xuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5vbigncHJlcHJvY2Vzcy1jb21wbGV0ZScsIChmaWxlKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuZ2V0RmlsZShmaWxlLmlkKSkge1xuICAgICAgICB0aGlzLmxvZyhgTm90IHNldHRpbmcgcHJvZ3Jlc3MgZm9yIGEgZmlsZSB0aGF0IGhhcyBiZWVuIHJlbW92ZWQ6ICR7ZmlsZS5pZH1gKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGNvbnN0IGZpbGVzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmZpbGVzKVxuICAgICAgZmlsZXNbZmlsZS5pZF0gPSBPYmplY3QuYXNzaWduKHt9LCBmaWxlc1tmaWxlLmlkXSwge1xuICAgICAgICBwcm9ncmVzczogT2JqZWN0LmFzc2lnbih7fSwgZmlsZXNbZmlsZS5pZF0ucHJvZ3Jlc3MpXG4gICAgICB9KVxuICAgICAgZGVsZXRlIGZpbGVzW2ZpbGUuaWRdLnByb2dyZXNzLnByZXByb2Nlc3NcblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGZpbGVzOiBmaWxlcyB9KVxuICAgIH0pXG5cbiAgICB0aGlzLm9uKCdwb3N0cHJvY2Vzcy1wcm9ncmVzcycsIChmaWxlLCBwcm9ncmVzcykgPT4ge1xuICAgICAgaWYgKCF0aGlzLmdldEZpbGUoZmlsZS5pZCkpIHtcbiAgICAgICAgdGhpcy5sb2coYE5vdCBzZXR0aW5nIHByb2dyZXNzIGZvciBhIGZpbGUgdGhhdCBoYXMgYmVlbiByZW1vdmVkOiAke2ZpbGUuaWR9YClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICB0aGlzLnNldEZpbGVTdGF0ZShmaWxlLmlkLCB7XG4gICAgICAgIHByb2dyZXNzOiBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXNbZmlsZS5pZF0ucHJvZ3Jlc3MsIHtcbiAgICAgICAgICBwb3N0cHJvY2VzczogcHJvZ3Jlc3NcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHRoaXMub24oJ3Bvc3Rwcm9jZXNzLWNvbXBsZXRlJywgKGZpbGUpID0+IHtcbiAgICAgIGlmICghdGhpcy5nZXRGaWxlKGZpbGUuaWQpKSB7XG4gICAgICAgIHRoaXMubG9nKGBOb3Qgc2V0dGluZyBwcm9ncmVzcyBmb3IgYSBmaWxlIHRoYXQgaGFzIGJlZW4gcmVtb3ZlZDogJHtmaWxlLmlkfWApXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgY29uc3QgZmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmdldFN0YXRlKCkuZmlsZXMpXG4gICAgICBmaWxlc1tmaWxlLmlkXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpbGVzW2ZpbGUuaWRdLCB7XG4gICAgICAgIHByb2dyZXNzOiBPYmplY3QuYXNzaWduKHt9LCBmaWxlc1tmaWxlLmlkXS5wcm9ncmVzcylcbiAgICAgIH0pXG4gICAgICBkZWxldGUgZmlsZXNbZmlsZS5pZF0ucHJvZ3Jlc3MucG9zdHByb2Nlc3NcbiAgICAgIC8vIFRPRE8gc2hvdWxkIHdlIHNldCBzb21lIGtpbmQgb2YgYGZ1bGx5Q29tcGxldGVgIHByb3BlcnR5IG9uIHRoZSBmaWxlIG9iamVjdFxuICAgICAgLy8gc28gaXQncyBlYXNpZXIgdG8gc2VlIHRoYXQgdGhlIGZpbGUgaXMgdXBsb2Fk4oCmZnVsbHkgY29tcGxldGXigKZyYXRoZXIgdGhhblxuICAgICAgLy8gd2hhdCB3ZSBoYXZlIHRvIGRvIG5vdyAoYHVwbG9hZENvbXBsZXRlICYmICFwb3N0cHJvY2Vzc2ApXG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBmaWxlczogZmlsZXMgfSlcbiAgICB9KVxuXG4gICAgdGhpcy5vbigncmVzdG9yZWQnLCAoKSA9PiB7XG4gICAgICAvLyBGaWxlcyBtYXkgaGF2ZSBjaGFuZ2VkLS1lbnN1cmUgcHJvZ3Jlc3MgaXMgc3RpbGwgYWNjdXJhdGUuXG4gICAgICB0aGlzLl9jYWxjdWxhdGVUb3RhbFByb2dyZXNzKClcbiAgICB9KVxuXG4gICAgLy8gc2hvdyBpbmZvcm1lciBpZiBvZmZsaW5lXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb25saW5lJywgKCkgPT4gdGhpcy51cGRhdGVPbmxpbmVTdGF0dXMoKSlcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvZmZsaW5lJywgKCkgPT4gdGhpcy51cGRhdGVPbmxpbmVTdGF0dXMoKSlcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGVPbmxpbmVTdGF0dXMoKSwgMzAwMClcbiAgICB9XG4gIH1cblxuICB1cGRhdGVPbmxpbmVTdGF0dXMgKCkge1xuICAgIGNvbnN0IG9ubGluZSA9XG4gICAgICB0eXBlb2Ygd2luZG93Lm5hdmlnYXRvci5vbkxpbmUgIT09ICd1bmRlZmluZWQnXG4gICAgICAgID8gd2luZG93Lm5hdmlnYXRvci5vbkxpbmVcbiAgICAgICAgOiB0cnVlXG4gICAgaWYgKCFvbmxpbmUpIHtcbiAgICAgIHRoaXMuZW1pdCgnaXMtb2ZmbGluZScpXG4gICAgICB0aGlzLmluZm8odGhpcy5pMThuKCdub0ludGVybmV0Q29ubmVjdGlvbicpLCAnZXJyb3InLCAwKVxuICAgICAgdGhpcy53YXNPZmZsaW5lID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVtaXQoJ2lzLW9ubGluZScpXG4gICAgICBpZiAodGhpcy53YXNPZmZsaW5lKSB7XG4gICAgICAgIHRoaXMuZW1pdCgnYmFjay1vbmxpbmUnKVxuICAgICAgICB0aGlzLmluZm8odGhpcy5pMThuKCdjb25uZWN0ZWRUb0ludGVybmV0JyksICdzdWNjZXNzJywgMzAwMClcbiAgICAgICAgdGhpcy53YXNPZmZsaW5lID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRJRCAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0cy5pZFxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIHBsdWdpbiB3aXRoIENvcmUuXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBQbHVnaW4gb2JqZWN0XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0c10gb2JqZWN0IHdpdGggb3B0aW9ucyB0byBiZSBwYXNzZWQgdG8gUGx1Z2luXG4gICAqIEByZXR1cm4ge09iamVjdH0gc2VsZiBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHVzZSAoUGx1Z2luLCBvcHRzKSB7XG4gICAgaWYgKHR5cGVvZiBQbHVnaW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGxldCBtc2cgPSBgRXhwZWN0ZWQgYSBwbHVnaW4gY2xhc3MsIGJ1dCBnb3QgJHtQbHVnaW4gPT09IG51bGwgPyAnbnVsbCcgOiB0eXBlb2YgUGx1Z2lufS5gICtcbiAgICAgICAgJyBQbGVhc2UgdmVyaWZ5IHRoYXQgdGhlIHBsdWdpbiB3YXMgaW1wb3J0ZWQgYW5kIHNwZWxsZWQgY29ycmVjdGx5LidcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IobXNnKVxuICAgIH1cblxuICAgIC8vIEluc3RhbnRpYXRlXG4gICAgY29uc3QgcGx1Z2luID0gbmV3IFBsdWdpbih0aGlzLCBvcHRzKVxuICAgIGNvbnN0IHBsdWdpbklkID0gcGx1Z2luLmlkXG4gICAgdGhpcy5wbHVnaW5zW3BsdWdpbi50eXBlXSA9IHRoaXMucGx1Z2luc1twbHVnaW4udHlwZV0gfHwgW11cblxuICAgIGlmICghcGx1Z2luSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignWW91ciBwbHVnaW4gbXVzdCBoYXZlIGFuIGlkJylcbiAgICB9XG5cbiAgICBpZiAoIXBsdWdpbi50eXBlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdXIgcGx1Z2luIG11c3QgaGF2ZSBhIHR5cGUnKVxuICAgIH1cblxuICAgIGxldCBleGlzdHNQbHVnaW5BbHJlYWR5ID0gdGhpcy5nZXRQbHVnaW4ocGx1Z2luSWQpXG4gICAgaWYgKGV4aXN0c1BsdWdpbkFscmVhZHkpIHtcbiAgICAgIGxldCBtc2cgPSBgQWxyZWFkeSBmb3VuZCBhIHBsdWdpbiBuYW1lZCAnJHtleGlzdHNQbHVnaW5BbHJlYWR5LmlkfScuIGAgK1xuICAgICAgICBgVHJpZWQgdG8gdXNlOiAnJHtwbHVnaW5JZH0nLlxcbmAgK1xuICAgICAgICBgVXBweSBwbHVnaW5zIG11c3QgaGF2ZSB1bmlxdWUgJ2lkJyBvcHRpb25zLiBTZWUgaHR0cHM6Ly91cHB5LmlvL2RvY3MvcGx1Z2lucy8jaWQuYFxuICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZylcbiAgICB9XG5cbiAgICB0aGlzLnBsdWdpbnNbcGx1Z2luLnR5cGVdLnB1c2gocGx1Z2luKVxuICAgIHBsdWdpbi5pbnN0YWxsKClcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogRmluZCBvbmUgUGx1Z2luIGJ5IG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBwbHVnaW4gaWRcbiAgICogQHJldHVybiB7b2JqZWN0IHwgYm9vbGVhbn1cbiAgICovXG4gIGdldFBsdWdpbiAoaWQpIHtcbiAgICBsZXQgZm91bmRQbHVnaW4gPSBudWxsXG4gICAgdGhpcy5pdGVyYXRlUGx1Z2lucygocGx1Z2luKSA9PiB7XG4gICAgICBpZiAocGx1Z2luLmlkID09PSBpZCkge1xuICAgICAgICBmb3VuZFBsdWdpbiA9IHBsdWdpblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBmb3VuZFBsdWdpblxuICB9XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgdGhyb3VnaCBhbGwgYHVzZWBkIHBsdWdpbnMuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1ldGhvZCB0aGF0IHdpbGwgYmUgcnVuIG9uIGVhY2ggcGx1Z2luXG4gICAqL1xuICBpdGVyYXRlUGx1Z2lucyAobWV0aG9kKSB7XG4gICAgT2JqZWN0LmtleXModGhpcy5wbHVnaW5zKS5mb3JFYWNoKHBsdWdpblR5cGUgPT4ge1xuICAgICAgdGhpcy5wbHVnaW5zW3BsdWdpblR5cGVdLmZvckVhY2gobWV0aG9kKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogVW5pbnN0YWxsIGFuZCByZW1vdmUgYSBwbHVnaW4uXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBpbnN0YW5jZSBUaGUgcGx1Z2luIGluc3RhbmNlIHRvIHJlbW92ZS5cbiAgICovXG4gIHJlbW92ZVBsdWdpbiAoaW5zdGFuY2UpIHtcbiAgICB0aGlzLmxvZyhgUmVtb3ZpbmcgcGx1Z2luICR7aW5zdGFuY2UuaWR9YClcbiAgICB0aGlzLmVtaXQoJ3BsdWdpbi1yZW1vdmUnLCBpbnN0YW5jZSlcblxuICAgIGlmIChpbnN0YW5jZS51bmluc3RhbGwpIHtcbiAgICAgIGluc3RhbmNlLnVuaW5zdGFsbCgpXG4gICAgfVxuXG4gICAgY29uc3QgbGlzdCA9IHRoaXMucGx1Z2luc1tpbnN0YW5jZS50eXBlXS5zbGljZSgpXG4gICAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YoaW5zdGFuY2UpXG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICB0aGlzLnBsdWdpbnNbaW5zdGFuY2UudHlwZV0gPSBsaXN0XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZFN0YXRlID0gdGhpcy5nZXRTdGF0ZSgpXG4gICAgZGVsZXRlIHVwZGF0ZWRTdGF0ZS5wbHVnaW5zW2luc3RhbmNlLmlkXVxuICAgIHRoaXMuc2V0U3RhdGUodXBkYXRlZFN0YXRlKVxuICB9XG5cbiAgLyoqXG4gICAqIFVuaW5zdGFsbCBhbGwgcGx1Z2lucyBhbmQgY2xvc2UgZG93biB0aGlzIFVwcHkgaW5zdGFuY2UuXG4gICAqL1xuICBjbG9zZSAoKSB7XG4gICAgdGhpcy5sb2coYENsb3NpbmcgVXBweSBpbnN0YW5jZSAke3RoaXMub3B0cy5pZH06IHJlbW92aW5nIGFsbCBmaWxlcyBhbmQgdW5pbnN0YWxsaW5nIHBsdWdpbnNgKVxuXG4gICAgdGhpcy5yZXNldCgpXG5cbiAgICB0aGlzLl9zdG9yZVVuc3Vic2NyaWJlKClcblxuICAgIHRoaXMuaXRlcmF0ZVBsdWdpbnMoKHBsdWdpbikgPT4ge1xuICAgICAgdGhpcy5yZW1vdmVQbHVnaW4ocGx1Z2luKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgKiBTZXQgaW5mbyBtZXNzYWdlIGluIGBzdGF0ZS5pbmZvYCwgc28gdGhhdCBVSSBwbHVnaW5zIGxpa2UgYEluZm9ybWVyYFxuICAqIGNhbiBkaXNwbGF5IHRoZSBtZXNzYWdlLlxuICAqXG4gICogQHBhcmFtIHtzdHJpbmcgfCBvYmplY3R9IG1lc3NhZ2UgTWVzc2FnZSB0byBiZSBkaXNwbGF5ZWQgYnkgdGhlIGluZm9ybWVyXG4gICogQHBhcmFtIHtzdHJpbmd9IFt0eXBlXVxuICAqIEBwYXJhbSB7bnVtYmVyfSBbZHVyYXRpb25dXG4gICovXG5cbiAgaW5mbyAobWVzc2FnZSwgdHlwZSA9ICdpbmZvJywgZHVyYXRpb24gPSAzMDAwKSB7XG4gICAgY29uc3QgaXNDb21wbGV4TWVzc2FnZSA9IHR5cGVvZiBtZXNzYWdlID09PSAnb2JqZWN0J1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpbmZvOiB7XG4gICAgICAgIGlzSGlkZGVuOiBmYWxzZSxcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgbWVzc2FnZTogaXNDb21wbGV4TWVzc2FnZSA/IG1lc3NhZ2UubWVzc2FnZSA6IG1lc3NhZ2UsXG4gICAgICAgIGRldGFpbHM6IGlzQ29tcGxleE1lc3NhZ2UgPyBtZXNzYWdlLmRldGFpbHMgOiBudWxsXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuZW1pdCgnaW5mby12aXNpYmxlJylcblxuICAgIGNsZWFyVGltZW91dCh0aGlzLmluZm9UaW1lb3V0SUQpXG4gICAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgICB0aGlzLmluZm9UaW1lb3V0SUQgPSB1bmRlZmluZWRcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIGhpZGUgdGhlIGluZm9ybWVyIGFmdGVyIGBkdXJhdGlvbmAgbWlsbGlzZWNvbmRzXG4gICAgdGhpcy5pbmZvVGltZW91dElEID0gc2V0VGltZW91dCh0aGlzLmhpZGVJbmZvLCBkdXJhdGlvbilcbiAgfVxuXG4gIGhpZGVJbmZvICgpIHtcbiAgICBjb25zdCBuZXdJbmZvID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5nZXRTdGF0ZSgpLmluZm8sIHtcbiAgICAgIGlzSGlkZGVuOiB0cnVlXG4gICAgfSlcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGluZm86IG5ld0luZm9cbiAgICB9KVxuICAgIHRoaXMuZW1pdCgnaW5mby1oaWRkZW4nKVxuICB9XG5cbiAgLyoqXG4gICAqIExvZ3Mgc3R1ZmYgdG8gY29uc29sZSwgb25seSBpZiBgZGVidWdgIGlzIHNldCB0byB0cnVlLiBTaWxlbnQgaW4gcHJvZHVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBtc2cgdG8gbG9nXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbdHlwZV0gb3B0aW9uYWwgYGVycm9yYCBvciBgd2FybmluZ2BcbiAgICovXG4gIGxvZyAobXNnLCB0eXBlKSB7XG4gICAgaWYgKCF0aGlzLm9wdHMuZGVidWcpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxldCBtZXNzYWdlID0gYFtVcHB5XSBbJHtnZXRUaW1lU3RhbXAoKX1dICR7bXNnfWBcblxuICAgIHdpbmRvd1sndXBweUxvZyddID0gd2luZG93Wyd1cHB5TG9nJ10gKyAnXFxuJyArICdERUJVRyBMT0c6ICcgKyBtc2dcblxuICAgIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PT0gJ3dhcm5pbmcnKSB7XG4gICAgICBjb25zb2xlLndhcm4obWVzc2FnZSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChtc2cgPT09IGAke21zZ31gKSB7XG4gICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKVxuICAgIH0gZWxzZSB7XG4gICAgICBtZXNzYWdlID0gYFtVcHB5XSBbJHtnZXRUaW1lU3RhbXAoKX1dYFxuICAgICAgY29uc29sZS5sb2cobWVzc2FnZSlcbiAgICAgIGNvbnNvbGUuZGlyKG1zZylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT2Jzb2xldGUsIGV2ZW50IGxpc3RlbmVycyBhcmUgbm93IGFkZGVkIGluIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICovXG4gIHJ1biAoKSB7XG4gICAgdGhpcy5sb2coJ0NhbGxpbmcgcnVuKCkgaXMgbm8gbG9uZ2VyIG5lY2Vzc2FyeS4nLCAnd2FybmluZycpXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0b3JlIGFuIHVwbG9hZCBieSBpdHMgSUQuXG4gICAqL1xuICByZXN0b3JlICh1cGxvYWRJRCkge1xuICAgIHRoaXMubG9nKGBDb3JlOiBhdHRlbXB0aW5nIHRvIHJlc3RvcmUgdXBsb2FkIFwiJHt1cGxvYWRJRH1cImApXG5cbiAgICBpZiAoIXRoaXMuZ2V0U3RhdGUoKS5jdXJyZW50VXBsb2Fkc1t1cGxvYWRJRF0pIHtcbiAgICAgIHRoaXMuX3JlbW92ZVVwbG9hZCh1cGxvYWRJRClcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vbmV4aXN0ZW50IHVwbG9hZCcpKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9ydW5VcGxvYWQodXBsb2FkSUQpXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuIHVwbG9hZCBmb3IgYSBidW5jaCBvZiBmaWxlcy5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheTxzdHJpbmc+fSBmaWxlSURzIEZpbGUgSURzIHRvIGluY2x1ZGUgaW4gdGhpcyB1cGxvYWQuXG4gICAqIEByZXR1cm4ge3N0cmluZ30gSUQgb2YgdGhpcyB1cGxvYWQuXG4gICAqL1xuICBfY3JlYXRlVXBsb2FkIChmaWxlSURzKSB7XG4gICAgY29uc3QgeyBhbGxvd05ld1VwbG9hZCwgY3VycmVudFVwbG9hZHMgfSA9IHRoaXMuZ2V0U3RhdGUoKVxuICAgIGlmICghYWxsb3dOZXdVcGxvYWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGNyZWF0ZSBhIG5ldyB1cGxvYWQ6IGFscmVhZHkgdXBsb2FkaW5nLicpXG4gICAgfVxuXG4gICAgY29uc3QgdXBsb2FkSUQgPSBjdWlkKClcblxuICAgIHRoaXMuZW1pdCgndXBsb2FkJywge1xuICAgICAgaWQ6IHVwbG9hZElELFxuICAgICAgZmlsZUlEczogZmlsZUlEc1xuICAgIH0pXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGFsbG93TmV3VXBsb2FkOiB0aGlzLm9wdHMuYWxsb3dNdWx0aXBsZVVwbG9hZHMgIT09IGZhbHNlLFxuXG4gICAgICBjdXJyZW50VXBsb2Fkczoge1xuICAgICAgICAuLi5jdXJyZW50VXBsb2FkcyxcbiAgICAgICAgW3VwbG9hZElEXToge1xuICAgICAgICAgIGZpbGVJRHM6IGZpbGVJRHMsXG4gICAgICAgICAgc3RlcDogMCxcbiAgICAgICAgICByZXN1bHQ6IHt9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgcmV0dXJuIHVwbG9hZElEXG4gIH1cblxuICBfZ2V0VXBsb2FkICh1cGxvYWRJRCkge1xuICAgIGNvbnN0IHsgY3VycmVudFVwbG9hZHMgfSA9IHRoaXMuZ2V0U3RhdGUoKVxuXG4gICAgcmV0dXJuIGN1cnJlbnRVcGxvYWRzW3VwbG9hZElEXVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBkYXRhIHRvIGFuIHVwbG9hZCdzIHJlc3VsdCBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cGxvYWRJRCBUaGUgSUQgb2YgdGhlIHVwbG9hZC5cbiAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgRGF0YSBwcm9wZXJ0aWVzIHRvIGFkZCB0byB0aGUgcmVzdWx0IG9iamVjdC5cbiAgICovXG4gIGFkZFJlc3VsdERhdGEgKHVwbG9hZElELCBkYXRhKSB7XG4gICAgaWYgKCF0aGlzLl9nZXRVcGxvYWQodXBsb2FkSUQpKSB7XG4gICAgICB0aGlzLmxvZyhgTm90IHNldHRpbmcgcmVzdWx0IGZvciBhbiB1cGxvYWQgdGhhdCBoYXMgYmVlbiByZW1vdmVkOiAke3VwbG9hZElEfWApXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgY3VycmVudFVwbG9hZHMgPSB0aGlzLmdldFN0YXRlKCkuY3VycmVudFVwbG9hZHNcbiAgICBjb25zdCBjdXJyZW50VXBsb2FkID0gT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudFVwbG9hZHNbdXBsb2FkSURdLCB7XG4gICAgICByZXN1bHQ6IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRVcGxvYWRzW3VwbG9hZElEXS5yZXN1bHQsIGRhdGEpXG4gICAgfSlcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGN1cnJlbnRVcGxvYWRzOiBPYmplY3QuYXNzaWduKHt9LCBjdXJyZW50VXBsb2Fkcywge1xuICAgICAgICBbdXBsb2FkSURdOiBjdXJyZW50VXBsb2FkXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIHVwbG9hZCwgZWcuIGlmIGl0IGhhcyBiZWVuIGNhbmNlbGVkIG9yIGNvbXBsZXRlZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVwbG9hZElEIFRoZSBJRCBvZiB0aGUgdXBsb2FkLlxuICAgKi9cbiAgX3JlbW92ZVVwbG9hZCAodXBsb2FkSUQpIHtcbiAgICBjb25zdCBjdXJyZW50VXBsb2FkcyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZ2V0U3RhdGUoKS5jdXJyZW50VXBsb2FkcylcbiAgICBkZWxldGUgY3VycmVudFVwbG9hZHNbdXBsb2FkSURdXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGN1cnJlbnRVcGxvYWRzOiBjdXJyZW50VXBsb2Fkc1xuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogUnVuIGFuIHVwbG9hZC4gVGhpcyBwaWNrcyB1cCB3aGVyZSBpdCBsZWZ0IG9mZiBpbiBjYXNlIHRoZSB1cGxvYWQgaXMgYmVpbmcgcmVzdG9yZWQuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcnVuVXBsb2FkICh1cGxvYWRJRCkge1xuICAgIGNvbnN0IHVwbG9hZERhdGEgPSB0aGlzLmdldFN0YXRlKCkuY3VycmVudFVwbG9hZHNbdXBsb2FkSURdXG4gICAgY29uc3QgcmVzdG9yZVN0ZXAgPSB1cGxvYWREYXRhLnN0ZXBcblxuICAgIGNvbnN0IHN0ZXBzID0gW1xuICAgICAgLi4udGhpcy5wcmVQcm9jZXNzb3JzLFxuICAgICAgLi4udGhpcy51cGxvYWRlcnMsXG4gICAgICAuLi50aGlzLnBvc3RQcm9jZXNzb3JzXG4gICAgXVxuICAgIGxldCBsYXN0U3RlcCA9IFByb21pc2UucmVzb2x2ZSgpXG4gICAgc3RlcHMuZm9yRWFjaCgoZm4sIHN0ZXApID0+IHtcbiAgICAgIC8vIFNraXAgdGhpcyBzdGVwIGlmIHdlIGFyZSByZXN0b3JpbmcgYW5kIGhhdmUgYWxyZWFkeSBjb21wbGV0ZWQgdGhpcyBzdGVwIGJlZm9yZS5cbiAgICAgIGlmIChzdGVwIDwgcmVzdG9yZVN0ZXApIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGxhc3RTdGVwID0gbGFzdFN0ZXAudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgY3VycmVudFVwbG9hZHMgfSA9IHRoaXMuZ2V0U3RhdGUoKVxuICAgICAgICBjb25zdCBjdXJyZW50VXBsb2FkID0gT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudFVwbG9hZHNbdXBsb2FkSURdLCB7XG4gICAgICAgICAgc3RlcDogc3RlcFxuICAgICAgICB9KVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICBjdXJyZW50VXBsb2FkczogT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudFVwbG9hZHMsIHtcbiAgICAgICAgICAgIFt1cGxvYWRJRF06IGN1cnJlbnRVcGxvYWRcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIFRPRE8gZ2l2ZSB0aGlzIHRoZSBgY3VycmVudFVwbG9hZGAgb2JqZWN0IGFzIGl0cyBvbmx5IHBhcmFtZXRlciBtYXliZT9cbiAgICAgICAgLy8gT3RoZXJ3aXNlIHdoZW4gbW9yZSBtZXRhZGF0YSBtYXkgYmUgYWRkZWQgdG8gdGhlIHVwbG9hZCB0aGlzIHdvdWxkIGtlZXAgZ2V0dGluZyBtb3JlIHBhcmFtZXRlcnNcbiAgICAgICAgcmV0dXJuIGZuKGN1cnJlbnRVcGxvYWQuZmlsZUlEcywgdXBsb2FkSUQpXG4gICAgICB9KS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIC8vIE5vdCByZXR1cm5pbmcgdGhlIGBjYXRjaGBlZCBwcm9taXNlLCBiZWNhdXNlIHdlIHN0aWxsIHdhbnQgdG8gcmV0dXJuIGEgcmVqZWN0ZWRcbiAgICAvLyBwcm9taXNlIGZyb20gdGhpcyBtZXRob2QgaWYgdGhlIHVwbG9hZCBmYWlsZWQuXG4gICAgbGFzdFN0ZXAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgdGhpcy5lbWl0KCdlcnJvcicsIGVyciwgdXBsb2FkSUQpXG4gICAgICB0aGlzLl9yZW1vdmVVcGxvYWQodXBsb2FkSUQpXG4gICAgfSlcblxuICAgIHJldHVybiBsYXN0U3RlcC50aGVuKCgpID0+IHtcbiAgICAgIC8vIFNldCByZXN1bHQgZGF0YS5cbiAgICAgIGNvbnN0IHsgY3VycmVudFVwbG9hZHMgfSA9IHRoaXMuZ2V0U3RhdGUoKVxuICAgICAgY29uc3QgY3VycmVudFVwbG9hZCA9IGN1cnJlbnRVcGxvYWRzW3VwbG9hZElEXVxuICAgICAgaWYgKCFjdXJyZW50VXBsb2FkKSB7XG4gICAgICAgIHRoaXMubG9nKGBOb3Qgc2V0dGluZyByZXN1bHQgZm9yIGFuIHVwbG9hZCB0aGF0IGhhcyBiZWVuIHJlbW92ZWQ6ICR7dXBsb2FkSUR9YClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpbGVzID0gY3VycmVudFVwbG9hZC5maWxlSURzXG4gICAgICAgIC5tYXAoKGZpbGVJRCkgPT4gdGhpcy5nZXRGaWxlKGZpbGVJRCkpXG4gICAgICBjb25zdCBzdWNjZXNzZnVsID0gZmlsZXMuZmlsdGVyKChmaWxlKSA9PiAhZmlsZS5lcnJvcilcbiAgICAgIGNvbnN0IGZhaWxlZCA9IGZpbGVzLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5lcnJvcilcbiAgICAgIHRoaXMuYWRkUmVzdWx0RGF0YSh1cGxvYWRJRCwgeyBzdWNjZXNzZnVsLCBmYWlsZWQsIHVwbG9hZElEIH0pXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBFbWl0IGNvbXBsZXRpb24gZXZlbnRzLlxuICAgICAgLy8gVGhpcyBpcyBpbiBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHRoYXQgdGhlIGBjdXJyZW50VXBsb2Fkc2AgdmFyaWFibGVcbiAgICAgIC8vIGFsd2F5cyByZWZlcnMgdG8gdGhlIGxhdGVzdCBzdGF0ZS4gSW4gdGhlIGhhbmRsZXIgcmlnaHQgYWJvdmUgaXQgcmVmZXJzXG4gICAgICAvLyB0byBhbiBvdXRkYXRlZCBvYmplY3Qgd2l0aG91dCB0aGUgYC5yZXN1bHRgIHByb3BlcnR5LlxuICAgICAgY29uc3QgeyBjdXJyZW50VXBsb2FkcyB9ID0gdGhpcy5nZXRTdGF0ZSgpXG4gICAgICBjb25zdCBjdXJyZW50VXBsb2FkID0gY3VycmVudFVwbG9hZHNbdXBsb2FkSURdXG4gICAgICBjb25zdCByZXN1bHQgPSBjdXJyZW50VXBsb2FkLnJlc3VsdFxuICAgICAgdGhpcy5lbWl0KCdjb21wbGV0ZScsIHJlc3VsdClcblxuICAgICAgdGhpcy5fcmVtb3ZlVXBsb2FkKHVwbG9hZElEKVxuXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCBhbiB1cGxvYWQgZm9yIGFsbCB0aGUgZmlsZXMgdGhhdCBhcmUgbm90IGN1cnJlbnRseSBiZWluZyB1cGxvYWRlZC5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICovXG4gIHVwbG9hZCAoKSB7XG4gICAgaWYgKCF0aGlzLnBsdWdpbnMudXBsb2FkZXIpIHtcbiAgICAgIHRoaXMubG9nKCdObyB1cGxvYWRlciB0eXBlIHBsdWdpbnMgYXJlIHVzZWQnLCAnd2FybmluZycpXG4gICAgfVxuXG4gICAgbGV0IGZpbGVzID0gdGhpcy5nZXRTdGF0ZSgpLmZpbGVzXG4gICAgY29uc3Qgb25CZWZvcmVVcGxvYWRSZXN1bHQgPSB0aGlzLm9wdHMub25CZWZvcmVVcGxvYWQoZmlsZXMpXG5cbiAgICBpZiAob25CZWZvcmVVcGxvYWRSZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdOb3Qgc3RhcnRpbmcgdGhlIHVwbG9hZCBiZWNhdXNlIG9uQmVmb3JlVXBsb2FkIHJldHVybmVkIGZhbHNlJykpXG4gICAgfVxuXG4gICAgaWYgKG9uQmVmb3JlVXBsb2FkUmVzdWx0ICYmIHR5cGVvZiBvbkJlZm9yZVVwbG9hZFJlc3VsdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIC8vIHdhcm5pbmcgYWZ0ZXIgdGhlIGNoYW5nZSBpbiAwLjI0XG4gICAgICBpZiAob25CZWZvcmVVcGxvYWRSZXN1bHQudGhlbikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvbkJlZm9yZVVwbG9hZCgpIHJldHVybmVkIGEgUHJvbWlzZSwgYnV0IHRoaXMgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC4gSXQgbXVzdCBiZSBzeW5jaHJvbm91cy4nKVxuICAgICAgfVxuXG4gICAgICBmaWxlcyA9IG9uQmVmb3JlVXBsb2FkUmVzdWx0XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLl9jaGVja01pbk51bWJlck9mRmlsZXMoZmlsZXMpKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCB7IGN1cnJlbnRVcGxvYWRzIH0gPSB0aGlzLmdldFN0YXRlKClcbiAgICAgICAgLy8gZ2V0IGEgbGlzdCBvZiBmaWxlcyB0aGF0IGFyZSBjdXJyZW50bHkgYXNzaWduZWQgdG8gdXBsb2Fkc1xuICAgICAgICBjb25zdCBjdXJyZW50bHlVcGxvYWRpbmdGaWxlcyA9IE9iamVjdC5rZXlzKGN1cnJlbnRVcGxvYWRzKS5yZWR1Y2UoKHByZXYsIGN1cnIpID0+IHByZXYuY29uY2F0KGN1cnJlbnRVcGxvYWRzW2N1cnJdLmZpbGVJRHMpLCBbXSlcblxuICAgICAgICBjb25zdCB3YWl0aW5nRmlsZUlEcyA9IFtdXG4gICAgICAgIE9iamVjdC5rZXlzKGZpbGVzKS5mb3JFYWNoKChmaWxlSUQpID0+IHtcbiAgICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5nZXRGaWxlKGZpbGVJRClcbiAgICAgICAgICAvLyBpZiB0aGUgZmlsZSBoYXNuJ3Qgc3RhcnRlZCB1cGxvYWRpbmcgYW5kIGhhc24ndCBhbHJlYWR5IGJlZW4gYXNzaWduZWQgdG8gYW4gdXBsb2FkLi5cbiAgICAgICAgICBpZiAoKCFmaWxlLnByb2dyZXNzLnVwbG9hZFN0YXJ0ZWQpICYmIChjdXJyZW50bHlVcGxvYWRpbmdGaWxlcy5pbmRleE9mKGZpbGVJRCkgPT09IC0xKSkge1xuICAgICAgICAgICAgd2FpdGluZ0ZpbGVJRHMucHVzaChmaWxlLmlkKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBjb25zdCB1cGxvYWRJRCA9IHRoaXMuX2NyZWF0ZVVwbG9hZCh3YWl0aW5nRmlsZUlEcylcbiAgICAgICAgcmV0dXJuIHRoaXMuX3J1blVwbG9hZCh1cGxvYWRJRClcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gdHlwZW9mIGVyciA9PT0gJ29iamVjdCcgPyBlcnIubWVzc2FnZSA6IGVyclxuICAgICAgICBjb25zdCBkZXRhaWxzID0gdHlwZW9mIGVyciA9PT0gJ29iamVjdCcgPyBlcnIuZGV0YWlscyA6IG51bGxcbiAgICAgICAgdGhpcy5sb2coYCR7bWVzc2FnZX0gJHtkZXRhaWxzfWApXG4gICAgICAgIHRoaXMuaW5mbyh7IG1lc3NhZ2U6IG1lc3NhZ2UsIGRldGFpbHM6IGRldGFpbHMgfSwgJ2Vycm9yJywgNDAwMClcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHR5cGVvZiBlcnIgPT09ICdvYmplY3QnID8gZXJyIDogbmV3IEVycm9yKGVycikpXG4gICAgICB9KVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBVcHB5KG9wdHMpXG59XG5cbi8vIEV4cG9zZSBjbGFzcyBjb25zdHJ1Y3Rvci5cbm1vZHVsZS5leHBvcnRzLlVwcHkgPSBVcHB5XG5tb2R1bGUuZXhwb3J0cy5QbHVnaW4gPSBQbHVnaW5cbiIsImNvbnN0IHsgUGx1Z2luIH0gPSByZXF1aXJlKCdAdXBweS9jb3JlJylcbmNvbnN0IFRyYW5zbGF0b3IgPSByZXF1aXJlKCdAdXBweS91dGlscy9saWIvVHJhbnNsYXRvcicpXG5jb25zdCB0b0FycmF5ID0gcmVxdWlyZSgnQHVwcHkvdXRpbHMvbGliL3RvQXJyYXknKVxuY29uc3QgZHJhZ0Ryb3AgPSByZXF1aXJlKCdkcmFnLWRyb3AnKVxuY29uc3QgeyBoIH0gPSByZXF1aXJlKCdwcmVhY3QnKVxuXG4vKipcbiAqIERyYWcgJiBEcm9wIHBsdWdpblxuICpcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEcmFnRHJvcCBleHRlbmRzIFBsdWdpbiB7XG4gIGNvbnN0cnVjdG9yICh1cHB5LCBvcHRzKSB7XG4gICAgc3VwZXIodXBweSwgb3B0cylcbiAgICB0aGlzLnR5cGUgPSAnYWNxdWlyZXInXG4gICAgdGhpcy5pZCA9IHRoaXMub3B0cy5pZCB8fCAnRHJhZ0Ryb3AnXG4gICAgdGhpcy50aXRsZSA9ICdEcmFnICYgRHJvcCdcblxuICAgIGNvbnN0IGRlZmF1bHRMb2NhbGUgPSB7XG4gICAgICBzdHJpbmdzOiB7XG4gICAgICAgIGRyb3BIZXJlT3I6ICdEcm9wIGZpbGVzIGhlcmUgb3IgJXticm93c2V9JyxcbiAgICAgICAgYnJvd3NlOiAnYnJvd3NlJ1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERlZmF1bHQgb3B0aW9uc1xuICAgIGNvbnN0IGRlZmF1bHRPcHRzID0ge1xuICAgICAgdGFyZ2V0OiBudWxsLFxuICAgICAgaW5wdXROYW1lOiAnZmlsZXNbXScsXG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICBub3RlOiBudWxsLFxuICAgICAgbG9jYWxlOiBkZWZhdWx0TG9jYWxlXG4gICAgfVxuXG4gICAgLy8gTWVyZ2UgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIG9uZXMgc2V0IGJ5IHVzZXJcbiAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0cywgb3B0cylcblxuICAgIC8vIENoZWNrIGZvciBicm93c2VyIGRyYWdEcm9wIHN1cHBvcnRcbiAgICB0aGlzLmlzRHJhZ0Ryb3BTdXBwb3J0ZWQgPSB0aGlzLmNoZWNrRHJhZ0Ryb3BTdXBwb3J0KClcblxuICAgIC8vIGkxOG5cbiAgICB0aGlzLnRyYW5zbGF0b3IgPSBuZXcgVHJhbnNsYXRvcihbIGRlZmF1bHRMb2NhbGUsIHRoaXMudXBweS5sb2NhbGUsIHRoaXMub3B0cy5sb2NhbGUgXSlcbiAgICB0aGlzLmkxOG4gPSB0aGlzLnRyYW5zbGF0b3IudHJhbnNsYXRlLmJpbmQodGhpcy50cmFuc2xhdG9yKVxuICAgIHRoaXMuaTE4bkFycmF5ID0gdGhpcy50cmFuc2xhdG9yLnRyYW5zbGF0ZUFycmF5LmJpbmQodGhpcy50cmFuc2xhdG9yKVxuXG4gICAgLy8gQmluZCBgdGhpc2AgdG8gY2xhc3MgbWV0aG9kc1xuICAgIHRoaXMuaGFuZGxlRHJvcCA9IHRoaXMuaGFuZGxlRHJvcC5iaW5kKHRoaXMpXG4gICAgdGhpcy5oYW5kbGVJbnB1dENoYW5nZSA9IHRoaXMuaGFuZGxlSW5wdXRDaGFuZ2UuYmluZCh0aGlzKVxuICAgIHRoaXMuY2hlY2tEcmFnRHJvcFN1cHBvcnQgPSB0aGlzLmNoZWNrRHJhZ0Ryb3BTdXBwb3J0LmJpbmQodGhpcylcbiAgICB0aGlzLnJlbmRlciA9IHRoaXMucmVuZGVyLmJpbmQodGhpcylcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgRHJhZyAmIERyb3AgKG5vdCBzdXBwb3J0ZWQgb24gbW9iaWxlIGRldmljZXMsIGZvciBleGFtcGxlKS5cbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIGNoZWNrRHJhZ0Ryb3BTdXBwb3J0ICgpIHtcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXG4gICAgaWYgKCEoJ2RyYWdnYWJsZScgaW4gZGl2KSB8fCAhKCdvbmRyYWdzdGFydCcgaW4gZGl2ICYmICdvbmRyb3AnIGluIGRpdikpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlmICghKCdGb3JtRGF0YScgaW4gd2luZG93KSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKCEoJ0ZpbGVSZWFkZXInIGluIHdpbmRvdykpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBoYW5kbGVEcm9wIChmaWxlcykge1xuICAgIHRoaXMudXBweS5sb2coJ1tEcmFnRHJvcF0gRmlsZXMgZHJvcHBlZCcpXG5cbiAgICBmaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnVwcHkuYWRkRmlsZSh7XG4gICAgICAgICAgc291cmNlOiB0aGlzLmlkLFxuICAgICAgICAgIG5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgICB0eXBlOiBmaWxlLnR5cGUsXG4gICAgICAgICAgZGF0YTogZmlsZVxuICAgICAgICB9KVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIE5vdGhpbmcsIHJlc3RyaWN0aW9uIGVycm9ycyBoYW5kbGVkIGluIENvcmVcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgaGFuZGxlSW5wdXRDaGFuZ2UgKGV2KSB7XG4gICAgdGhpcy51cHB5LmxvZygnW0RyYWdEcm9wXSBGaWxlcyBzZWxlY3RlZCB0aHJvdWdoIGlucHV0JylcblxuICAgIGNvbnN0IGZpbGVzID0gdG9BcnJheShldi50YXJnZXQuZmlsZXMpXG5cbiAgICBmaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnVwcHkuYWRkRmlsZSh7XG4gICAgICAgICAgc291cmNlOiB0aGlzLmlkLFxuICAgICAgICAgIG5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgICB0eXBlOiBmaWxlLnR5cGUsXG4gICAgICAgICAgZGF0YTogZmlsZVxuICAgICAgICB9KVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIE5vdGhpbmcsIHJlc3RyaWN0aW9uIGVycm9ycyBoYW5kbGVkIGluIENvcmVcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyIChzdGF0ZSkge1xuICAgIC8qIGh0dHA6Ly90eW1wYW51cy5uZXQvY29kcm9wcy8yMDE1LzA5LzE1L3N0eWxpbmctY3VzdG9taXppbmctZmlsZS1pbnB1dHMtc21hcnQtd2F5LyAqL1xuICAgIGNvbnN0IGhpZGRlbklucHV0U3R5bGUgPSB7XG4gICAgICB3aWR0aDogJzAuMXB4JyxcbiAgICAgIGhlaWdodDogJzAuMXB4JyxcbiAgICAgIG9wYWNpdHk6IDAsXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIHpJbmRleDogLTFcbiAgICB9XG4gICAgY29uc3QgRHJhZ0Ryb3BDbGFzcyA9IGB1cHB5LVJvb3QgdXBweS1EcmFnRHJvcC1jb250YWluZXIgJHt0aGlzLmlzRHJhZ0Ryb3BTdXBwb3J0ZWQgPyAndXBweS1EcmFnRHJvcC0taXMtZHJhZ2Ryb3Atc3VwcG9ydGVkJyA6ICcnfWBcbiAgICBjb25zdCBEcmFnRHJvcFN0eWxlID0ge1xuICAgICAgd2lkdGg6IHRoaXMub3B0cy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5vcHRzLmhlaWdodFxuICAgIH1cbiAgICBjb25zdCByZXN0cmljdGlvbnMgPSB0aGlzLnVwcHkub3B0cy5yZXN0cmljdGlvbnNcblxuICAgIC8vIGVtcHR5IHZhbHVlPVwiXCIgb24gZmlsZSBpbnB1dCwgc28gdGhhdCB0aGUgaW5wdXQgaXMgY2xlYXJlZCBhZnRlciBhIGZpbGUgaXMgc2VsZWN0ZWQsXG4gICAgLy8gYmVjYXVzZSBVcHB5IHdpbGwgYmUgaGFuZGxpbmcgdGhlIHVwbG9hZCBhbmQgc28gd2UgY2FuIHNlbGVjdCBzYW1lIGZpbGVcbiAgICAvLyBhZnRlciByZW1vdmluZyDigJQgb3RoZXJ3aXNlIGJyb3dzZXIgdGhpbmtzIGl04oCZcyBhbHJlYWR5IHNlbGVjdGVkXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3M9e0RyYWdEcm9wQ2xhc3N9IHN0eWxlPXtEcmFnRHJvcFN0eWxlfT5cbiAgICAgICAgPGRpdiBjbGFzcz1cInVwcHktRHJhZ0Ryb3AtaW5uZXJcIj5cbiAgICAgICAgICA8c3ZnIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIGNsYXNzPVwiVXBweUljb24gdXBweS1EcmFnRHJvcC1hcnJvd1wiIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+XG4gICAgICAgICAgICA8cGF0aCBkPVwiTTExIDEwVjBINXYxMEgybDYgNiA2LTZoLTN6bTAgMFwiIGZpbGwtcnVsZT1cImV2ZW5vZGRcIiAvPlxuICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInVwcHktRHJhZ0Ryb3AtbGFiZWxcIj5cbiAgICAgICAgICAgIDxpbnB1dCBzdHlsZT17aGlkZGVuSW5wdXRTdHlsZX1cbiAgICAgICAgICAgICAgY2xhc3M9XCJ1cHB5LURyYWdEcm9wLWlucHV0XCJcbiAgICAgICAgICAgICAgdHlwZT1cImZpbGVcIlxuICAgICAgICAgICAgICBuYW1lPXt0aGlzLm9wdHMuaW5wdXROYW1lfVxuICAgICAgICAgICAgICBtdWx0aXBsZT17cmVzdHJpY3Rpb25zLm1heE51bWJlck9mRmlsZXMgIT09IDF9XG4gICAgICAgICAgICAgIGFjY2VwdD17cmVzdHJpY3Rpb25zLmFsbG93ZWRGaWxlVHlwZXN9XG4gICAgICAgICAgICAgIHJlZj17KGlucHV0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnB1dCA9IGlucHV0XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIG9uY2hhbmdlPXt0aGlzLmhhbmRsZUlucHV0Q2hhbmdlfVxuICAgICAgICAgICAgICB2YWx1ZT1cIlwiIC8+XG4gICAgICAgICAgICB7dGhpcy5pMThuQXJyYXkoJ2Ryb3BIZXJlT3InLCB7XG4gICAgICAgICAgICAgIGJyb3dzZTogPHNwYW4gY2xhc3M9XCJ1cHB5LURyYWdEcm9wLWRyYWdUZXh0XCI+e3RoaXMuaTE4bignYnJvd3NlJyl9PC9zcGFuPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cInVwcHktRHJhZ0Ryb3Atbm90ZVwiPnt0aGlzLm9wdHMubm90ZX08L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG5cbiAgaW5zdGFsbCAoKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5vcHRzLnRhcmdldFxuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIHRoaXMubW91bnQodGFyZ2V0LCB0aGlzKVxuICAgIH1cbiAgICB0aGlzLnJlbW92ZURyYWdEcm9wTGlzdGVuZXIgPSBkcmFnRHJvcCh0aGlzLmVsLCAoZmlsZXMpID0+IHtcbiAgICAgIHRoaXMuaGFuZGxlRHJvcChmaWxlcylcbiAgICAgIHRoaXMudXBweS5sb2coZmlsZXMpXG4gICAgfSlcbiAgfVxuXG4gIHVuaW5zdGFsbCAoKSB7XG4gICAgdGhpcy51bm1vdW50KClcbiAgICB0aGlzLnJlbW92ZURyYWdEcm9wTGlzdGVuZXIoKVxuICB9XG59XG4iLCJjb25zdCB7IFBsdWdpbiB9ID0gcmVxdWlyZSgnQHVwcHkvY29yZScpXG5jb25zdCB7IGggfSA9IHJlcXVpcmUoJ3ByZWFjdCcpXG5cbi8qKlxuICogUHJvZ3Jlc3MgYmFyXG4gKlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFByb2dyZXNzQmFyIGV4dGVuZHMgUGx1Z2luIHtcbiAgY29uc3RydWN0b3IgKHVwcHksIG9wdHMpIHtcbiAgICBzdXBlcih1cHB5LCBvcHRzKVxuICAgIHRoaXMuaWQgPSB0aGlzLm9wdHMuaWQgfHwgJ1Byb2dyZXNzQmFyJ1xuICAgIHRoaXMudGl0bGUgPSAnUHJvZ3Jlc3MgQmFyJ1xuICAgIHRoaXMudHlwZSA9ICdwcm9ncmVzc2luZGljYXRvcidcblxuICAgIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIHRhcmdldDogJ2JvZHknLFxuICAgICAgcmVwbGFjZVRhcmdldENvbnRlbnQ6IGZhbHNlLFxuICAgICAgZml4ZWQ6IGZhbHNlLFxuICAgICAgaGlkZUFmdGVyRmluaXNoOiB0cnVlXG4gICAgfVxuXG4gICAgLy8gbWVyZ2UgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIG9uZXMgc2V0IGJ5IHVzZXJcbiAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0cylcblxuICAgIHRoaXMucmVuZGVyID0gdGhpcy5yZW5kZXIuYmluZCh0aGlzKVxuICB9XG5cbiAgcmVuZGVyIChzdGF0ZSkge1xuICAgIGNvbnN0IHByb2dyZXNzID0gc3RhdGUudG90YWxQcm9ncmVzcyB8fCAwXG4gICAgY29uc3QgaXNIaWRkZW4gPSBwcm9ncmVzcyA9PT0gMTAwICYmIHRoaXMub3B0cy5oaWRlQWZ0ZXJGaW5pc2hcbiAgICByZXR1cm4gPGRpdiBjbGFzcz1cInVwcHkgdXBweS1Qcm9ncmVzc0JhclwiIHN0eWxlPXt7IHBvc2l0aW9uOiB0aGlzLm9wdHMuZml4ZWQgPyAnZml4ZWQnIDogJ2luaXRpYWwnIH19IGFyaWEtaGlkZGVuPXtpc0hpZGRlbn0+XG4gICAgICA8ZGl2IGNsYXNzPVwidXBweS1Qcm9ncmVzc0Jhci1pbm5lclwiIHN0eWxlPXt7IHdpZHRoOiBwcm9ncmVzcyArICclJyB9fSAvPlxuICAgICAgPGRpdiBjbGFzcz1cInVwcHktUHJvZ3Jlc3NCYXItcGVyY2VudGFnZVwiPntwcm9ncmVzc308L2Rpdj5cbiAgICA8L2Rpdj5cbiAgfVxuXG4gIGluc3RhbGwgKCkge1xuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMub3B0cy50YXJnZXRcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICB0aGlzLm1vdW50KHRhcmdldCwgdGhpcylcbiAgICB9XG4gIH1cblxuICB1bmluc3RhbGwgKCkge1xuICAgIHRoaXMudW5tb3VudCgpXG4gIH1cbn1cbiIsIi8qKlxuICogRGVmYXVsdCBzdG9yZSB0aGF0IGtlZXBzIHN0YXRlIGluIGEgc2ltcGxlIG9iamVjdC5cbiAqL1xuY2xhc3MgRGVmYXVsdFN0b3JlIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuc3RhdGUgPSB7fVxuICAgIHRoaXMuY2FsbGJhY2tzID0gW11cbiAgfVxuXG4gIGdldFN0YXRlICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZVxuICB9XG5cbiAgc2V0U3RhdGUgKHBhdGNoKSB7XG4gICAgY29uc3QgcHJldlN0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5zdGF0ZSlcbiAgICBjb25zdCBuZXh0U3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnN0YXRlLCBwYXRjaClcblxuICAgIHRoaXMuc3RhdGUgPSBuZXh0U3RhdGVcbiAgICB0aGlzLl9wdWJsaXNoKHByZXZTdGF0ZSwgbmV4dFN0YXRlLCBwYXRjaClcbiAgfVxuXG4gIHN1YnNjcmliZSAobGlzdGVuZXIpIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5wdXNoKGxpc3RlbmVyKVxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAvLyBSZW1vdmUgdGhlIGxpc3RlbmVyLlxuICAgICAgdGhpcy5jYWxsYmFja3Muc3BsaWNlKFxuICAgICAgICB0aGlzLmNhbGxiYWNrcy5pbmRleE9mKGxpc3RlbmVyKSxcbiAgICAgICAgMVxuICAgICAgKVxuICAgIH1cbiAgfVxuXG4gIF9wdWJsaXNoICguLi5hcmdzKSB7XG4gICAgdGhpcy5jYWxsYmFja3MuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpXG4gICAgfSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZmF1bHRTdG9yZSAoKSB7XG4gIHJldHVybiBuZXcgRGVmYXVsdFN0b3JlKClcbn1cbiIsImNvbnN0IHsgUGx1Z2luIH0gPSByZXF1aXJlKCdAdXBweS9jb3JlJylcbmNvbnN0IHR1cyA9IHJlcXVpcmUoJ3R1cy1qcy1jbGllbnQnKVxuY29uc3QgeyBQcm92aWRlciwgUmVxdWVzdENsaWVudCwgU29ja2V0IH0gPSByZXF1aXJlKCdAdXBweS9jb21wYW5pb24tY2xpZW50JylcbmNvbnN0IGVtaXRTb2NrZXRQcm9ncmVzcyA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9lbWl0U29ja2V0UHJvZ3Jlc3MnKVxuY29uc3QgZ2V0U29ja2V0SG9zdCA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9nZXRTb2NrZXRIb3N0JylcbmNvbnN0IHNldHRsZSA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9zZXR0bGUnKVxuY29uc3QgbGltaXRQcm9taXNlcyA9IHJlcXVpcmUoJ0B1cHB5L3V0aWxzL2xpYi9saW1pdFByb21pc2VzJylcblxuLy8gRXh0cmFjdGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3R1cy90dXMtanMtY2xpZW50L2Jsb2IvbWFzdGVyL2xpYi91cGxvYWQuanMjTDEzXG4vLyBleGNlcHRlZCB3ZSByZW1vdmVkICdmaW5nZXJwcmludCcga2V5IHRvIGF2b2lkIGFkZGluZyBtb3JlIGRlcGVuZGVuY2llc1xuY29uc3QgdHVzRGVmYXVsdE9wdGlvbnMgPSB7XG4gIGVuZHBvaW50OiAnJyxcbiAgcmVzdW1lOiB0cnVlLFxuICBvblByb2dyZXNzOiBudWxsLFxuICBvbkNodW5rQ29tcGxldGU6IG51bGwsXG4gIG9uU3VjY2VzczogbnVsbCxcbiAgb25FcnJvcjogbnVsbCxcbiAgaGVhZGVyczoge30sXG4gIGNodW5rU2l6ZTogSW5maW5pdHksXG4gIHdpdGhDcmVkZW50aWFsczogZmFsc2UsXG4gIHVwbG9hZFVybDogbnVsbCxcbiAgdXBsb2FkU2l6ZTogbnVsbCxcbiAgb3ZlcnJpZGVQYXRjaE1ldGhvZDogZmFsc2UsXG4gIHJldHJ5RGVsYXlzOiBudWxsXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgd3JhcHBlciBhcm91bmQgYW4gZXZlbnQgZW1pdHRlciB3aXRoIGEgYHJlbW92ZWAgbWV0aG9kIHRvIHJlbW92ZVxuICogYWxsIGV2ZW50cyB0aGF0IHdlcmUgYWRkZWQgdXNpbmcgdGhlIHdyYXBwZWQgZW1pdHRlci5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRXZlbnRUcmFja2VyIChlbWl0dGVyKSB7XG4gIGNvbnN0IGV2ZW50cyA9IFtdXG4gIHJldHVybiB7XG4gICAgb24gKGV2ZW50LCBmbikge1xuICAgICAgZXZlbnRzLnB1c2goWyBldmVudCwgZm4gXSlcbiAgICAgIHJldHVybiBlbWl0dGVyLm9uKGV2ZW50LCBmbilcbiAgICB9LFxuICAgIHJlbW92ZSAoKSB7XG4gICAgICBldmVudHMuZm9yRWFjaCgoWyBldmVudCwgZm4gXSkgPT4ge1xuICAgICAgICBlbWl0dGVyLm9mZihldmVudCwgZm4pXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFR1cyByZXN1bWFibGUgZmlsZSB1cGxvYWRlclxuICpcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUdXMgZXh0ZW5kcyBQbHVnaW4ge1xuICBjb25zdHJ1Y3RvciAodXBweSwgb3B0cykge1xuICAgIHN1cGVyKHVwcHksIG9wdHMpXG4gICAgdGhpcy50eXBlID0gJ3VwbG9hZGVyJ1xuICAgIHRoaXMuaWQgPSAnVHVzJ1xuICAgIHRoaXMudGl0bGUgPSAnVHVzJ1xuXG4gICAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICAgIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgcmVzdW1lOiB0cnVlLFxuICAgICAgYXV0b1JldHJ5OiB0cnVlLFxuICAgICAgdXNlRmFzdFJlbW90ZVJldHJ5OiB0cnVlLFxuICAgICAgbGltaXQ6IDAsXG4gICAgICByZXRyeURlbGF5czogWzAsIDEwMDAsIDMwMDAsIDUwMDBdXG4gICAgfVxuXG4gICAgLy8gbWVyZ2UgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIG9uZXMgc2V0IGJ5IHVzZXJcbiAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0cylcblxuICAgIC8vIFNpbXVsdGFuZW91cyB1cGxvYWQgbGltaXRpbmcgaXMgc2hhcmVkIGFjcm9zcyBhbGwgdXBsb2FkcyB3aXRoIHRoaXMgcGx1Z2luLlxuICAgIGlmICh0eXBlb2YgdGhpcy5vcHRzLmxpbWl0ID09PSAnbnVtYmVyJyAmJiB0aGlzLm9wdHMubGltaXQgIT09IDApIHtcbiAgICAgIHRoaXMubGltaXRVcGxvYWRzID0gbGltaXRQcm9taXNlcyh0aGlzLm9wdHMubGltaXQpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGltaXRVcGxvYWRzID0gKGZuKSA9PiBmblxuICAgIH1cblxuICAgIHRoaXMudXBsb2FkZXJzID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgIHRoaXMudXBsb2FkZXJFdmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgdGhpcy51cGxvYWRlclNvY2tldHMgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgICB0aGlzLmhhbmRsZVJlc2V0UHJvZ3Jlc3MgPSB0aGlzLmhhbmRsZVJlc2V0UHJvZ3Jlc3MuYmluZCh0aGlzKVxuICAgIHRoaXMuaGFuZGxlVXBsb2FkID0gdGhpcy5oYW5kbGVVcGxvYWQuYmluZCh0aGlzKVxuICB9XG5cbiAgaGFuZGxlUmVzZXRQcm9ncmVzcyAoKSB7XG4gICAgY29uc3QgZmlsZXMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnVwcHkuZ2V0U3RhdGUoKS5maWxlcylcbiAgICBPYmplY3Qua2V5cyhmaWxlcykuZm9yRWFjaCgoZmlsZUlEKSA9PiB7XG4gICAgICAvLyBPbmx5IGNsb25lIHRoZSBmaWxlIG9iamVjdCBpZiBpdCBoYXMgYSBUdXMgYHVwbG9hZFVybGAgYXR0YWNoZWQuXG4gICAgICBpZiAoZmlsZXNbZmlsZUlEXS50dXMgJiYgZmlsZXNbZmlsZUlEXS50dXMudXBsb2FkVXJsKSB7XG4gICAgICAgIGNvbnN0IHR1c1N0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgZmlsZXNbZmlsZUlEXS50dXMpXG4gICAgICAgIGRlbGV0ZSB0dXNTdGF0ZS51cGxvYWRVcmxcbiAgICAgICAgZmlsZXNbZmlsZUlEXSA9IE9iamVjdC5hc3NpZ24oe30sIGZpbGVzW2ZpbGVJRF0sIHsgdHVzOiB0dXNTdGF0ZSB9KVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLnVwcHkuc2V0U3RhdGUoeyBmaWxlcyB9KVxuICB9XG5cbiAgLyoqXG4gICAqIENsZWFuIHVwIGFsbCByZWZlcmVuY2VzIGZvciBhIGZpbGUncyB1cGxvYWQ6IHRoZSB0dXMuVXBsb2FkIGluc3RhbmNlLFxuICAgKiBhbnkgZXZlbnRzIHJlbGF0ZWQgdG8gdGhlIGZpbGUsIGFuZCB0aGUgQ29tcGFuaW9uIFdlYlNvY2tldCBjb25uZWN0aW9uLlxuICAgKi9cbiAgcmVzZXRVcGxvYWRlclJlZmVyZW5jZXMgKGZpbGVJRCkge1xuICAgIGlmICh0aGlzLnVwbG9hZGVyc1tmaWxlSURdKSB7XG4gICAgICB0aGlzLnVwbG9hZGVyc1tmaWxlSURdLmFib3J0KClcbiAgICAgIHRoaXMudXBsb2FkZXJzW2ZpbGVJRF0gPSBudWxsXG4gICAgfVxuICAgIGlmICh0aGlzLnVwbG9hZGVyRXZlbnRzW2ZpbGVJRF0pIHtcbiAgICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5yZW1vdmUoKVxuICAgICAgdGhpcy51cGxvYWRlckV2ZW50c1tmaWxlSURdID0gbnVsbFxuICAgIH1cbiAgICBpZiAodGhpcy51cGxvYWRlclNvY2tldHNbZmlsZUlEXSkge1xuICAgICAgdGhpcy51cGxvYWRlclNvY2tldHNbZmlsZUlEXS5jbG9zZSgpXG4gICAgICB0aGlzLnVwbG9hZGVyU29ja2V0c1tmaWxlSURdID0gbnVsbFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgVHVzIHVwbG9hZFxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gZmlsZSBmb3IgdXNlIHdpdGggdXBsb2FkXG4gICAqIEBwYXJhbSB7aW50ZWdlcn0gY3VycmVudCBmaWxlIGluIGEgcXVldWVcbiAgICogQHBhcmFtIHtpbnRlZ2VyfSB0b3RhbCBudW1iZXIgb2YgZmlsZXMgaW4gYSBxdWV1ZVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIHVwbG9hZCAoZmlsZSwgY3VycmVudCwgdG90YWwpIHtcbiAgICB0aGlzLnJlc2V0VXBsb2FkZXJSZWZlcmVuY2VzKGZpbGUuaWQpXG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgdHVzIHVwbG9hZFxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBvcHRzVHVzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgICAge30sXG4gICAgICAgIHR1c0RlZmF1bHRPcHRpb25zLFxuICAgICAgICB0aGlzLm9wdHMsXG4gICAgICAgIC8vIEluc3RhbGwgZmlsZS1zcGVjaWZpYyB1cGxvYWQgb3ZlcnJpZGVzLlxuICAgICAgICBmaWxlLnR1cyB8fCB7fVxuICAgICAgKVxuXG4gICAgICBvcHRzVHVzLm9uRXJyb3IgPSAoZXJyKSA9PiB7XG4gICAgICAgIHRoaXMudXBweS5sb2coZXJyKVxuICAgICAgICB0aGlzLnVwcHkuZW1pdCgndXBsb2FkLWVycm9yJywgZmlsZSwgZXJyKVxuICAgICAgICBlcnIubWVzc2FnZSA9IGBGYWlsZWQgYmVjYXVzZTogJHtlcnIubWVzc2FnZX1gXG5cbiAgICAgICAgdGhpcy5yZXNldFVwbG9hZGVyUmVmZXJlbmNlcyhmaWxlLmlkKVxuICAgICAgICByZWplY3QoZXJyKVxuICAgICAgfVxuXG4gICAgICBvcHRzVHVzLm9uUHJvZ3Jlc3MgPSAoYnl0ZXNVcGxvYWRlZCwgYnl0ZXNUb3RhbCkgPT4ge1xuICAgICAgICB0aGlzLm9uUmVjZWl2ZVVwbG9hZFVybChmaWxlLCB1cGxvYWQudXJsKVxuICAgICAgICB0aGlzLnVwcHkuZW1pdCgndXBsb2FkLXByb2dyZXNzJywgZmlsZSwge1xuICAgICAgICAgIHVwbG9hZGVyOiB0aGlzLFxuICAgICAgICAgIGJ5dGVzVXBsb2FkZWQ6IGJ5dGVzVXBsb2FkZWQsXG4gICAgICAgICAgYnl0ZXNUb3RhbDogYnl0ZXNUb3RhbFxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBvcHRzVHVzLm9uU3VjY2VzcyA9ICgpID0+IHtcbiAgICAgICAgdGhpcy51cHB5LmVtaXQoJ3VwbG9hZC1zdWNjZXNzJywgZmlsZSwgdXBsb2FkLCB1cGxvYWQudXJsKVxuXG4gICAgICAgIGlmICh1cGxvYWQudXJsKSB7XG4gICAgICAgICAgdGhpcy51cHB5LmxvZygnRG93bmxvYWQgJyArIHVwbG9hZC5maWxlLm5hbWUgKyAnIGZyb20gJyArIHVwbG9hZC51cmwpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlc2V0VXBsb2FkZXJSZWZlcmVuY2VzKGZpbGUuaWQpXG4gICAgICAgIHJlc29sdmUodXBsb2FkKVxuICAgICAgfVxuXG4gICAgICBjb25zdCBjb3B5UHJvcCA9IChvYmosIHNyY1Byb3AsIGRlc3RQcm9wKSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBzcmNQcm9wKSAmJlxuICAgICAgICAgICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBkZXN0UHJvcClcbiAgICAgICAgKSB7XG4gICAgICAgICAgb2JqW2Rlc3RQcm9wXSA9IG9ialtzcmNQcm9wXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHR1c2QgdXNlcyBtZXRhZGF0YSBmaWVsZHMgJ2ZpbGV0eXBlJyBhbmQgJ2ZpbGVuYW1lJ1xuICAgICAgY29uc3QgbWV0YSA9IE9iamVjdC5hc3NpZ24oe30sIGZpbGUubWV0YSlcbiAgICAgIGNvcHlQcm9wKG1ldGEsICd0eXBlJywgJ2ZpbGV0eXBlJylcbiAgICAgIGNvcHlQcm9wKG1ldGEsICduYW1lJywgJ2ZpbGVuYW1lJylcbiAgICAgIG9wdHNUdXMubWV0YWRhdGEgPSBtZXRhXG5cbiAgICAgIGNvbnN0IHVwbG9hZCA9IG5ldyB0dXMuVXBsb2FkKGZpbGUuZGF0YSwgb3B0c1R1cylcbiAgICAgIHRoaXMudXBsb2FkZXJzW2ZpbGUuaWRdID0gdXBsb2FkXG4gICAgICB0aGlzLnVwbG9hZGVyRXZlbnRzW2ZpbGUuaWRdID0gY3JlYXRlRXZlbnRUcmFja2VyKHRoaXMudXBweSlcblxuICAgICAgdGhpcy5vbkZpbGVSZW1vdmUoZmlsZS5pZCwgKHRhcmdldEZpbGVJRCkgPT4ge1xuICAgICAgICB0aGlzLnJlc2V0VXBsb2FkZXJSZWZlcmVuY2VzKGZpbGUuaWQpXG4gICAgICAgIHJlc29sdmUoYHVwbG9hZCAke3RhcmdldEZpbGVJRH0gd2FzIHJlbW92ZWRgKVxuICAgICAgfSlcblxuICAgICAgdGhpcy5vblBhdXNlKGZpbGUuaWQsIChpc1BhdXNlZCkgPT4ge1xuICAgICAgICBpZiAoaXNQYXVzZWQpIHtcbiAgICAgICAgICB1cGxvYWQuYWJvcnQoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVwbG9hZC5zdGFydCgpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHRoaXMub25QYXVzZUFsbChmaWxlLmlkLCAoKSA9PiB7XG4gICAgICAgIHVwbG9hZC5hYm9ydCgpXG4gICAgICB9KVxuXG4gICAgICB0aGlzLm9uQ2FuY2VsQWxsKGZpbGUuaWQsICgpID0+IHtcbiAgICAgICAgdGhpcy5yZXNldFVwbG9hZGVyUmVmZXJlbmNlcyhmaWxlLmlkKVxuICAgICAgfSlcblxuICAgICAgdGhpcy5vblJlc3VtZUFsbChmaWxlLmlkLCAoKSA9PiB7XG4gICAgICAgIGlmIChmaWxlLmVycm9yKSB7XG4gICAgICAgICAgdXBsb2FkLmFib3J0KClcbiAgICAgICAgfVxuICAgICAgICB1cGxvYWQuc3RhcnQoKVxuICAgICAgfSlcblxuICAgICAgaWYgKCFmaWxlLmlzUGF1c2VkKSB7XG4gICAgICAgIHVwbG9hZC5zdGFydCgpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHVwbG9hZFJlbW90ZSAoZmlsZSwgY3VycmVudCwgdG90YWwpIHtcbiAgICB0aGlzLnJlc2V0VXBsb2FkZXJSZWZlcmVuY2VzKGZpbGUuaWQpXG5cbiAgICBjb25zdCBvcHRzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgdGhpcy5vcHRzLFxuICAgICAgLy8gSW5zdGFsbCBmaWxlLXNwZWNpZmljIHVwbG9hZCBvdmVycmlkZXMuXG4gICAgICBmaWxlLnR1cyB8fCB7fVxuICAgIClcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLnVwcHkubG9nKGZpbGUucmVtb3RlLnVybClcbiAgICAgIGlmIChmaWxlLnNlcnZlclRva2VuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3RUb1NlcnZlclNvY2tldChmaWxlKVxuICAgICAgICAgIC50aGVuKCgpID0+IHJlc29sdmUoKSlcbiAgICAgICAgICAuY2F0Y2gocmVqZWN0KVxuICAgICAgfVxuXG4gICAgICB0aGlzLnVwcHkuZW1pdCgndXBsb2FkLXN0YXJ0ZWQnLCBmaWxlKVxuICAgICAgY29uc3QgQ2xpZW50ID0gZmlsZS5yZW1vdGUucHJvdmlkZXJPcHRpb25zLnByb3ZpZGVyID8gUHJvdmlkZXIgOiBSZXF1ZXN0Q2xpZW50XG4gICAgICBjb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KHRoaXMudXBweSwgZmlsZS5yZW1vdGUucHJvdmlkZXJPcHRpb25zKVxuICAgICAgY2xpZW50LnBvc3QoXG4gICAgICAgIGZpbGUucmVtb3RlLnVybCxcbiAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgZmlsZS5yZW1vdGUuYm9keSwge1xuICAgICAgICAgIGVuZHBvaW50OiBvcHRzLmVuZHBvaW50LFxuICAgICAgICAgIHVwbG9hZFVybDogb3B0cy51cGxvYWRVcmwsXG4gICAgICAgICAgcHJvdG9jb2w6ICd0dXMnLFxuICAgICAgICAgIHNpemU6IGZpbGUuZGF0YS5zaXplLFxuICAgICAgICAgIG1ldGFkYXRhOiBmaWxlLm1ldGFcbiAgICAgICAgfSlcbiAgICAgICkudGhlbigocmVzKSA9PiB7XG4gICAgICAgIHRoaXMudXBweS5zZXRGaWxlU3RhdGUoZmlsZS5pZCwgeyBzZXJ2ZXJUb2tlbjogcmVzLnRva2VuIH0pXG4gICAgICAgIGZpbGUgPSB0aGlzLnVwcHkuZ2V0RmlsZShmaWxlLmlkKVxuICAgICAgICByZXR1cm4gZmlsZVxuICAgICAgfSlcbiAgICAgIC50aGVuKChmaWxlKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3RUb1NlcnZlclNvY2tldChmaWxlKVxuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgcmVzb2x2ZSgpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihlcnIpKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgY29ubmVjdFRvU2VydmVyU29ja2V0IChmaWxlKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRva2VuID0gZmlsZS5zZXJ2ZXJUb2tlblxuICAgICAgY29uc3QgaG9zdCA9IGdldFNvY2tldEhvc3QoZmlsZS5yZW1vdGUuc2VydmVyVXJsKVxuICAgICAgY29uc3Qgc29ja2V0ID0gbmV3IFNvY2tldCh7IHRhcmdldDogYCR7aG9zdH0vYXBpLyR7dG9rZW59YCB9KVxuICAgICAgdGhpcy51cGxvYWRlclNvY2tldHNbZmlsZS5pZF0gPSBzb2NrZXRcbiAgICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZS5pZF0gPSBjcmVhdGVFdmVudFRyYWNrZXIodGhpcy51cHB5KVxuXG4gICAgICB0aGlzLm9uRmlsZVJlbW92ZShmaWxlLmlkLCAoKSA9PiB7XG4gICAgICAgIHNvY2tldC5zZW5kKCdwYXVzZScsIHt9KVxuICAgICAgICByZXNvbHZlKGB1cGxvYWQgJHtmaWxlLmlkfSB3YXMgcmVtb3ZlZGApXG4gICAgICB9KVxuXG4gICAgICB0aGlzLm9uUGF1c2UoZmlsZS5pZCwgKGlzUGF1c2VkKSA9PiB7XG4gICAgICAgIGlzUGF1c2VkID8gc29ja2V0LnNlbmQoJ3BhdXNlJywge30pIDogc29ja2V0LnNlbmQoJ3Jlc3VtZScsIHt9KVxuICAgICAgfSlcblxuICAgICAgdGhpcy5vblBhdXNlQWxsKGZpbGUuaWQsICgpID0+IHNvY2tldC5zZW5kKCdwYXVzZScsIHt9KSlcblxuICAgICAgdGhpcy5vbkNhbmNlbEFsbChmaWxlLmlkLCAoKSA9PiBzb2NrZXQuc2VuZCgncGF1c2UnLCB7fSkpXG5cbiAgICAgIHRoaXMub25SZXN1bWVBbGwoZmlsZS5pZCwgKCkgPT4ge1xuICAgICAgICBpZiAoZmlsZS5lcnJvcikge1xuICAgICAgICAgIHNvY2tldC5zZW5kKCdwYXVzZScsIHt9KVxuICAgICAgICB9XG4gICAgICAgIHNvY2tldC5zZW5kKCdyZXN1bWUnLCB7fSlcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMub25SZXRyeShmaWxlLmlkLCAoKSA9PiB7XG4gICAgICAgIHNvY2tldC5zZW5kKCdwYXVzZScsIHt9KVxuICAgICAgICBzb2NrZXQuc2VuZCgncmVzdW1lJywge30pXG4gICAgICB9KVxuXG4gICAgICB0aGlzLm9uUmV0cnlBbGwoZmlsZS5pZCwgKCkgPT4ge1xuICAgICAgICBzb2NrZXQuc2VuZCgncGF1c2UnLCB7fSlcbiAgICAgICAgc29ja2V0LnNlbmQoJ3Jlc3VtZScsIHt9KVxuICAgICAgfSlcblxuICAgICAgaWYgKGZpbGUuaXNQYXVzZWQpIHtcbiAgICAgICAgc29ja2V0LnNlbmQoJ3BhdXNlJywge30pXG4gICAgICB9XG5cbiAgICAgIHNvY2tldC5vbigncHJvZ3Jlc3MnLCAocHJvZ3Jlc3NEYXRhKSA9PiBlbWl0U29ja2V0UHJvZ3Jlc3ModGhpcywgcHJvZ3Jlc3NEYXRhLCBmaWxlKSlcblxuICAgICAgc29ja2V0Lm9uKCdlcnJvcicsIChlcnJEYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgbWVzc2FnZSB9ID0gZXJyRGF0YS5lcnJvclxuICAgICAgICBjb25zdCBlcnJvciA9IE9iamVjdC5hc3NpZ24obmV3IEVycm9yKG1lc3NhZ2UpLCB7IGNhdXNlOiBlcnJEYXRhLmVycm9yIH0pXG5cbiAgICAgICAgLy8gSWYgdGhlIHJlbW90ZSByZXRyeSBvcHRpbWlzYXRpb24gc2hvdWxkIG5vdCBiZSB1c2VkLFxuICAgICAgICAvLyBjbG9zZSB0aGUgc29ja2V04oCUdGhpcyB3aWxsIHRlbGwgY29tcGFuaW9uIHRvIGNsZWFyIHN0YXRlIGFuZCBkZWxldGUgdGhlIGZpbGUuXG4gICAgICAgIGlmICghdGhpcy5vcHRzLnVzZUZhc3RSZW1vdGVSZXRyeSkge1xuICAgICAgICAgIHRoaXMucmVzZXRVcGxvYWRlclJlZmVyZW5jZXMoZmlsZS5pZClcbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNlcnZlclRva2VuIHNvIHRoYXQgYSBuZXcgb25lIHdpbGwgYmUgY3JlYXRlZCBmb3IgdGhlIHJldHJ5LlxuICAgICAgICAgIHRoaXMudXBweS5zZXRGaWxlU3RhdGUoZmlsZS5pZCwge1xuICAgICAgICAgICAgc2VydmVyVG9rZW46IG51bGxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cHB5LmVtaXQoJ3VwbG9hZC1lcnJvcicsIGZpbGUsIGVycm9yKVxuICAgICAgICByZWplY3QoZXJyb3IpXG4gICAgICB9KVxuXG4gICAgICBzb2NrZXQub24oJ3N1Y2Nlc3MnLCAoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLnVwcHkuZW1pdCgndXBsb2FkLXN1Y2Nlc3MnLCBmaWxlLCBkYXRhLCBkYXRhLnVybClcbiAgICAgICAgdGhpcy5yZXNldFVwbG9hZGVyUmVmZXJlbmNlcyhmaWxlLmlkKVxuICAgICAgICByZXNvbHZlKClcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9yZSB0aGUgdXBsb2FkVXJsIG9uIHRoZSBmaWxlIG9wdGlvbnMsIHNvIHRoYXQgd2hlbiBHb2xkZW4gUmV0cmlldmVyXG4gICAqIHJlc3RvcmVzIHN0YXRlLCB3ZSB3aWxsIGNvbnRpbnVlIHVwbG9hZGluZyB0byB0aGUgY29ycmVjdCBVUkwuXG4gICAqL1xuICBvblJlY2VpdmVVcGxvYWRVcmwgKGZpbGUsIHVwbG9hZFVSTCkge1xuICAgIGNvbnN0IGN1cnJlbnRGaWxlID0gdGhpcy51cHB5LmdldEZpbGUoZmlsZS5pZClcbiAgICBpZiAoIWN1cnJlbnRGaWxlKSByZXR1cm5cbiAgICAvLyBPbmx5IGRvIHRoZSB1cGRhdGUgaWYgd2UgZGlkbid0IGhhdmUgYW4gdXBsb2FkIFVSTCB5ZXQuXG4gICAgaWYgKCFjdXJyZW50RmlsZS50dXMgfHwgY3VycmVudEZpbGUudHVzLnVwbG9hZFVybCAhPT0gdXBsb2FkVVJMKSB7XG4gICAgICB0aGlzLnVwcHkubG9nKCdbVHVzXSBTdG9yaW5nIHVwbG9hZCB1cmwnKVxuICAgICAgdGhpcy51cHB5LnNldEZpbGVTdGF0ZShjdXJyZW50RmlsZS5pZCwge1xuICAgICAgICB0dXM6IE9iamVjdC5hc3NpZ24oe30sIGN1cnJlbnRGaWxlLnR1cywge1xuICAgICAgICAgIHVwbG9hZFVybDogdXBsb2FkVVJMXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIG9uRmlsZVJlbW92ZSAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbignZmlsZS1yZW1vdmVkJywgKGZpbGUpID0+IHtcbiAgICAgIGlmIChmaWxlSUQgPT09IGZpbGUuaWQpIGNiKGZpbGUuaWQpXG4gICAgfSlcbiAgfVxuXG4gIG9uUGF1c2UgKGZpbGVJRCwgY2IpIHtcbiAgICB0aGlzLnVwbG9hZGVyRXZlbnRzW2ZpbGVJRF0ub24oJ3VwbG9hZC1wYXVzZScsICh0YXJnZXRGaWxlSUQsIGlzUGF1c2VkKSA9PiB7XG4gICAgICBpZiAoZmlsZUlEID09PSB0YXJnZXRGaWxlSUQpIHtcbiAgICAgICAgLy8gY29uc3QgaXNQYXVzZWQgPSB0aGlzLnVwcHkucGF1c2VSZXN1bWUoZmlsZUlEKVxuICAgICAgICBjYihpc1BhdXNlZClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgb25SZXRyeSAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbigndXBsb2FkLXJldHJ5JywgKHRhcmdldEZpbGVJRCkgPT4ge1xuICAgICAgaWYgKGZpbGVJRCA9PT0gdGFyZ2V0RmlsZUlEKSB7XG4gICAgICAgIGNiKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgb25SZXRyeUFsbCAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbigncmV0cnktYWxsJywgKGZpbGVzVG9SZXRyeSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnVwcHkuZ2V0RmlsZShmaWxlSUQpKSByZXR1cm5cbiAgICAgIGNiKClcbiAgICB9KVxuICB9XG5cbiAgb25QYXVzZUFsbCAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbigncGF1c2UtYWxsJywgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnVwcHkuZ2V0RmlsZShmaWxlSUQpKSByZXR1cm5cbiAgICAgIGNiKClcbiAgICB9KVxuICB9XG5cbiAgb25DYW5jZWxBbGwgKGZpbGVJRCwgY2IpIHtcbiAgICB0aGlzLnVwbG9hZGVyRXZlbnRzW2ZpbGVJRF0ub24oJ2NhbmNlbC1hbGwnLCAoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMudXBweS5nZXRGaWxlKGZpbGVJRCkpIHJldHVyblxuICAgICAgY2IoKVxuICAgIH0pXG4gIH1cblxuICBvblJlc3VtZUFsbCAoZmlsZUlELCBjYikge1xuICAgIHRoaXMudXBsb2FkZXJFdmVudHNbZmlsZUlEXS5vbigncmVzdW1lLWFsbCcsICgpID0+IHtcbiAgICAgIGlmICghdGhpcy51cHB5LmdldEZpbGUoZmlsZUlEKSkgcmV0dXJuXG4gICAgICBjYigpXG4gICAgfSlcbiAgfVxuXG4gIHVwbG9hZEZpbGVzIChmaWxlcykge1xuICAgIGNvbnN0IGFjdGlvbnMgPSBmaWxlcy5tYXAoKGZpbGUsIGkpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBwYXJzZUludChpLCAxMCkgKyAxXG4gICAgICBjb25zdCB0b3RhbCA9IGZpbGVzLmxlbmd0aFxuXG4gICAgICBpZiAoZmlsZS5lcnJvcikge1xuICAgICAgICByZXR1cm4gKCkgPT4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGZpbGUuZXJyb3IpKVxuICAgICAgfSBlbHNlIGlmIChmaWxlLmlzUmVtb3RlKSB7XG4gICAgICAgIC8vIFdlIGVtaXQgdXBsb2FkLXN0YXJ0ZWQgaGVyZSwgc28gdGhhdCBpdCdzIGFsc28gZW1pdHRlZCBmb3IgZmlsZXNcbiAgICAgICAgLy8gdGhhdCBoYXZlIHRvIHdhaXQgZHVlIHRvIHRoZSBgbGltaXRgIG9wdGlvbi5cbiAgICAgICAgdGhpcy51cHB5LmVtaXQoJ3VwbG9hZC1zdGFydGVkJywgZmlsZSlcbiAgICAgICAgcmV0dXJuIHRoaXMudXBsb2FkUmVtb3RlLmJpbmQodGhpcywgZmlsZSwgY3VycmVudCwgdG90YWwpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVwcHkuZW1pdCgndXBsb2FkLXN0YXJ0ZWQnLCBmaWxlKVxuICAgICAgICByZXR1cm4gdGhpcy51cGxvYWQuYmluZCh0aGlzLCBmaWxlLCBjdXJyZW50LCB0b3RhbClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgY29uc3QgcHJvbWlzZXMgPSBhY3Rpb25zLm1hcCgoYWN0aW9uKSA9PiB7XG4gICAgICBjb25zdCBsaW1pdGVkQWN0aW9uID0gdGhpcy5saW1pdFVwbG9hZHMoYWN0aW9uKVxuICAgICAgcmV0dXJuIGxpbWl0ZWRBY3Rpb24oKVxuICAgIH0pXG5cbiAgICByZXR1cm4gc2V0dGxlKHByb21pc2VzKVxuICB9XG5cbiAgaGFuZGxlVXBsb2FkIChmaWxlSURzKSB7XG4gICAgaWYgKGZpbGVJRHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnVwcHkubG9nKCdUdXM6IG5vIGZpbGVzIHRvIHVwbG9hZCEnKVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgfVxuXG4gICAgdGhpcy51cHB5LmxvZygnVHVzIGlzIHVwbG9hZGluZy4uLicpXG4gICAgY29uc3QgZmlsZXNUb1VwbG9hZCA9IGZpbGVJRHMubWFwKChmaWxlSUQpID0+IHRoaXMudXBweS5nZXRGaWxlKGZpbGVJRCkpXG5cbiAgICByZXR1cm4gdGhpcy51cGxvYWRGaWxlcyhmaWxlc1RvVXBsb2FkKVxuICAgICAgLnRoZW4oKCkgPT4gbnVsbClcbiAgfVxuXG4gIGluc3RhbGwgKCkge1xuICAgIHRoaXMudXBweS5zZXRTdGF0ZSh7XG4gICAgICBjYXBhYmlsaXRpZXM6IE9iamVjdC5hc3NpZ24oe30sIHRoaXMudXBweS5nZXRTdGF0ZSgpLmNhcGFiaWxpdGllcywge1xuICAgICAgICByZXN1bWFibGVVcGxvYWRzOiB0cnVlXG4gICAgICB9KVxuICAgIH0pXG4gICAgdGhpcy51cHB5LmFkZFVwbG9hZGVyKHRoaXMuaGFuZGxlVXBsb2FkKVxuXG4gICAgdGhpcy51cHB5Lm9uKCdyZXNldC1wcm9ncmVzcycsIHRoaXMuaGFuZGxlUmVzZXRQcm9ncmVzcylcblxuICAgIGlmICh0aGlzLm9wdHMuYXV0b1JldHJ5KSB7XG4gICAgICB0aGlzLnVwcHkub24oJ2JhY2stb25saW5lJywgdGhpcy51cHB5LnJldHJ5QWxsKVxuICAgIH1cbiAgfVxuXG4gIHVuaW5zdGFsbCAoKSB7XG4gICAgdGhpcy51cHB5LnNldFN0YXRlKHtcbiAgICAgIGNhcGFiaWxpdGllczogT2JqZWN0LmFzc2lnbih7fSwgdGhpcy51cHB5LmdldFN0YXRlKCkuY2FwYWJpbGl0aWVzLCB7XG4gICAgICAgIHJlc3VtYWJsZVVwbG9hZHM6IGZhbHNlXG4gICAgICB9KVxuICAgIH0pXG4gICAgdGhpcy51cHB5LnJlbW92ZVVwbG9hZGVyKHRoaXMuaGFuZGxlVXBsb2FkKVxuXG4gICAgaWYgKHRoaXMub3B0cy5hdXRvUmV0cnkpIHtcbiAgICAgIHRoaXMudXBweS5vZmYoJ2JhY2stb25saW5lJywgdGhpcy51cHB5LnJldHJ5QWxsKVxuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gKiBUcmFuc2xhdGVzIHN0cmluZ3Mgd2l0aCBpbnRlcnBvbGF0aW9uICYgcGx1cmFsaXphdGlvbiBzdXBwb3J0LlxuICogRXh0ZW5zaWJsZSB3aXRoIGN1c3RvbSBkaWN0aW9uYXJpZXMgYW5kIHBsdXJhbGl6YXRpb24gZnVuY3Rpb25zLlxuICpcbiAqIEJvcnJvd3MgaGVhdmlseSBmcm9tIGFuZCBpbnNwaXJlZCBieSBQb2x5Z2xvdCBodHRwczovL2dpdGh1Yi5jb20vYWlyYm5iL3BvbHlnbG90LmpzLFxuICogYmFzaWNhbGx5IGEgc3RyaXBwZWQtZG93biB2ZXJzaW9uIG9mIGl0LiBEaWZmZXJlbmNlczogcGx1cmFsaXphdGlvbiBmdW5jdGlvbnMgYXJlIG5vdCBoYXJkY29kZWRcbiAqIGFuZCBjYW4gYmUgZWFzaWx5IGFkZGVkIGFtb25nIHdpdGggZGljdGlvbmFyaWVzLCBuZXN0ZWQgb2JqZWN0cyBhcmUgdXNlZCBmb3IgcGx1cmFsaXphdGlvblxuICogYXMgb3Bwb3NlZCB0byBgfHx8fGAgZGVsaW1ldGVyXG4gKlxuICogVXNhZ2UgZXhhbXBsZTogYHRyYW5zbGF0b3IudHJhbnNsYXRlKCdmaWxlc19jaG9zZW4nLCB7c21hcnRfY291bnQ6IDN9KWBcbiAqXG4gKiBAcGFyYW0ge29iamVjdHxBcnJheTxvYmplY3Q+fSBsb2NhbGUgTG9jYWxlIG9yIGxpc3Qgb2YgbG9jYWxlcy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUcmFuc2xhdG9yIHtcbiAgY29uc3RydWN0b3IgKGxvY2FsZXMpIHtcbiAgICB0aGlzLmxvY2FsZSA9IHtcbiAgICAgIHN0cmluZ3M6IHt9LFxuICAgICAgcGx1cmFsaXplOiBmdW5jdGlvbiAobikge1xuICAgICAgICBpZiAobiA9PT0gMSkge1xuICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDFcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShsb2NhbGVzKSkge1xuICAgICAgbG9jYWxlcy5mb3JFYWNoKChsb2NhbGUpID0+IHRoaXMuX2FwcGx5KGxvY2FsZSkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FwcGx5KGxvY2FsZXMpXG4gICAgfVxuICB9XG5cbiAgX2FwcGx5IChsb2NhbGUpIHtcbiAgICBpZiAoIWxvY2FsZSB8fCAhbG9jYWxlLnN0cmluZ3MpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHByZXZMb2NhbGUgPSB0aGlzLmxvY2FsZVxuICAgIHRoaXMubG9jYWxlID0gT2JqZWN0LmFzc2lnbih7fSwgcHJldkxvY2FsZSwge1xuICAgICAgc3RyaW5nczogT2JqZWN0LmFzc2lnbih7fSwgcHJldkxvY2FsZS5zdHJpbmdzLCBsb2NhbGUuc3RyaW5ncylcbiAgICB9KVxuICAgIHRoaXMubG9jYWxlLnBsdXJhbGl6ZSA9IGxvY2FsZS5wbHVyYWxpemUgfHwgcHJldkxvY2FsZS5wbHVyYWxpemVcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHN0cmluZyB3aXRoIHBsYWNlaG9sZGVyIHZhcmlhYmxlcyBsaWtlIGAle3NtYXJ0X2NvdW50fSBmaWxlIHNlbGVjdGVkYFxuICAgKiBhbmQgcmVwbGFjZXMgaXQgd2l0aCB2YWx1ZXMgZnJvbSBvcHRpb25zIGB7c21hcnRfY291bnQ6IDV9YFxuICAgKlxuICAgKiBAbGljZW5zZSBodHRwczovL2dpdGh1Yi5jb20vYWlyYm5iL3BvbHlnbG90LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0VcbiAgICogdGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vYWlyYm5iL3BvbHlnbG90LmpzL2Jsb2IvbWFzdGVyL2xpYi9wb2x5Z2xvdC5qcyNMMjk5XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwaHJhc2UgdGhhdCBuZWVkcyBpbnRlcnBvbGF0aW9uLCB3aXRoIHBsYWNlaG9sZGVyc1xuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB3aXRoIHZhbHVlcyB0aGF0IHdpbGwgYmUgdXNlZCB0byByZXBsYWNlIHBsYWNlaG9sZGVyc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGludGVycG9sYXRlZFxuICAgKi9cbiAgaW50ZXJwb2xhdGUgKHBocmFzZSwgb3B0aW9ucykge1xuICAgIGNvbnN0IHsgc3BsaXQsIHJlcGxhY2UgfSA9IFN0cmluZy5wcm90b3R5cGVcbiAgICBjb25zdCBkb2xsYXJSZWdleCA9IC9cXCQvZ1xuICAgIGNvbnN0IGRvbGxhckJpbGxzWWFsbCA9ICckJCQkJ1xuICAgIGxldCBpbnRlcnBvbGF0ZWQgPSBbcGhyYXNlXVxuXG4gICAgZm9yIChsZXQgYXJnIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChhcmcgIT09ICdfJyAmJiBvcHRpb25zLmhhc093blByb3BlcnR5KGFyZykpIHtcbiAgICAgICAgLy8gRW5zdXJlIHJlcGxhY2VtZW50IHZhbHVlIGlzIGVzY2FwZWQgdG8gcHJldmVudCBzcGVjaWFsICQtcHJlZml4ZWRcbiAgICAgICAgLy8gcmVnZXggcmVwbGFjZSB0b2tlbnMuIHRoZSBcIiQkJCRcIiBpcyBuZWVkZWQgYmVjYXVzZSBlYWNoIFwiJFwiIG5lZWRzIHRvXG4gICAgICAgIC8vIGJlIGVzY2FwZWQgd2l0aCBcIiRcIiBpdHNlbGYsIGFuZCB3ZSBuZWVkIHR3byBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dC5cbiAgICAgICAgdmFyIHJlcGxhY2VtZW50ID0gb3B0aW9uc1thcmddXG4gICAgICAgIGlmICh0eXBlb2YgcmVwbGFjZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgcmVwbGFjZW1lbnQgPSByZXBsYWNlLmNhbGwob3B0aW9uc1thcmddLCBkb2xsYXJSZWdleCwgZG9sbGFyQmlsbHNZYWxsKVxuICAgICAgICB9XG4gICAgICAgIC8vIFdlIGNyZWF0ZSBhIG5ldyBgUmVnRXhwYCBlYWNoIHRpbWUgaW5zdGVhZCBvZiB1c2luZyBhIG1vcmUtZWZmaWNpZW50XG4gICAgICAgIC8vIHN0cmluZyByZXBsYWNlIHNvIHRoYXQgdGhlIHNhbWUgYXJndW1lbnQgY2FuIGJlIHJlcGxhY2VkIG11bHRpcGxlIHRpbWVzXG4gICAgICAgIC8vIGluIHRoZSBzYW1lIHBocmFzZS5cbiAgICAgICAgaW50ZXJwb2xhdGVkID0gaW5zZXJ0UmVwbGFjZW1lbnQoaW50ZXJwb2xhdGVkLCBuZXcgUmVnRXhwKCclXFxcXHsnICsgYXJnICsgJ1xcXFx9JywgJ2cnKSwgcmVwbGFjZW1lbnQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGludGVycG9sYXRlZFxuXG4gICAgZnVuY3Rpb24gaW5zZXJ0UmVwbGFjZW1lbnQgKHNvdXJjZSwgcngsIHJlcGxhY2VtZW50KSB7XG4gICAgICBjb25zdCBuZXdQYXJ0cyA9IFtdXG4gICAgICBzb3VyY2UuZm9yRWFjaCgoY2h1bmspID0+IHtcbiAgICAgICAgc3BsaXQuY2FsbChjaHVuaywgcngpLmZvckVhY2goKHJhdywgaSwgbGlzdCkgPT4ge1xuICAgICAgICAgIGlmIChyYXcgIT09ICcnKSB7XG4gICAgICAgICAgICBuZXdQYXJ0cy5wdXNoKHJhdylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJbnRlcmxhY2Ugd2l0aCB0aGUgYHJlcGxhY2VtZW50YCB2YWx1ZVxuICAgICAgICAgIGlmIChpIDwgbGlzdC5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBuZXdQYXJ0cy5wdXNoKHJlcGxhY2VtZW50KVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICByZXR1cm4gbmV3UGFydHNcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUHVibGljIHRyYW5zbGF0ZSBtZXRob2RcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyB3aXRoIHZhbHVlcyB0aGF0IHdpbGwgYmUgdXNlZCBsYXRlciB0byByZXBsYWNlIHBsYWNlaG9sZGVycyBpbiBzdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfSB0cmFuc2xhdGVkIChhbmQgaW50ZXJwb2xhdGVkKVxuICAgKi9cbiAgdHJhbnNsYXRlIChrZXksIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2xhdGVBcnJheShrZXksIG9wdGlvbnMpLmpvaW4oJycpXG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgdHJhbnNsYXRpb24gYW5kIHJldHVybiB0aGUgdHJhbnNsYXRlZCBhbmQgaW50ZXJwb2xhdGVkIHBhcnRzIGFzIGFuIGFycmF5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIHdpdGggdmFsdWVzIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHJlcGxhY2UgcGxhY2Vob2xkZXJzXG4gICAqIEByZXR1cm4ge0FycmF5fSBUaGUgdHJhbnNsYXRlZCBhbmQgaW50ZXJwb2xhdGVkIHBhcnRzLCBpbiBvcmRlci5cbiAgICovXG4gIHRyYW5zbGF0ZUFycmF5IChrZXksIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5zbWFydF9jb3VudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhciBwbHVyYWwgPSB0aGlzLmxvY2FsZS5wbHVyYWxpemUob3B0aW9ucy5zbWFydF9jb3VudClcbiAgICAgIHJldHVybiB0aGlzLmludGVycG9sYXRlKHRoaXMubG9jYWxlLnN0cmluZ3Nba2V5XVtwbHVyYWxdLCBvcHRpb25zKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmludGVycG9sYXRlKHRoaXMubG9jYWxlLnN0cmluZ3Nba2V5XSwgb3B0aW9ucylcbiAgfVxufVxuIiwiY29uc3QgdGhyb3R0bGUgPSByZXF1aXJlKCdsb2Rhc2gudGhyb3R0bGUnKVxuXG5mdW5jdGlvbiBfZW1pdFNvY2tldFByb2dyZXNzICh1cGxvYWRlciwgcHJvZ3Jlc3NEYXRhLCBmaWxlKSB7XG4gIGNvbnN0IHsgcHJvZ3Jlc3MsIGJ5dGVzVXBsb2FkZWQsIGJ5dGVzVG90YWwgfSA9IHByb2dyZXNzRGF0YVxuICBpZiAocHJvZ3Jlc3MpIHtcbiAgICB1cGxvYWRlci51cHB5LmxvZyhgVXBsb2FkIHByb2dyZXNzOiAke3Byb2dyZXNzfWApXG4gICAgdXBsb2FkZXIudXBweS5lbWl0KCd1cGxvYWQtcHJvZ3Jlc3MnLCBmaWxlLCB7XG4gICAgICB1cGxvYWRlcixcbiAgICAgIGJ5dGVzVXBsb2FkZWQ6IGJ5dGVzVXBsb2FkZWQsXG4gICAgICBieXRlc1RvdGFsOiBieXRlc1RvdGFsXG4gICAgfSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlKF9lbWl0U29ja2V0UHJvZ3Jlc3MsIDMwMCwge2xlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlfSlcbiIsImNvbnN0IGlzRE9NRWxlbWVudCA9IHJlcXVpcmUoJy4vaXNET01FbGVtZW50JylcblxuLyoqXG4gKiBGaW5kIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtOb2RlfHN0cmluZ30gZWxlbWVudFxuICogQHJldHVybiB7Tm9kZXxudWxsfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZpbmRET01FbGVtZW50IChlbGVtZW50KSB7XG4gIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KVxuICB9XG5cbiAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSAnb2JqZWN0JyAmJiBpc0RPTUVsZW1lbnQoZWxlbWVudCkpIHtcbiAgICByZXR1cm4gZWxlbWVudFxuICB9XG59XG4iLCIvKipcbiAqIFRha2VzIGEgZmlsZSBvYmplY3QgYW5kIHR1cm5zIGl0IGludG8gZmlsZUlELCBieSBjb252ZXJ0aW5nIGZpbGUubmFtZSB0byBsb3dlcmNhc2UsXG4gKiByZW1vdmluZyBleHRyYSBjaGFyYWN0ZXJzIGFuZCBhZGRpbmcgdHlwZSwgc2l6ZSBhbmQgbGFzdE1vZGlmaWVkXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGZpbGVcbiAqIEByZXR1cm4ge1N0cmluZ30gdGhlIGZpbGVJRFxuICpcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZW5lcmF0ZUZpbGVJRCAoZmlsZSkge1xuICAvLyBmaWx0ZXIgaXMgbmVlZGVkIHRvIG5vdCBqb2luIGVtcHR5IHZhbHVlcyB3aXRoIGAtYFxuICByZXR1cm4gW1xuICAgICd1cHB5JyxcbiAgICBmaWxlLm5hbWUgPyBmaWxlLm5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9bXkEtWjAtOV0vaWcsICcnKSA6ICcnLFxuICAgIGZpbGUudHlwZSxcbiAgICBmaWxlLmRhdGEuc2l6ZSxcbiAgICBmaWxlLmRhdGEubGFzdE1vZGlmaWVkXG4gIF0uZmlsdGVyKHZhbCA9PiB2YWwpLmpvaW4oJy0nKVxufVxuIiwiLyoqXG4qIFRha2VzIGEgZnVsbCBmaWxlbmFtZSBzdHJpbmcgYW5kIHJldHVybnMgYW4gb2JqZWN0IHtuYW1lLCBleHRlbnNpb259XG4qXG4qIEBwYXJhbSB7c3RyaW5nfSBmdWxsRmlsZU5hbWVcbiogQHJldHVybiB7b2JqZWN0fSB7bmFtZSwgZXh0ZW5zaW9ufVxuKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0RmlsZU5hbWVBbmRFeHRlbnNpb24gKGZ1bGxGaWxlTmFtZSkge1xuICB2YXIgcmUgPSAvKD86XFwuKFteLl0rKSk/JC9cbiAgdmFyIGZpbGVFeHQgPSByZS5leGVjKGZ1bGxGaWxlTmFtZSlbMV1cbiAgdmFyIGZpbGVOYW1lID0gZnVsbEZpbGVOYW1lLnJlcGxhY2UoJy4nICsgZmlsZUV4dCwgJycpXG4gIHJldHVybiB7XG4gICAgbmFtZTogZmlsZU5hbWUsXG4gICAgZXh0ZW5zaW9uOiBmaWxlRXh0XG4gIH1cbn1cbiIsImNvbnN0IGdldEZpbGVOYW1lQW5kRXh0ZW5zaW9uID0gcmVxdWlyZSgnLi9nZXRGaWxlTmFtZUFuZEV4dGVuc2lvbicpXG5jb25zdCBtaW1lVHlwZXMgPSByZXF1aXJlKCcuL21pbWVUeXBlcycpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0RmlsZVR5cGUgKGZpbGUpIHtcbiAgY29uc3QgZmlsZUV4dGVuc2lvbiA9IGZpbGUubmFtZSA/IGdldEZpbGVOYW1lQW5kRXh0ZW5zaW9uKGZpbGUubmFtZSkuZXh0ZW5zaW9uIDogbnVsbFxuXG4gIGlmIChmaWxlLmlzUmVtb3RlKSB7XG4gICAgLy8gc29tZSByZW1vdGUgcHJvdmlkZXJzIGRvIG5vdCBzdXBwb3J0IGZpbGUgdHlwZXNcbiAgICByZXR1cm4gZmlsZS50eXBlID8gZmlsZS50eXBlIDogbWltZVR5cGVzW2ZpbGVFeHRlbnNpb25dXG4gIH1cblxuICAvLyBjaGVjayBpZiBtaW1lIHR5cGUgaXMgc2V0IGluIHRoZSBmaWxlIG9iamVjdFxuICBpZiAoZmlsZS50eXBlKSB7XG4gICAgcmV0dXJuIGZpbGUudHlwZVxuICB9XG5cbiAgLy8gc2VlIGlmIHdlIGNhbiBtYXAgZXh0ZW5zaW9uIHRvIGEgbWltZSB0eXBlXG4gIGlmIChmaWxlRXh0ZW5zaW9uICYmIG1pbWVUeXBlc1tmaWxlRXh0ZW5zaW9uXSkge1xuICAgIHJldHVybiBtaW1lVHlwZXNbZmlsZUV4dGVuc2lvbl1cbiAgfVxuXG4gIC8vIGlmIGFsbCBmYWlscywgZmFsbCBiYWNrIHRvIGEgZ2VuZXJpYyBieXRlIHN0cmVhbSB0eXBlXG4gIHJldHVybiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJ1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRTb2NrZXRIb3N0ICh1cmwpIHtcbiAgLy8gZ2V0IHRoZSBob3N0IGRvbWFpblxuICB2YXIgcmVnZXggPSAvXig/Omh0dHBzPzpcXC9cXC98XFwvXFwvKT8oPzpbXkBcXG5dK0ApPyg/Ond3d1xcLik/KFteXFxuXSspL1xuICB2YXIgaG9zdCA9IHJlZ2V4LmV4ZWModXJsKVsxXVxuICB2YXIgc29ja2V0UHJvdG9jb2wgPSBsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2h0dHBzOicgPyAnd3NzJyA6ICd3cydcblxuICByZXR1cm4gYCR7c29ja2V0UHJvdG9jb2x9Oi8vJHtob3N0fWBcbn1cbiIsIi8qKlxuICogUmV0dXJucyBhIHRpbWVzdGFtcCBpbiB0aGUgZm9ybWF0IG9mIGBob3VyczptaW51dGVzOnNlY29uZHNgXG4qL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRUaW1lU3RhbXAgKCkge1xuICB2YXIgZGF0ZSA9IG5ldyBEYXRlKClcbiAgdmFyIGhvdXJzID0gcGFkKGRhdGUuZ2V0SG91cnMoKS50b1N0cmluZygpKVxuICB2YXIgbWludXRlcyA9IHBhZChkYXRlLmdldE1pbnV0ZXMoKS50b1N0cmluZygpKVxuICB2YXIgc2Vjb25kcyA9IHBhZChkYXRlLmdldFNlY29uZHMoKS50b1N0cmluZygpKVxuICByZXR1cm4gaG91cnMgKyAnOicgKyBtaW51dGVzICsgJzonICsgc2Vjb25kc1xufVxuXG4vKipcbiAqIEFkZHMgemVybyB0byBzdHJpbmdzIHNob3J0ZXIgdGhhbiB0d28gY2hhcmFjdGVyc1xuKi9cbmZ1bmN0aW9uIHBhZCAoc3RyKSB7XG4gIHJldHVybiBzdHIubGVuZ3RoICE9PSAyID8gMCArIHN0ciA6IHN0clxufVxuIiwiLyoqXG4gKiBDaGVjayBpZiBhbiBvYmplY3QgaXMgYSBET00gZWxlbWVudC4gRHVjay10eXBpbmcgYmFzZWQgb24gYG5vZGVUeXBlYC5cbiAqXG4gKiBAcGFyYW0geyp9IG9ialxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzRE9NRWxlbWVudCAob2JqKSB7XG4gIHJldHVybiBvYmogJiYgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgb2JqLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERVxufVxuIiwiLyoqXG4gKiBMaW1pdCB0aGUgYW1vdW50IG9mIHNpbXVsdGFuZW91c2x5IHBlbmRpbmcgUHJvbWlzZXMuXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBwYXNzZWQgYSBmdW5jdGlvbiBgZm5gLFxuICogd2lsbCBtYWtlIHN1cmUgdGhhdCBhdCBtb3N0IGBsaW1pdGAgY2FsbHMgdG8gYGZuYCBhcmUgcGVuZGluZy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gbGltaXRcbiAqIEByZXR1cm4ge2Z1bmN0aW9uKCl9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbGltaXRQcm9taXNlcyAobGltaXQpIHtcbiAgbGV0IHBlbmRpbmcgPSAwXG4gIGNvbnN0IHF1ZXVlID0gW11cbiAgcmV0dXJuIChmbikgPT4ge1xuICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xuICAgICAgY29uc3QgY2FsbCA9ICgpID0+IHtcbiAgICAgICAgcGVuZGluZysrXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBmbiguLi5hcmdzKVxuICAgICAgICBwcm9taXNlLnRoZW4ob25maW5pc2gsIG9uZmluaXNoKVxuICAgICAgICByZXR1cm4gcHJvbWlzZVxuICAgICAgfVxuXG4gICAgICBpZiAocGVuZGluZyA+PSBsaW1pdCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHF1ZXVlLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgY2FsbCgpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICByZXR1cm4gY2FsbCgpXG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIG9uZmluaXNoICgpIHtcbiAgICBwZW5kaW5nLS1cbiAgICBjb25zdCBuZXh0ID0gcXVldWUuc2hpZnQoKVxuICAgIGlmIChuZXh0KSBuZXh0KClcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICdtZCc6ICd0ZXh0L21hcmtkb3duJyxcbiAgJ21hcmtkb3duJzogJ3RleHQvbWFya2Rvd24nLFxuICAnbXA0JzogJ3ZpZGVvL21wNCcsXG4gICdtcDMnOiAnYXVkaW8vbXAzJyxcbiAgJ3N2Zyc6ICdpbWFnZS9zdmcreG1sJyxcbiAgJ2pwZyc6ICdpbWFnZS9qcGVnJyxcbiAgJ3BuZyc6ICdpbWFnZS9wbmcnLFxuICAnZ2lmJzogJ2ltYWdlL2dpZicsXG4gICd5YW1sJzogJ3RleHQveWFtbCcsXG4gICd5bWwnOiAndGV4dC95YW1sJyxcbiAgJ2Nzdic6ICd0ZXh0L2NzdicsXG4gICdhdmknOiAndmlkZW8veC1tc3ZpZGVvJyxcbiAgJ21rcyc6ICd2aWRlby94LW1hdHJvc2thJyxcbiAgJ21rdic6ICd2aWRlby94LW1hdHJvc2thJyxcbiAgJ21vdic6ICd2aWRlby9xdWlja3RpbWUnLFxuICAnZG9jJzogJ2FwcGxpY2F0aW9uL21zd29yZCcsXG4gICdkb2NtJzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy13b3JkLmRvY3VtZW50Lm1hY3JvZW5hYmxlZC4xMicsXG4gICdkb2N4JzogJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50JyxcbiAgJ2RvdCc6ICdhcHBsaWNhdGlvbi9tc3dvcmQnLFxuICAnZG90bSc6ICdhcHBsaWNhdGlvbi92bmQubXMtd29yZC50ZW1wbGF0ZS5tYWNyb2VuYWJsZWQuMTInLFxuICAnZG90eCc6ICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC50ZW1wbGF0ZScsXG4gICd4bGEnOiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJyxcbiAgJ3hsYW0nOiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsLmFkZGluLm1hY3JvZW5hYmxlZC4xMicsXG4gICd4bGMnOiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJyxcbiAgJ3hsZic6ICdhcHBsaWNhdGlvbi94LXhsaWZmK3htbCcsXG4gICd4bG0nOiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJyxcbiAgJ3hscyc6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnLFxuICAneGxzYic6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwuc2hlZXQuYmluYXJ5Lm1hY3JvZW5hYmxlZC4xMicsXG4gICd4bHNtJzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbC5zaGVldC5tYWNyb2VuYWJsZWQuMTInLFxuICAneGxzeCc6ICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCcsXG4gICd4bHQnOiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJyxcbiAgJ3hsdG0nOiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsLnRlbXBsYXRlLm1hY3JvZW5hYmxlZC4xMicsXG4gICd4bHR4JzogJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnRlbXBsYXRlJyxcbiAgJ3hsdyc6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNldHRsZSAocHJvbWlzZXMpIHtcbiAgY29uc3QgcmVzb2x1dGlvbnMgPSBbXVxuICBjb25zdCByZWplY3Rpb25zID0gW11cbiAgZnVuY3Rpb24gcmVzb2x2ZWQgKHZhbHVlKSB7XG4gICAgcmVzb2x1dGlvbnMucHVzaCh2YWx1ZSlcbiAgfVxuICBmdW5jdGlvbiByZWplY3RlZCAoZXJyb3IpIHtcbiAgICByZWplY3Rpb25zLnB1c2goZXJyb3IpXG4gIH1cblxuICBjb25zdCB3YWl0ID0gUHJvbWlzZS5hbGwoXG4gICAgcHJvbWlzZXMubWFwKChwcm9taXNlKSA9PiBwcm9taXNlLnRoZW4ocmVzb2x2ZWQsIHJlamVjdGVkKSlcbiAgKVxuXG4gIHJldHVybiB3YWl0LnRoZW4oKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzZnVsOiByZXNvbHV0aW9ucyxcbiAgICAgIGZhaWxlZDogcmVqZWN0aW9uc1xuICAgIH1cbiAgfSlcbn1cbiIsIi8qKlxuICogQ29udmVydHMgbGlzdCBpbnRvIGFycmF5XG4qL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b0FycmF5IChsaXN0KSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChsaXN0IHx8IFtdLCAwKVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImNvbnN0IFVwcHkgPSByZXF1aXJlKCdAdXBweS9jb3JlJylcbmNvbnN0IERyYWdEcm9wID0gcmVxdWlyZSgnQHVwcHkvZHJhZy1kcm9wJylcbmNvbnN0IFByb2dyZXNzQmFyID0gcmVxdWlyZSgnQHVwcHkvcHJvZ3Jlc3MtYmFyJylcbmNvbnN0IFR1cyA9IHJlcXVpcmUoJ0B1cHB5L3R1cycpXG5cbmNvbnN0IHVwcHlPbmUgPSBuZXcgVXBweSh7ZGVidWc6IHRydWUsIGF1dG9Qcm9jZWVkOiB0cnVlfSlcbnVwcHlPbmVcbiAgLnVzZShEcmFnRHJvcCwge3RhcmdldDogJy5VcHB5RHJhZ0Ryb3AtT25lJ30pXG4gIC51c2UoVHVzLCB7ZW5kcG9pbnQ6ICdodHRwczovL21hc3Rlci50dXMuaW8vZmlsZXMvJ30pXG4gIC51c2UoUHJvZ3Jlc3NCYXIsIHt0YXJnZXQ6ICcuVXBweURyYWdEcm9wLU9uZS1Qcm9ncmVzcycsIGhpZGVBZnRlckZpbmlzaDogZmFsc2V9KVxuXG5jb25zdCB1cHB5VHdvID0gbmV3IFVwcHkoe2RlYnVnOiB0cnVlLCBhdXRvUHJvY2VlZDogZmFsc2V9KVxudXBweVR3b1xuICAudXNlKERyYWdEcm9wLCB7dGFyZ2V0OiAnI1VwcHlEcmFnRHJvcC1Ud28nfSlcbiAgLnVzZShUdXMsIHtlbmRwb2ludDogJ2h0dHBzOi8vbWFzdGVyLnR1cy5pby9maWxlcy8nfSlcbiAgLnVzZShQcm9ncmVzc0Jhciwge3RhcmdldDogJy5VcHB5RHJhZ0Ryb3AtVHdvLVByb2dyZXNzJywgaGlkZUFmdGVyRmluaXNoOiBmYWxzZX0pXG5cbnZhciB1cGxvYWRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuVXBweURyYWdEcm9wLVR3by1VcGxvYWQnKVxudXBsb2FkQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICB1cHB5VHdvLnVwbG9hZCgpXG59KVxuIl19
