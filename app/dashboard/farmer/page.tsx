"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "../../config/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
// Removed Firebase Storage imports - using Firestore only
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  quantity: string;
  stock?: string;
  harvestDate: string;
  images: string[];
  existingImages?: string[];
  newImages?: File[];
  farmerId: string;
}

interface NewProduct {
  name: string;
  description: string;
  category: string;
  price: string;
  quantity: string;
  harvestDate: string;
  images: File[];
}

interface User {
  uid: string;
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  profilePhoto?: string;
}

export default function FarmerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    quantity: "",
    harvestDate: "",
    images: [] as File[],
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [skipCompression, setSkipCompression] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  // Timeout wrapper for upload operations
  const withTimeout = function<T>(promise: Promise<T>, timeoutMs: number = 60000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Upload timed out after ${Math.round(timeoutMs/1000)} seconds. Please check your internet connection and try again.`)), timeoutMs)
      )
    ]);
  };

  // Camera functions
  const startCamera = async () => {
    console.log("Starting camera...");
    
    // Check if we're on HTTPS or localhost
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
    if (!isSecure) {
      alert("Camera requires HTTPS or localhost. Please use a secure connection.");
      return;
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera is not supported on this browser.");
      return;
    }

    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment", // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log("Camera access granted:", stream);
      setCameraStream(stream);
      setShowCamera(true);
      
      // Wait for the modal to render before setting video source
      setTimeout(() => {
        if (videoRef.current && stream) {
          console.log("Setting video source...");
          videoRef.current.srcObject = stream;
          
          // Handle video load
          videoRef.current.onloadedmetadata = () => {
            console.log("Video loaded successfully");
          };
          
          videoRef.current.onerror = (error) => {
            console.error("Video error:", error);
          };
        }
      }, 200);
      
    } catch (error: unknown) {
      console.error("Error accessing camera:", error);
      let errorMessage = "Unable to access camera. ";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow camera permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No camera found on this device.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage += "Camera is not supported on this browser.";
        } else if (error.name === 'NotReadableError') {
          errorMessage += "Camera is being used by another application.";
        } else {
          errorMessage += error.message || "Unknown error occurred.";
        }
      } else {
        errorMessage += "Unknown error occurred.";
      }
      
      alert(errorMessage);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedPhoto(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      alert('Camera not ready. Please wait and try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Camera is still loading. Please wait a moment and try again.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (context) {
      context.drawImage(video, 0, 0);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataUrl);
      console.log("Photo captured successfully");
    } else {
      alert('Unable to capture photo. Please try again.');
    }
  };

  const addCapturedPhoto = () => {
    if (!capturedPhoto) return;
    
    // Convert base64 to File object
    fetch(capturedPhoto)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `captured-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setNewProduct((prev: NewProduct) => ({
          ...prev,
          images: [...prev.images, file]
        }));
        stopCamera();
      })
      .catch(error => {
        console.error('Error converting photo:', error);
        alert('Failed to add photo. Please try again.');
      });
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    // Ensure camera stream is still active and video is properly set
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(error => {
        console.error('Error restarting video:', error);
        // If video fails to restart, restart the entire camera
        restartCamera();
      });
    } else {
      // If no active stream, restart camera completely
      restartCamera();
    }
  };

  const restartCamera = async () => {
    // Stop existing stream if any
    if (cameraStream) {
      cameraStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setCameraStream(null);
    }
    
    // Restart camera without closing modal
    try {
      console.log("Restarting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setCameraStream(stream);
      
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
      
    } catch (error: any) {
      console.error("Error restarting camera:", error);
      alert("Failed to restart camera. Please close and try again.");
    }
  };

  // Handle hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-compress image with aggressive compression for large files
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      try {
        console.log('Auto-compressing image:', file.name, 'Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('Could not get canvas context');
          resolve(file);
          return;
        }
        
        const img = new Image();
        
        img.onerror = (error) => {
          console.error('Image load error:', error);
          resolve(file);
        };
        
        img.onload = () => {
          try {
            let { width, height } = img;
            const originalSize = file.size;
            
            // More aggressive compression strategy for Firestore storage (1MB doc limit)
            let maxDimension, quality;
            
            if (originalSize > 5 * 1024 * 1024) { // > 5MB - Ultra aggressive
              maxDimension = 300;
              quality = 0.3;
            } else if (originalSize > 2 * 1024 * 1024) { // > 2MB - Very aggressive  
              maxDimension = 350;
              quality = 0.4;
            } else if (originalSize > 1 * 1024 * 1024) { // > 1MB - Aggressive
              maxDimension = 400;
              quality = 0.5;
            } else if (originalSize > 500 * 1024) { // > 500KB - Moderate
              maxDimension = 450;
              quality = 0.6;
            } else { // < 500KB - Light compression
              maxDimension = 500;
              quality = 0.7;
            }
            
            // Calculate new dimensions maintaining aspect ratio
            if (width > height) {
              if (width > maxDimension) {
                height = (height * maxDimension) / width;
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = (width * maxDimension) / height;
                height = maxDimension;
              }
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Apply image smoothing for better quality at smaller sizes
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'medium'; // Changed from 'high' for speed
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              if (!blob) {
                console.error('Canvas toBlob failed');
                resolve(file);
                return;
              }
              
              const compressedFile = new File([blob], file.name.replace(/\.(png|gif|bmp|webp)$/i, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              const compressionRatio = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(1);
              const finalSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
              
              console.log(`✅ Compression complete:
                Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB
                Compressed: ${finalSizeMB}MB
                Saved: ${compressionRatio}%
                Dimensions: ${img.width}x${img.height} → ${width}x${height}
                Target size: <1MB for fast upload`);
              
              // If still too large, compress more aggressively
              if (compressedFile.size > 1024 * 1024 && quality > 0.3) {
                console.log('Still too large, applying extra compression...');
                canvas.toBlob((blob2) => {
                  if (blob2) {
                    const extraCompressed = new File([blob2], compressedFile.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    });
                    console.log('Extra compression result:', (extraCompressed.size / 1024 / 1024).toFixed(2), 'MB');
                    resolve(extraCompressed);
                  } else {
                    resolve(compressedFile);
                  }
                }, 'image/jpeg', 0.3);
              } else {
                resolve(compressedFile);
              }
            }, 'image/jpeg', quality);
            
          } catch (error) {
            console.error('Compression error:', error);
            resolve(file);
          }
        };
        
        img.src = URL.createObjectURL(file);
      } catch (error) {
        console.error('Image compression setup error:', error);
        resolve(file);
      }
    });
  };

  // Convert images to base64 for Firestore storage
  const processImages = async (images: File[]) => {
    const imageBase64Array: string[] = [];
    
    console.log('Starting processing of', images.length, 'images');
    setUploadProgress(`Preparing ${images.length} images...`);
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        setUploadProgress(`${skipCompression ? 'Converting' : 'Compressing and converting'} image ${i + 1}/${images.length}: ${image.name}...`);
        console.log(`Processing image ${i + 1}/${images.length}:`, image.name);
        
        // Compress image only if not skipping compression
        const processedImage = skipCompression ? image : await withTimeout(compressImage(image), 20000);
        
        // Warn if image is still large for Firestore
        if (processedImage.size > 500 * 1024) { // 500KB warning for Firestore
          console.warn('Large image for Firestore:', (processedImage.size / 1024).toFixed(0), 'KB');
          setUploadProgress(`⚠️ ${processedImage.name} is ${(processedImage.size / 1024).toFixed(0)}KB - may impact performance`);
        }
        
        // Convert to base64
        setUploadProgress(`Converting ${processedImage.name} to base64...`);
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(processedImage);
        });
        
        imageBase64Array.push(base64String);
        setUploadProgress(`✅ Processed ${i + 1}/${images.length} images`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing image ${i + 1}:`, errorMessage);
        setUploadProgress(`❌ Failed to process ${image.name}`);
        throw new Error(`Failed to process image ${image.name}: ${errorMessage}`);
      }
    }
    
    setUploadProgress('All images processed successfully!');
    console.log('All images processed successfully');
    return imageBase64Array;
  };

  // Fetch products owned by this farmer
  const fetchProducts = async (farmerId: string) => {
    const q = query(collection(db, "products"), where("farmerId", "==", farmerId));
    const querySnapshot = await getDocs(q);

    const productsWithURLs = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        return { id: docSnap.id, ...data } as Product;
      })
    );

    setProducts(productsWithURLs);
  };

  // Add new product with image upload
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('User not authenticated');
      return;
    }

    console.log('Starting product addition...');
    setUploading(true);
    
    try {
      console.log('Product data:', newProduct);
      
      // Validate required fields
      if (!newProduct.name || !newProduct.price || !newProduct.quantity) {
        throw new Error('Please fill in all required fields');
      }
      
      // Process images for Firestore storage
      console.log('Starting image processing...');
      let imageBase64Array: string[] = [];
      
      if (newProduct.images.length > 0) {
        try {
          imageBase64Array = await withTimeout(processImages(newProduct.images), 300000); // 5 minute timeout
          console.log('Images processed, base64 count:', imageBase64Array.length);
        } catch (error) {
          console.error('Image processing failed:', error);
          
          // Ask user if they want to continue without images
          const continueWithoutImages = window.confirm(
            `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
            'Would you like to add the product without images? You can edit it later to add images.'
          );
          
          if (!continueWithoutImages) {
            throw error; // Re-throw to stop the product creation
          }
          
          console.log('User chose to continue without images');
          imageBase64Array = []; // Continue with empty images array
        }
      }

      // Add product to Firestore
      console.log('Adding product to Firestore...');
      const docRef = await addDoc(collection(db, "products"), {
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.quantity),
        harvestDate: newProduct.harvestDate,
        images: imageBase64Array, // Store base64 images directly
        farmerId: user.id,
        farmerName: user.name || user.email,
        createdAt: new Date(),
      });
      
      console.log('Product added with ID:', docRef.id);

      // Reset form
      setNewProduct({ 
        name: "", 
        description: "", 
        category: "", 
        price: "", 
        quantity: "", 
        harvestDate: "", 
        images: [] 
      });
      
      console.log('Refreshing products list...');
      await fetchProducts(user.id);
      alert("Product added successfully!");
      
    } catch (error) {
      console.error("Error adding product:", error);
      
      let errorMessage = "Failed to add product. ";
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please check your internet connection and try again.";
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      fetchProducts(user.id);
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product.');
    }
  };

  // Edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct({
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      price: product.price?.toString() || '',
      quantity: product.stock?.toString() || product.quantity?.toString() || '',
      harvestDate: product.harvestDate || '',
      images: product.images || [],
      farmerId: product.farmerId || '',
      existingImages: product.images || [], // Use base64 images
      newImages: []
    });
    setShowEditModal(true);
  };

  // Update product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setUploading(true);
    try {
      let allImages = [...editingProduct.existingImages];
      
      // Process new images if any
      if (editingProduct.newImages.length > 0) {
        const newImageBase64 = await processImages(editingProduct.newImages);
        allImages = [...allImages, ...newImageBase64];
      }

      // Update product in Firestore
      await updateDoc(doc(db, 'products', editingProduct.id), {
        name: editingProduct.name,
        description: editingProduct.description,
        category: editingProduct.category,
        price: parseFloat(editingProduct.price),
        stock: parseInt(editingProduct.quantity),
        harvestDate: editingProduct.harvestDate,
        images: allImages, // Store base64 images
        updatedAt: new Date(),
      });

      setShowEditModal(false);
      setEditingProduct(null);
      fetchProducts(user.id);
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product.');
    } finally {
      setUploading(false);
    }
  };

  // Helper functions
  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeExistingImage = (index: number) => {
    setEditingProduct((prev: Product | null) => ({
      ...prev!,
      existingImages: prev!.existingImages!.filter((_, i: number) => i !== index)
    }));
  };

  const removeNewImage = (index: number) => {
    setEditingProduct((prev: Product | null) => ({
      ...prev!,
      newImages: prev!.newImages!.filter((_, i: number) => i !== index)
    }));
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setEditingProduct((prev: Product | null) => ({
        ...prev!,
        newImages: [...(prev!.newImages || []), ...files].slice(0, 5 - (prev!.existingImages?.length || 0))
      }));
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(`${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`);
        return false;
      }
      
      return true;
    });
    
    if (files.length > 0) {
      const currentTotal = newProduct.images.length + files.length;
      if (currentTotal > 5) {
        alert(`Can only upload 5 images total. You have ${newProduct.images.length} and trying to add ${files.length} more.`);
        return;
      }
      
      if (files.some(f => f.size > 5 * 1024 * 1024)) {
        const largeFiles = files.filter(f => f.size > 5 * 1024 * 1024);
        const message = `Large files detected (${largeFiles.map(f => f.name + ': ' + (f.size / 1024 / 1024).toFixed(1) + 'MB').join(', ')}). They will be automatically compressed.`;
        console.log(message);
      }
      
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, ...files].slice(0, 5)
      }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(`${file.name} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`);
        return false;
      }
      
      return true;
    });
    
    if (files.length > 0) {
      const currentTotal = newProduct.images.length + files.length;
      if (currentTotal > 5) {
        alert(`Can only upload 5 images total. You have ${newProduct.images.length} and trying to add ${files.length} more.`);
        return;
      }
      
      if (files.some(f => f.size > 5 * 1024 * 1024)) {
        const largeFiles = files.filter(f => f.size > 5 * 1024 * 1024);
        const message = `Large files detected (${largeFiles.map(f => f.name + ': ' + (f.size / 1024 / 1024).toFixed(1) + 'MB').join(', ')}). They will be automatically compressed.`;
        console.log(message);
      }
      
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, ...files].slice(0, 5)
      }));
    }
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Watch auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().role === "farmer") {
          setUser({ 
            uid: currentUser.uid,
            id: currentUser.uid, 
            email: currentUser.email || '',
            ...docSnap.data() 
          });
          fetchProducts(currentUser.uid);
        } else {
          alert("Unauthorized access");
          router.push("/login");
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading || !isClient) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white shadow-md p-3 sm:p-4 lg:h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <img src="/harvest-hub-logo.png" alt="HarvestHub Logo" className="w-8 h-8" />
            HarvestHub
          </h2>
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block space-y-2`}>
          <a
            href="/dashboard/farmer"
            className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base"
          >
            Dashboard
          </a>
          <a
            href="/dashboard/farmer/profile"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Profile
          </a>
          <a
            href="/dashboard/farmer/orders"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Orders
          </a>
          <a
            href="/dashboard/farmer/pricing"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Market Pricing
          </a>
          <a
            href="/dashboard/farmer/ratings"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Ratings
          </a>
          <a
            href="/dashboard/community"
            className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base"
          >
            Community Hub
          </a>
        </nav>

        <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg
              className="w-4 h-4 lg:w-5 lg:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Top Navbar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-3 sm:gap-0">
          <input type="text" placeholder="Search products..." className="px-4 py-2 w-full sm:w-auto text-sm lg:text-base border border-gray-300 rounded-lg" />
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="font-medium text-sm lg:text-base truncate text-gray-600">Welcome, {user?.email?.split("@")[0]}!</span>
          </div>
        </header>

        {/* Welcome Section */}
        <section className="bg-green-100 p-4 lg:p-6 rounded-lg mb-4 lg:mb-6">
          <div className="flex items-center space-x-4">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt="Profile"
                className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">
                Welcome, {user?.name || user?.email?.split("@")[0]}!
              </h1>
              <p className="text-gray-700 text-sm lg:text-base">
                Manage your products and connect with buyers directly.
              </p>
            </div>
          </div>
        </section>

        {/* Product Listing Form */}
        <section className="mb-6 lg:mb-8 bg-white shadow p-4 lg:p-6 rounded">
          <h2 className="text-base lg:text-lg font-semibold mb-4">Add New Product</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            {/* Basic Product Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg text-sm lg:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg text-sm lg:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains</option>
                <option value="herbs">Herbs</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="other">Other</option>
              </select>
            </div>

            <textarea
              placeholder="Product Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm lg:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Price (₱)"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg text-sm lg:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="0"
                step="0.01"
                required
              />
              <input
                type="number"
                placeholder="Quantity/Stock"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg text-sm lg:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="0"
                required
              />
              <input
                type="date"
                placeholder="Harvest Date"
                value={newProduct.harvestDate}
                onChange={(e) => setNewProduct({ ...newProduct, harvestDate: e.target.value })}
                className="border border-gray-300 px-3 py-2 rounded-lg text-sm lg:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm lg:text-base font-medium text-gray-700">
                  Product Images (up to 5 images)
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs lg:text-sm hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>📷 Camera</span>
                  </button>
                  <label className="flex items-center space-x-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={skipCompression}
                      onChange={(e) => setSkipCompression(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>Skip compression (for slow connections)</span>
                  </label>
                </div>
              </div>
              
              {/* Drag and Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-green-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="text-3xl text-gray-400">📷</div>
                  <div className="text-sm lg:text-base text-gray-600">
                    <span className="font-medium text-green-600">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 50MB each • Stored directly in database
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-50 rounded p-2 mt-2">
                    {skipCompression ? (
                      <>
                        ⚡ Compression disabled - Files stored as-is<br/>
                        ⚠️ Large files may impact performance
                      </>
                    ) : (
                      <>
                        💡 Aggressive compression for database storage:<br/>
                        • 5MB+ → 400px max, 40% quality<br/>
                        • 2-5MB → 500px max, 50% quality<br/>
                        • Target: Under 500KB for optimal performance
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {newProduct.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {newProduct.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b-lg">
                        <div className="truncate">{image.name}</div>
                        <div className="text-xs opacity-80">
                          {(image.size / 1024 / 1024).toFixed(1)}MB
                          {image.size > 5 * 1024 * 1024 && (
                            <span className="text-yellow-400 ml-1">📦</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-green-600 text-white py-3 rounded-lg text-sm lg:text-base font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                  {uploadProgress && (
                    <div className="text-xs opacity-90">{uploadProgress}</div>
                  )}
                </div>
              ) : (
                'Add Product'
              )}
            </button>
          </form>
        </section>

        {/* Display Products */}
        <section>
          <h2 className="text-base lg:text-lg font-semibold mb-3">Your Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {products.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* Product Image */}
                <div className="h-32 sm:h-40 bg-gray-200 overflow-hidden relative">
                  {item.images && item.images.length > 0 ? (
                    <div className="relative h-full">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {item.images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          +{item.images.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-500 text-xs lg:text-sm">
                      📷 No Photo
                    </div>
                  )}
                </div>
                
                {/* Product Details */}
                <div className="p-3 lg:p-4 space-y-2">
                  <h3 className="font-bold text-sm lg:text-base text-gray-900 line-clamp-1">{item.name}</h3>
                  
                  {item.description && (
                    <p className="text-xs lg:text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-bold text-sm lg:text-base">₱{item.price}</span>
                      {item.category && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {item.category}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-xs lg:text-sm text-gray-500">
                      <span>Stock: {item.stock || item.quantity}</span>
                      <span>{item.harvestDate}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleEditProduct(item)}
                      className="flex-1 bg-blue-500 text-white text-xs lg:text-sm px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(item.id)}
                      className="flex-1 bg-red-500 text-white text-xs lg:text-sm px-2 py-1 rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {products.length === 0 && (
            <div className="text-center py-8 lg:py-12">
              <div className="text-gray-400 text-4xl mb-4">🌱</div>
              <p className="text-gray-500 text-base lg:text-lg mb-4">No products added yet</p>
              <p className="text-gray-400 text-sm lg:text-base">Add your first product above to get started!</p>
            </div>
          )}
        </section>
      </main>

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Edit Product</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                  
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="grains">Grains</option>
                    <option value="herbs">Herbs</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <textarea
                  placeholder="Product Description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="number"
                    placeholder="Price (₱)"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                    className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                    min="0"
                    step="0.01"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Quantity/Stock"
                    value={editingProduct.quantity}
                    onChange={(e) => setEditingProduct({...editingProduct, quantity: e.target.value})}
                    className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                    min="0"
                    required
                  />
                  <input
                    type="date"
                    value={editingProduct.harvestDate}
                    onChange={(e) => setEditingProduct({...editingProduct, harvestDate: e.target.value})}
                    className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Existing Images */}
                {editingProduct.existingImages.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Current Images</label>
                    <div className="grid grid-cols-3 gap-3">
                      {editingProduct.existingImages.map((imageBase64: string, index: number) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageBase64}
                            alt={`Current ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Images */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Add New Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditImageSelect}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                  />
                  
                  {editingProduct.newImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {editingProduct.newImages.map((image: File, index: number) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`New ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploading ? "Updating..." : "Update Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Capture Product Photo</h3>
              <button
                onClick={stopCamera}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {!capturedPhoto ? (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded bg-gray-200"
                    style={{ minHeight: '200px' }}
                  />
                  {!cameraStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={capturePhoto}
                  disabled={!cameraStream}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📷 Capture Photo
                </button>
                {!cameraStream && (
                  <p className="text-xs text-gray-500 text-center">
                    Note: Camera requires HTTPS or localhost. Make sure you&apos;ve allowed camera permissions.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <img
                  src={capturedPhoto}
                  alt="Captured photo"
                  className="w-full rounded"
                />
                <div className="flex gap-2">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition-colors"
                  >
                    🔄 Retake
                  </button>
                  <button
                    onClick={addCapturedPhoto}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    ✅ Add Photo
                  </button>
                </div>
              </div>
            )}
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}