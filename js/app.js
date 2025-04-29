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
const previewPlaceholder = document.getElementById('preview-placeholder');

let model;
let mediaStream;
let facingMode = 'environment';

// Load model and initialize app
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
        previewPlaceholder.style.display = 'none';
        analyzeBtn.disabled = false;
        
        // Ensure proper aspect ratio of the image
        previewImage.onload = function() {
            maintainAspectRatio(previewImage);
        };
    };
    
    reader.readAsDataURL(file);
    
    resetResults();
}

// Function to maintain aspect ratio
function maintainAspectRatio(imageElement) {
    // The preview container has a 3:2 aspect ratio (66.66%)
    // We'll adjust the image to fit properly within this container
    const containerAspect = 3/2;
    const imageAspect = imageElement.naturalWidth / imageElement.naturalHeight;
    
    // Adjust the object-fit property based on image dimensions
    if (imageAspect > containerAspect) {
        // Image is wider than container
        imageElement.style.objectFit = 'contain';
    } else {
        // Image is taller or same as container
        imageElement.style.objectFit = 'cover';
    }
}

async function toggleCamera() {
    if (cameraView.style.display === 'none') {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facingMode,
                    aspectRatio: { ideal: 1.5 } // 3:2 aspect ratio
                }
            });
            
            cameraView.srcObject = mediaStream;
            cameraView.style.display = 'block';
            previewPlaceholder.style.display = 'none';
            captureBtn.style.display = 'block';
            switchBtn.style.display = 'block';
            previewImage.style.display = 'none';
            cameraCanvas.style.display = 'none';
            analyzeBtn.disabled = true;
            
            cameraBtn.innerHTML = '<i class="fas fa-times"></i> Close Camera';
            
            resetResults();
            
            // Wait for video to be ready
            await new Promise(resolve => {
                cameraView.onloadedmetadata = () => {
                    resolve();
                };
            });
            
            // Show camera access animation
            cameraView.style.opacity = 0;
            setTimeout(() => {
                cameraView.style.opacity = 1;
                cameraView.style.transition = 'opacity 0.5s ease';
            }, 100);
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            showError('Unable to access camera. Please check permissions or try using a different browser.');
        }
    } else {
        hideCamera();
        cameraBtn.innerHTML = '<i class="fas fa-camera"></i> Use Camera';
    }
}

async function switchCamera() {
    if (mediaStream) {
        // Stop current stream
        mediaStream.getTracks().forEach(track => track.stop());

        // Switch camera mode
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facingMode,
                    aspectRatio: { ideal: 1.5 } // 3:2 aspect ratio
                }
            });
            
            cameraView.srcObject = mediaStream;
            
            // Show camera switch animation
            cameraView.style.opacity = 0;
            setTimeout(() => {
                cameraView.style.opacity = 1;
            }, 300);
            
        } catch (error) {
            console.error('Error switching camera:', error);
            showError('Error switching camera. Your device might only have one camera.');
        }
    }
}

function captureImage() {
    if (!cameraView.srcObject) return;
    
    const context = cameraCanvas.getContext('2d');
 
    // Set canvas dimensions to match video with 3:2 aspect ratio
    const videoAspect = cameraView.videoWidth / cameraView.videoHeight;
    let canvasWidth, canvasHeight;
    
    if (videoAspect > 1.5) { // 3:2 = 1.5
        // Video is wider than 3:2
        canvasHeight = cameraView.videoHeight;
        canvasWidth = canvasHeight * 1.5;
    } else {
        // Video is taller or exactly 3:2
        canvasWidth = cameraView.videoWidth;
        canvasHeight = canvasWidth / 1.5;
    }
    
    cameraCanvas.width = canvasWidth;
    cameraCanvas.height = canvasHeight;
    
    // Center the crop
    const xOffset = (cameraView.videoWidth - canvasWidth) / 2;
    const yOffset = (cameraView.videoHeight - canvasHeight) / 2;
    
    // Draw the video frame onto the canvas, cropping to 3:2
    context.drawImage(
        cameraView, 
        xOffset, yOffset, canvasWidth, canvasHeight, // Source coordinates
        0, 0, canvasWidth, canvasHeight // Destination coordinates
    );
    
    // Show capture flash effect
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'white';
    flash.style.opacity = '0.8';
    flash.style.zIndex = '100';
    flash.style.transition = 'opacity 0.3s ease';
    document.querySelector('.image-preview').appendChild(flash);
    
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 300);
    }, 50);

    cameraCanvas.style.display = 'block';
    cameraView.style.display = 'none';
    
    analyzeBtn.disabled = false;
    captureBtn.style.display = 'none';
    
    // Show a retake option
    cameraBtn.innerHTML = '<i class="fas fa-camera"></i> Retake Photo';
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
    
    // If no image is displayed, show placeholder
    if (previewImage.style.display === 'none') {
        previewPlaceholder.style.display = 'flex';
    }
    
    // Reset button text
    cameraBtn.innerHTML = '<i class="fas fa-camera"></i> Use Camera';
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
        
        // Add subtle pulse animation to the analyze button
        analyzeBtn.classList.add('pulse');
        
        // Use a timeout to allow the UI to update before running the model
        setTimeout(async () => {
            try {
                const predictions = await model.classify(imageElement);
                loader.style.display = 'none';
                displayResults(predictions);
                analyzeBtn.classList.remove('pulse');
            } catch (error) {
                console.error('Error during classification:', error);
                loader.style.display = 'none';
                showError('Error analyzing image. Please try again with a different image.');
                analyzeBtn.classList.remove('pulse');
            }
        }, 100);
        
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
    
    // Add animation delay for each result
    predictions.forEach((prediction, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.style.animationDelay = `${index * 0.1}s`;
        
        const className = document.createElement('div');
        className.className = 'result-class';
        className.textContent = prediction.className;
        
        const probability = document.createElement('div');
        probability.className = 'result-probability';
        probability.textContent = `${(prediction.probability * 100).toFixed(1)}%`;
        
        resultItem.appendChild(className);
        resultItem.appendChild(probability);
        resultsDiv.appendChild(resultItem);
    });
}

function showError(message) {
    resultsDiv.innerHTML = `<p style="color: #e53e3e; padding: 15px; background-color: #fff5f5; border-radius: 8px; text-align: center;"><i class="fas fa-exclamation-triangle"></i> ${message}</p>`;
}

function resetResults() {
    resultsDiv.innerHTML = '<p class="placeholder">Your analysis results will appear here</p>';
}

// Initialize the app
window.addEventListener('DOMContentLoaded', init);
