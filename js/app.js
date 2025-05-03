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
const confidenceValue = document.getElementById('confidence-value');
const shareButtons = document.querySelectorAll('.share-btn');

let model;
let mediaStream;
let facingMode = 'environment';
let lastPredictions = [];

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
    // Show premium welcome effect
    showPremiumWelcome();
    
    // Load the model
    await loadModel();
    
    // Setup event listeners
    imageUpload.addEventListener('change', handleImageUpload);
    cameraBtn.addEventListener('click', toggleCamera);
    analyzeBtn.addEventListener('click', analyzeImage);
    captureBtn.addEventListener('click', captureImage);
    switchBtn.addEventListener('click', switchCamera);
    
    // Setup share buttons
    setupShareButtons();
}

// Drag-and-drop functionality for both the upload button area and preview container
const uploadArea = document.getElementById('upload-area');
const previewContainer = document.querySelector('.preview-container');

// Helper function to handle the drag and drop functionality
function setupDragAndDrop(element) {
    if (!element) return;
    
    element.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
        element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', (event) => {
        event.preventDefault();
        event.stopPropagation();
        element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        element.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                // Update the file input
                imageUpload.files = files;
                handleImageUpload({ target: { files: [file] } });
                showToast('Image loaded successfully');
            } else {
                showToast('Please upload a valid image file');
            }
        }
    });
}

// Setup drag and drop on both elements
setupDragAndDrop(uploadArea);
setupDragAndDrop(previewContainer);

function showPremiumWelcome() {
    // Add pulse animation to premium badge
    const premiumBadge = document.querySelector('.premium-badge');
    if (premiumBadge) {
        setTimeout(() => {
            premiumBadge.classList.add('pulse');
            setTimeout(() => premiumBadge.classList.remove('pulse'), 2000);
        }, 1000);
    }
    
    // Animate features on load
    const featureItems = document.querySelectorAll('.feature-item');
    if (featureItems.length) {
        featureItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.5s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 500 + (index * 150));
        });
    }
}

function setupShareButtons() {
    shareButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // Different share actions based on the button
            switch (index) {
                case 0: // Twitter
                    shareToTwitter();
                    break;
                case 1: // Facebook
                    shareToFacebook();
                    break;
                case 2: // Copy results
                    copyResultsToClipboard();
                    break;
                case 3: // Download results
                    downloadResults();
                    break;
            }
        });
    });
}

