# Image Recognition Web App

A fully functional web-based application for image recognition that works directly in your browser. This application uses TensorFlow.js and the MobileNet model to recognize objects in images.

## Features

- Upload images for recognition
- Use your device's camera to capture photos
- Switch between front and back cameras on compatible devices
- View recognition results with confidence scores
- Entirely client-side processing (no server required)

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- TensorFlow.js
- MobileNet pre-trained model

## How to Use

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge recommended)
2. Choose one of the input methods:
   - Click "Choose Image" to upload an image file
   - Click "Use Camera" to access your device camera
3. If using the camera, click "Capture Photo" when ready
4. Click "Analyze Image" to start the recognition process
5. View the top 5 predictions with confidence scores

## Privacy

All image processing happens directly in your browser. No images are uploaded to any server, making this application privacy-friendly.

## Browser Compatibility

This application works best in modern browsers that support the Web Camera API. For optimal experience, use the latest versions of Chrome, Firefox, or Edge.

## License

MIT
