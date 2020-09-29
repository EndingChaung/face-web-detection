var failCount
const video = document.getElementById('video');
const canvas = document.getElementById('canvasDOM');
const canvas1 = document.getElementById('canvasDOM1');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(startVideo)

async function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.log(err)
  )
}

video.addEventListener('play', () => {
  const ts = Date.now()
  setInterval(async () => {
    // 简单人脸检测扫描
    const detections = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,
        scoreThreshold: 0.8
      })
    )
    const detections1 = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,
        scoreThreshold: 0.8
      })
    ).withFaceLandmarks();
    const detections2 = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,
        scoreThreshold: 0.8
      })
    ).withAgeAndGender();
    // 人脸特征点检测模型
    if (detections1) {
      const dims = faceapi.matchDimensions(canvas, video, true)
      const resizedResult = faceapi.resizeResults(detections1, dims)
      faceapi.draw.drawFaceLandmarks(canvas, resizedResult)
    }
    // 年龄性别检测模型
    if (detections2) {
      const dims1 = faceapi.matchDimensions(canvas1, video, true)
      const resizedResult1 = faceapi.resizeResults(detections2, dims1)
      const { age, gender, genderProbability } = resizedResult1
      // interpolate gender predictions over last 30 frames
      // to make the displayed age more stable
      new faceapi.draw.DrawTextField(
        [
          `${faceapi.round(age, 0)} years`,
          `${gender} (${faceapi.round(genderProbability)})`
        ],
        detections2.detection.box.bottomLeft
      ).draw(canvas1)
    }
    // // 判断人脸扫描结果
    if (detections) {
      failCount = 0;
    } else {
      // console.log('人脸特征点监测失败')
      failCount += 1;
      if (failCount > 20) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // 画布绘制
        const ctx = canvas.getContext("2d");
        const linearGradient = ctx.createLinearGradient(0, 0, 300, 0);
        linearGradient.addColorStop("0", "#40E0D0");
        linearGradient.addColorStop("0.5", "#FF8C00");
        linearGradient.addColorStop("1.0", "#FF0080");
        // 绘制信息
        ctx.font = "35px FZShuTi";
        ctx.fillStyle = linearGradient;
        ctx.fillText("未检测到人脸，请进入检测区", 20, 50);
      }
      // eslint-disable-next-line
      // console.log(failCount, "检测失败");
    }
    // 绘制刷新状态
    const runTime = {
      time: Math.round(Date.now() - ts),
      fps: faceapi.round(1000 / (Date.now() - ts))
    };
    // 绘制时间
    // eslint-disable-next-line
    // console.log("绘制时间:", runTime);
  }, 100)

})