function shareToTwitter() {
    if (lastPredictions.length === 0) {
        showToast('Analyze an image first to share results');
        return;
    }
    
    const text = `I just identified ${lastPredictions[0].className} with ${(lastPredictions[0].probability * 100).toFixed(1)}% confidence using AI Vision Pro! #AIImageRecognition`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function shareToFacebook() {
    if (lastPredictions.length === 0) {
        showToast('Analyze an image first to share results');
        return;
    }
    
    // Facebook sharing dialog
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent('Check out what I found with AI Vision Pro!')}`;
    window.open(url, '_blank');
}

function copyResultsToClipboard() {
    if (lastPredictions.length === 0) {
        showToast('Analyze an image first to copy results');
        return;
    }
    
    let resultText = 'AI Vision Pro Analysis Results:\n';
    lastPredictions.forEach((pred, i) => {
        resultText += `${i + 1}. ${pred.className}: ${(pred.probability * 100).toFixed(1)}% confidence\n`;
    });
    
    navigator.clipboard.writeText(resultText).then(() => {
        showToast('Results copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy results');
    });
}

function downloadResults() {
    if (lastPredictions.length === 0) {
        showToast('Analyze an image first to download results');
        return;
    }
    
    let resultText = 'AI Vision Pro Analysis Results:\n\n';
    lastPredictions.forEach((pred, i) => {
        resultText += `${i + 1}. ${pred.className}: ${(pred.probability * 100).toFixed(1)}% confidence\n`;
    });
    
    const blob = new Blob([resultText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-vision-pro-results.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Results downloaded!');
}

function showToast(message) {
    // Check if a toast already exists and remove it
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create a new toast with premium styling
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Use icon for enhanced premium feel
    toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    
    // Apply premium styles directly to ensure they work regardless of CSS
    Object.assign(toast.style, {
        position: 'fixed',
        top: '-60px', // Start above viewport for animation
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        color: 'white',
        padding: '12px 25px',
        borderRadius: '30px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '500',
        backdropFilter: 'blur(8px)',
        opacity: '0',
        transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '85%',
        textAlign: 'center'
    });
    
    // Style for the icon
    const icon = toast.querySelector('i');
    if (icon) {
        Object.assign(icon.style, {
            color: '#6366f1', // Primary color
            fontSize: '16px'
        });
    }
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.top = '20px'; // Final position at top of screen
        
        // Automatically hide after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.top = '-60px';
            
            // Remove from DOM after animation completes
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }, 100);
}

// Function to handle image upload
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
        
        // Premium animation effect
        previewImage.style.transform = 'scale(0.95)';
        previewImage.style.opacity = '0';
        
        setTimeout(() => {
            previewImage.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            previewImage.style.transform = 'scale(1)';
            previewImage.style.opacity = '1';
        }, 50);
        
        // Ensure proper aspect ratio of the image
        previewImage.onload = function() {
            maintainAspectRatio(previewImage);
        };
        
        // Show success toast notification
        showToast('Image loaded successfully');
    };
    
    reader.readAsDataURL(file);
    
    resetResults();
    resetConfidenceMeter();
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
    resetConfidenceMeter();
    
    try {
        let imageElement;
        
        if (cameraCanvas.style.display !== 'none') {
            imageElement = cameraCanvas;
        } else if (previewImage.style.display !== 'none') {
            imageElement = previewImage;
        } else {
            throw new Error('No image available for analysis');
        }
        
        // Add premium effect to the analyze button
        analyzeBtn.classList.add('pulse');
        
        // Premium loader animation with pacing for perceived quality
        animateConfidenceMeter(20, 300); // Initial quick progress to show responsiveness
        
        // Use a timeout to allow the UI to update before running the model
        setTimeout(async () => {
            try {
                animateConfidenceMeter(60, 800); // More progress as model processes
                
                const predictions = await model.classify(imageElement);
                lastPredictions = predictions; // Store for sharing
                
                // Show high confidence once results are ready
                const maxConfidence = predictions.length > 0 ? 
                    predictions[0].probability * 100 : 70;
                
                animateConfidenceMeter(Math.max(80, maxConfidence), 500);
                
                setTimeout(() => {
                    loader.style.display = 'none';
                    displayResults(predictions);
                    analyzeBtn.classList.remove('pulse');
                }, 500);
                
            } catch (error) {
                console.error('Error during classification:', error);
                resetConfidenceMeter();
                loader.style.display = 'none';
                showError('Error analyzing image. Please try again with a different image.');
                analyzeBtn.classList.remove('pulse');
            }
        }, 800); // Slightly longer delay to showcase the premium loader
        
    } catch (error) {
        console.error('Error analyzing image:', error);
        loader.style.display = 'none';
        showError('Error analyzing image. Please try again with a different image.');
        resetConfidenceMeter();
    }
}

function displayResults(predictions) {
    resultsDiv.innerHTML = '';
    
    if (predictions.length === 0) {
        resultsDiv.innerHTML = '<p class="placeholder">No objects detected. Try with a different image.</p>';
        return;
    }
    
    // Add animation delay for each result with premium styling
    predictions.forEach((prediction, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.style.animationDelay = `${index * 0.1}s`;
        
        const className = document.createElement('div');
        className.className = 'result-class';
        className.innerHTML = `<span>${prediction.className}</span>`;
        
        const probability = document.createElement('div');
        probability.className = 'result-probability';
        probability.textContent = `${(prediction.probability * 100).toFixed(1)}%`;
        
        resultItem.appendChild(className);
        resultItem.appendChild(probability);
        resultsDiv.appendChild(resultItem);
    });
    
    // Set the final confidence value based on top prediction
    if (predictions.length > 0) {
        const topConfidence = predictions[0].probability * 100;
        setConfidenceValue(topConfidence);
    }
}

function showError(message) {
    resultsDiv.innerHTML = `<p style="color: #e53e3e; padding: 15px; background-color: #fff5f5; border-radius: 8px; text-align: center;"><i class="fas fa-exclamation-triangle"></i> ${message}</p>`;
}

function resetResults() {
    resultsDiv.innerHTML = '<p class="placeholder">Your analysis results will appear here</p>';
}

function resetConfidenceMeter() {
    if (confidenceValue) {
        confidenceValue.style.width = '0%';
    }
}

function setConfidenceValue(value) {
    if (confidenceValue) {
        confidenceValue.style.width = `${value}%`;
        
        // Change color based on confidence level
        if (value >= 90) {
            confidenceValue.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        } else if (value >= 70) {
            confidenceValue.style.background = 'linear-gradient(90deg, #6366f1, #818cf8)';
        } else if (value >= 50) {
            confidenceValue.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        } else {
            confidenceValue.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
        }
    }
}

function animateConfidenceMeter(targetValue, duration) {
    if (!confidenceValue) return;
    
    const startValue = parseFloat(confidenceValue.style.width) || 0;
    const startTime = performance.now();
    
    function updateValue(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = startValue + progress * (targetValue - startValue);
        
        setConfidenceValue(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

// Initialize the app
window.addEventListener('DOMContentLoaded', init);
