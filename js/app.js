
const imageUpload = document.getElementById('image-upload');
const cameraBtn = document.getElementById('camera-btn');
const previewImage = document.getElementById('preview-image');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsDiv = document.getElementById('results');
const loader = document.getElementById('loader');
const cameraView = document.getElementById('camera-view');
const cameraCanvas = document.getElementById('camera-canvas');
const captureBtn = document.getElementById('capture-btn');
const switchBtn = document.getElementById('switch-btn');


let model;
let mediaStream;
let facingMode = 'environment';


async function loadModel() {
    try {
        model = await mobilenet.load();
        console.log('MobileNet model loaded successfully');
    } catch (error) {
        console.error('Failed to load MobileNet model:', error);
        showError('Failed to load image recognition model. Please refresh the page.');
    }
}


async function init() {
    // Load the model
    await loadModel();
    

    imageUpload.addEventListener('change', handleImageUpload);
    cameraBtn.addEventListener('click', toggleCamera);
    analyzeBtn.addEventListener('click', analyzeImage);
    captureBtn.addEventListener('click', captureImage);
    switchBtn.addEventListener('click', switchCamera);
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    hideCamera();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        analyzeBtn.disabled = false;
    };
    
    reader.readAsDataURL(file);
    

    resetResults();
}


async function toggleCamera() {
    if (cameraView.style.display === 'none') {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            
            cameraView.srcObject = mediaStream;
            cameraView.style.display = 'block';
            captureBtn.style.display = 'block';
            switchBtn.style.display = 'block';
            previewImage.style.display = 'none';
            analyzeBtn.disabled = true;
            

            cameraBtn.textContent = 'Turn Off Camera';
            

            resetResults();
        } catch (error) {
            console.error('Error accessing camera:', error);
            showError('Unable to access camera. Please check permissions or try using a different browser.');
        }
    } else {

        hideCamera();
        cameraBtn.textContent = 'Use Camera';
    }
}


async function switchCamera() {
    if (mediaStream) {

        mediaStream.getTracks().forEach(track => track.stop());

        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        
        try {

            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            
            cameraView.srcObject = mediaStream;
        } catch (error) {
            console.error('Error switching camera:', error);
            showError('Error switching camera. Your device might only have one camera.');
        }
    }
}


function captureImage() {
    if (!cameraView.srcObject) return;
    

    const context = cameraCanvas.getContext('2d');
 
    cameraCanvas.width = cameraView.videoWidth;
    cameraCanvas.height = cameraView.videoHeight;
    

    context.drawImage(cameraView, 0, 0, cameraCanvas.width, cameraCanvas.height);
    

    cameraCanvas.style.display = 'block';
    cameraView.style.display = 'none';
    

    analyzeBtn.disabled = false;
    

    captureBtn.style.display = 'none';
}


function hideCamera() {
    if (mediaStream) {
        // Stop all video tracks
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    // Hide camera-related elements
    cameraView.style.display = 'none';
    cameraCanvas.style.display = 'none';
    captureBtn.style.display = 'none';
    switchBtn.style.display = 'none';
}


async function analyzeImage() {
    if (!model) {
        showError('Model is not loaded yet. Please wait or refresh the page.');
        return;
    }
    
    loader.style.display = 'flex';
    resultsDiv.innerHTML = '';
    
    try {
        let imageElement;
        

        if (cameraCanvas.style.display !== 'none') {
            imageElement = cameraCanvas;
        } else if (previewImage.style.display !== 'none') {
            imageElement = previewImage;
        } else {
            throw new Error('No image available for analysis');
        }
        

        const predictions = await model.classify(imageElement);
        

        loader.style.display = 'none';
        

        displayResults(predictions);
    } catch (error) {
        console.error('Error analyzing image:', error);
        loader.style.display = 'none';
        showError('Error analyzing image. Please try again with a different image.');
    }
}


function displayResults(predictions) {

    resultsDiv.innerHTML = '';
    
    if (predictions.length === 0) {
        resultsDiv.innerHTML = '<p class="placeholder">No objects detected. Try with a different image.</p>';
        return;
    }
    

    predictions.forEach(prediction => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const className = document.createElement('div');
        className.className = 'result-class';
        className.textContent = prediction.className;
        
        const probability = document.createElement('div');
        probability.className = 'result-probability';
        probability.textContent = `${(prediction.probability * 100).toFixed(2)}%`;
        
        resultItem.appendChild(className);
        resultItem.appendChild(probability);
        resultsDiv.appendChild(resultItem);
    });
}


function showError(message) {
    resultsDiv.innerHTML = `<p style="color: red;">${message}</p>`;
}


function resetResults() {
    resultsDiv.innerHTML = '<p class="placeholder">Upload an image to see recognition results</p>';
}


window.addEventListener('DOMContentLoaded', init);
