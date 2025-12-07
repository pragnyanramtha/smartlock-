import { User } from '../types';
import { getUsers } from './storageService';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/weights/';

export const loadModels = async (): Promise<void> => {
  const faceapi = window.faceapi;
  if (!faceapi) throw new Error('face-api.js not loaded');

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // Better accuracy for registration
  ]);
};

export const getFaceDescriptor = async (video: HTMLVideoElement): Promise<Float32Array | null> => {
  const faceapi = window.faceapi;
  // Use SSD MobileNet for registration (higher accuracy)
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
};

export const createFaceMatcher = async (): Promise<any> => {
  const faceapi = window.faceapi;
  const users = getUsers();
  
  if (users.length === 0) return null;

  const labeledDescriptors = users.map((user) => {
    // Convert array back to Float32Array
    const descriptor = new Float32Array(user.descriptor);
    return new faceapi.LabeledFaceDescriptors(user.id, [descriptor]);
  });

  return new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is distance threshold
};

export const detectFaces = async (video: HTMLVideoElement) => {
    const faceapi = window.faceapi;
    // Use TinyFaceDetector for real-time performance
    return await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
}