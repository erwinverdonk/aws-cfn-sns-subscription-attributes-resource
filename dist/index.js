(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading wasm modules
/******/ 	var installedWasmModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// object with all compiled WebAssembly.Modules
/******/ 	__webpack_require__.w = {};
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const HTTPS = __webpack_require__(1);
const URL = __webpack_require__(2);
const subscription_attributes_1 = __webpack_require__(3);
const getCallback = (event, context, callback) => (error, result) => {
    const responseStatus = error ? 'FAILED' : 'SUCCESS';
    const parsedUrl = URL.parse(event.ResponseURL);
    const responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
        PhysicalResourceId: `${event.StackId}_${event.LogicalResourceId}`,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: error || result
    });
    console.log('Callback called: ', responseBody);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': responseBody.length
        }
    };
    const request = HTTPS.request(options, _ => _.on('data', _ => callback(_)));
    request.on('error', _ => callback(_));
    request.write(responseBody);
    request.end();
};
exports.handler = (event, context, cb) => {
    console.log('event', JSON.stringify(event));
    console.log('context', JSON.stringify(context));
    const callback = getCallback(event, context, cb);
    subscription_attributes_1.SubscriptionAttributes.init(event, context).then((requestMethods) => {
        return requestMethods[event.RequestType.toLowerCase()]()
            .then((_) => {
            console.log('success', JSON.stringify(_));
            return callback(null, {});
        })
            .catch((_) => {
            console.error('failed', JSON.stringify(_, Object.getOwnPropertyNames(_)));
            callback({ error: _ }, null);
        });
    });
};


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const AWS = __webpack_require__(4);
const createUpdateSubscriptionAttributes = (sns, props, oldProps) => () => {
    const attributes = props.Attributes;
    const oldAttributes = oldProps ? oldProps.Attributes : [];
    const attToRemove = oldAttributes.filter((oldAtt) => {
        return !attributes.some((att) => att.Name === oldAtt.Name);
    });
    const attToAdd = attributes.filter((att) => {
        return !oldAttributes.some((oldAtt) => oldAtt.Name === att.Name);
    });
    const attToUpdate = attributes.filter((att) => {
        return oldAttributes.some((oldAtt) => (oldAtt.Name === att.Name &&
            oldAtt.Value !== att.Value));
    });
    console.log('Attributes:', JSON.stringify(attributes));
    console.log('Old attributes:', JSON.stringify(oldAttributes));
    console.log('Attributes to add:', JSON.stringify(attToAdd));
    console.log('Attributes to update:', JSON.stringify(attToUpdate));
    return Promise.all(attToRemove.map((att) => sns.setSubscriptionAttributes({
        SubscriptionArn: props.SubscriptionArn,
        AttributeName: att.Name,
        AttributeValue: att.DefaultValue
    }).promise()).concat(attToAdd.map((att) => sns.setSubscriptionAttributes({
        SubscriptionArn: props.SubscriptionArn,
        AttributeName: att.Name,
        AttributeValue: att.Value
    }).promise()), attToUpdate.map((att) => sns.setSubscriptionAttributes({
        SubscriptionArn: props.SubscriptionArn,
        AttributeName: att.Name,
        AttributeValue: att.Value
    }).promise())));
};
const deleteSubscriptionAttributes = (sns, props) => () => {
    const attributes = props.Attributes;
    console.log('Attributes to remove:', JSON.stringify(attributes));
    return Promise.all(attributes.map((att) => sns.setSubscriptionAttributes({
        SubscriptionArn: props.SubscriptionArn,
        AttributeName: att.Name,
        AttributeValue: att.DefaultValue
    }).promise()));
};
exports.SubscriptionAttributes = {
    init: (event, context) => {
        const props = event.ResourceProperties;
        const oldProps = event.OldResourceProperties;
        const sns = new AWS.SNS();
        const run = () => {
            return Promise.resolve({
                create: createUpdateSubscriptionAttributes(sns, props),
                update: createUpdateSubscriptionAttributes(sns, props, oldProps),
                delete: deleteSubscriptionAttributes(sns, props)
            });
        };
        if (!props.SubscriptionArn) {
            return sns.listSubscriptionsByTopic({
                TopicArn: props.TopicArn
            })
                .promise()
                .then(result => {
                props.SubscriptionArn = result.Subscriptions.find(_ => _.Endpoint === props.Endpoint).SubscriptionArn;
                return run();
            });
        }
        else {
            return run();
        }
    }
};


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("aws-sdk");

/***/ })
/******/ ])));