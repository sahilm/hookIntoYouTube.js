/*!
 * Timed hooks into YouTube videos
 * @author Sahil Muthoo <sahil.muthoo@gmail.com> (https://sahilm.com)
 * @license MIT
 */
(function (window) {
  "use strict";
  var ytHook = {};
  var youTubePlayerAPIReady = false;
  var youTubePlayerAPIHref = "//www.youtube.com/iframe_api";

  function onYouTubePlayerAPIReady() {
    youTubePlayerAPIReady = true;
  }

  ytHook.into = function (iframeId, hooks, startOnReady) {
    var hookTimes = hooks.atSeconds.sort(function (a, b) {
      return a - b;
    });


    function onSuccess() {
      new YT.Player(iframeId, {
        events: {
          "onReady": onPlayerReady,
          "onStateChange": onPlayerStateChange
        }
      });

      function onPlayerReady(event) {
        if (startOnReady) {
          event.target.playVideo();
        }
      }

      function onPlayerStateChange(event) {
        var player = event.target;
        var poller;
        if (event.data === YT.PlayerState.PLAYING && !poller) {
          poller = callHooks(player);
        }
        if (event.data === YT.PlayerState.ENDED ||
          event.data === YT.PlayerState.PAUSED ||
          event.data === YT.PlayerState.BUFFERING) {
          clearTimeout(poller);
        }
      }

      function callHooks(player) {
        if (hookTimes.length === 0) {
          return;
        }
        var time = parseInt(player.getCurrentTime().toFixed(0), 10);
        var indexOfHook = find(hookTimes, time);
        if (indexOfHook !== -1) {
          setTimeout(function () {
            hooks.hook.call(hooks, time, player);
          }, 0);
          hookTimes.splice(indexOfHook, 1);
        }
        return setTimeout(function () {
          callHooks(player);
        }, 900);
      }
    }

    function onFailure() {
      throw "Failed to load YouTube player API from " + youTubePlayerAPIHref;
    }

    withYouTubePlayerAPI(onSuccess, onFailure, 2, 200);
  };
  function withYouTubePlayerAPI(onSuccess, onFailure, retries, delay) {
    if (youTubePlayerAPIReady) {
      return onSuccess();
    }
    if (retries <= 0) {
      return onFailure();
    }
    downloadYouTubePlayerAPI();
    setTimeout(function () {
      retries--;
      withYouTubePlayerAPI(onSuccess, onFailure, retries, delay);
    }, delay);
  }

  function downloadYouTubePlayerAPI() {
    var tag = document.createElement("script");
    tag.src = youTubePlayerAPIHref;
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  function find(array, item) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === item) {
        return i;
      }
    }
    return -1;
  }

  window.onYouTubePlayerAPIReady = onYouTubePlayerAPIReady;
  window.ytHook = ytHook;
})(window);
