/*
 * Diagnostic function for the JavaScript context of an application running
 * ON a Google Home Mini. Loading this file performs no microphone request.
 * It is not an installer, an unlock, or a complete Local Home integration.
 * It neither reads audio samples nor records/transmits audio.
 */
(function (root) {
  "use strict";
  root.runHomeMiniMicrophoneProbe = async function (options) {
    const nav = root.navigator;
    const report = {
      probeVersion: 1,
      targetIdentity: "operator-confirmed; not independently verified",
      secureContext: root.isSecureContext === true,
      mediaApiPresent: !!(nav && nav.mediaDevices &&
        typeof nav.mediaDevices.getUserMedia === "function")
    };
    if (!options || options.confirmedMiniContext !== true) {
      return Object.assign(report, {status: "mini_context_confirmation_required"});
    }
    if (!report.mediaApiPresent) {
      return Object.assign(report, {status: "media_api_unavailable"});
    }
    return new Promise(function (resolve) {
      let settled = false;
      function finish(result) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(Object.assign(report, result));
      }
      const timer = setTimeout(function () {
        finish({status: "timed_out", timeoutMs: 5000});
      }, 5000);
      let request;
      try {
        request = nav.mediaDevices.getUserMedia({audio: true, video: false});
      } catch (error) {
        finish({status: "request_error", errorName: error.name || "Error"});
        return;
      }
      Promise.resolve(request).then(function (stream) {
        let audioTracks = 0;
        try {
          audioTracks = stream.getAudioTracks().length;
        } finally {
          // Stop even if the permission request resolves after our timeout.
          stream.getTracks().forEach(function (track) { track.stop(); });
        }
        finish({status: audioTracks ? "audio_track_opened" : "no_audio_track",
          audioTrackCount: audioTracks});
      }, function (error) {
        finish({status: "request_rejected", errorName: error.name || "Error"});
      });
    });
  };
})(globalThis);
