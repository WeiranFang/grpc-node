/**
 * @license
 * Copyright 2018 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/**
 * DefaultCallInvoker module
 *
 * This module wraps the intercepting call to make grpc requests on
 * behalf of a pre-defined channel object.
 */

'use strict';

const _ = require('lodash');
const grpc = require('./grpc_extension');
const client_interceptors = require('./client_interceptors');

class DefaultCallInvoker {

  createChannel(address, credentials, options) {
    let channelOverride = options.channelOverride;
    let channelFactoryOverride = options.channelFactoryOverride;
    var channel_options = _.omit(options, ['channelOverride', 'channelFactoryOverride']);

    var channel;
    if (channelOverride) {
      channel = options.channelOverride;
    } else if (channelFactoryOverride) {
      channel = channelFactoryOverride(address, credentials, channel_options);
    } else {
      channel = new grpc.Channel(address, credentials, channel_options);
    }
    this._channel = channel;
  }

  getChannel() {
    return this._channel;
  }

  makeUnaryRequest(method_definition, argument, metadata, options, interceptors, emitter, callback) {
    var intercepting_call = client_interceptors.getInterceptingCall(
      method_definition,
      options,
      interceptors,
      this._channel,
      callback
    );

    emitter.call = intercepting_call;

    var last_listener = client_interceptors.getLastListener(
      method_definition,
      emitter,
      callback
    );

    intercepting_call.start(metadata, last_listener);
    intercepting_call.sendMessage(argument);
    intercepting_call.halfClose();
  }

  makeClientStreamRequest(method_definition, metadata, options, interceptors, emitter, callback) {
    var intercepting_call = client_interceptors.getInterceptingCall(
      method_definition,
      options,
      interceptors,
      this._channel,
      callback
    );

    emitter.call = intercepting_call;

    var last_listener = client_interceptors.getLastListener(
      method_definition,
      emitter,
      callback
    );

    intercepting_call.start(metadata, last_listener);
  }

  makeServerStreamRequest(method_definition, argument, metadata, options, interceptors, emitter) {
    var intercepting_call = client_interceptors.getInterceptingCall(
      method_definition,
      options,
      interceptors,
      this._channel,
      emitter
    );

    emitter.call = intercepting_call;

    var last_listener = client_interceptors.getLastListener(
      method_definition,
      emitter
    );
  
    intercepting_call.start(metadata, last_listener);
    intercepting_call.sendMessage(argument);
    intercepting_call.halfClose();
  }

  makeBidiStreamRequest(method_definition, metadata, options, interceptors, emitter) {
    var intercepting_call = client_interceptors.getInterceptingCall(
      method_definition,
      options,
      interceptors,
      this._channel,
      emitter
    );

    emitter.call = intercepting_call;

    var last_listener = client_interceptors.getLastListener(
      method_definition,
      emitter
    );

    intercepting_call.start(metadata, last_listener);
  }
}

module.exports = DefaultCallInvoker;
