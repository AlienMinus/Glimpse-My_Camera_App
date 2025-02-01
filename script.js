let video = document.getElementById("video");
      let canvas = document.getElementById("canvas");
      let ctx = canvas.getContext("2d");
      let currentStream = null;
      let track = null;
      let isMirrored = false;
      let mediaRecorder;
      let recordedChunks = [];
      let recordingTime = document.getElementById("recording-time");
      let recordingInterval;
      let seconds = 0;
      let usingRearCamera = false;

      async function startCamera(facingMode = "user") {
        if (currentStream) {
          currentStream.getTracks().forEach((track) => track.stop());
        }
        try {
          let stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
          });
          currentStream = stream;
          video.srcObject = stream;
          track = stream.getVideoTracks()[0];
        } catch (err) {
          console.error("Error accessing camera:", err);
        }
      }

      function takePhoto() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.save();
        if (isMirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        ctx.restore();
        let link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "photo.png";
        link.click();
      }

      function startRecording() {
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(currentStream);
        mediaRecorder.ondataavailable = (event) =>
          recordedChunks.push(event.data);
        mediaRecorder.start();
        seconds = 0;
        recordingInterval = setInterval(updateRecordingTime, 1000);
      }

      function stopRecording() {
        mediaRecorder.stop();
        clearInterval(recordingInterval);
        recordingTime.textContent = "00:00";
        mediaRecorder.onstop = () => {
          let blob = new Blob(recordedChunks, { type: "video/webm" });
          let url = URL.createObjectURL(blob);
          let a = document.createElement("a");
          a.href = url;
          a.download = "video.webm";
          a.click();
        };
      }

      function toggleFlash() {
            if (track && track.getCapabilities().torch) {
                let torchState = !track.getSettings().torch;
                track.applyConstraints({ advanced: [{ torch: torchState }] });
            }
        }

      function switchCamera() {
        usingRearCamera = !usingRearCamera;
        startCamera(usingRearCamera ? "environment" : "user");
      }

      function toggleInvert() {
        video.style.filter = video.style.filter ? "" : "invert(100%)";
      }

      function toggleMirror() {
        isMirrored = !isMirrored;
        video.style.transform = isMirrored ? "scaleX(-1)" : "scaleX(1)";
      }

      function updateRecordingTime() {
        seconds++;
        let mins = Math.floor(seconds / 60)
          .toString()
          .padStart(2, "0");
        let secs = (seconds % 60).toString().padStart(2, "0");
        recordingTime.textContent = `${mins}:${secs}`;
      }

      function setZoom(value) {
        if (track && track.getCapabilities().zoom) {
          let constraints = { advanced: [{ zoom: value }] };
          track.applyConstraints(constraints);
        }
      }

      startCamera();