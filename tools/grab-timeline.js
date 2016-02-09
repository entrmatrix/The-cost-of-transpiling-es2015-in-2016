var fs = require('fs');
var Chrome = require('chrome-remote-interface');
var bigrig = require('bigrig');
var util = require('util');


var TRACE_CATEGORIES = ["-*", "devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "toplevel", "blink.console"]; // "disabled-by-default-devtools.timeline.stack", "disabled-by-default-devtools.screenshot", "disabled-by-default-v8.cpu_profile"

var rawEvents = [];

Chrome(function (chrome) {
    with (chrome) {
        Page.enable();
        Network.enable();
        Network.setCacheDisabled({ cacheDisabled: true });

        Tracing.start({
            "categories":   TRACE_CATEGORIES.join(','),
            "options":      "sampling-frequency=10000"  // 1000 is default and too slow.
        });

        Page.navigate({'url': 'http://localhost:8000/'})
        Page.loadEventFired(function () {
           Tracing.end()
        });

        Tracing.tracingComplete(function () {

            chrome.close();

            results = bigrig.analyze(JSON.stringify(rawEvents, null, 2));
            console.log(util.inspect(results, {showHidden: false, depth: null}));
        });

        Tracing.dataCollected(function(data){
            var events = data.value;
            rawEvents = rawEvents.concat(events);
        });

    }
}).on('error', function (e) {
    console.error('Cannot connect to Chrome', e);
});



