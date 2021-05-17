'use strict';

const exitHook = require('exit-hook');
const redis = require("redis");
const publishClient = redis.createClient({ host: process.env.REDIS_HOSTNAME });
const subscribeClient = redis.createClient({ host: process.env.REDIS_HOSTNAME });
const EventEmitter = require('events');
const pubSubEvent = new EventEmitter();

//
// Combined
//
let ready = false;
let publishClientReady = false;
let subscribeClientReady = false;

//
// Pub
//
publishClient.on("ready", function() {
 publishClientReady = true;
 if ( publishClientReady === true && subscribeClientReady === true ) {
  ready = true;
  pubSubEvent.emit('ready');
 }
});

publishClient.on("connect", function() {
 publishClientReady = false;
 ready = false;
});

publishClient.on("reconnecting", function() {
 publishClientReady = false;
 ready = false;
});

publishClient.on("error", function(error) {
 pubSubEvent.emit('error', error);
});

publishClient.on("end", function() {
 publishClientReady = false;
 ready = false;
});

function publish(channel, message) {
 publishClient.publish(channel, JSON.stringify(message));
}

//
// Sub
//
subscribeClient.on("ready", function() {
 subscribeClientReady = true;
 if ( publishClientReady === true && subscribeClientReady === true ) {
  ready = true;
  pubSubEvent.emit('ready');
 }
});

subscribeClient.on("connect", function() {
 subscribeClientReady = false;
 ready = false;
});

subscribeClient.on("reconnecting", function() {
 subscribeClientReady = false;
 ready = false;
});

subscribeClient.on("error", function(error) {
 pubSubEvent.emit('error', error);
});

subscribeClient.on("end", function() {
 subscribeClientReady = false;
 ready = false;
});

subscribeClient.on("subscribe", function(channel, count) {
 pubSubEvent.emit('success', `subscribe to channel: ${channel}, sub count: ${count}`);
});

function subscribe(channel) {
 subscribeClient.subscribe(channel);
}

subscribeClient.on("message", function(channel, message) {
 pubSubEvent.emit(channel, JSON.parse(message));
});

exports.publish = publish;
exports.subscribe = subscribe;
exports.pubSubEvent = pubSubEvent;
exports.pubSubReady = ready;

exitHook(() => {
 subscribeClient.unsubscribe();
 subscribeClient.quit();
 publishClient.quit();
});
