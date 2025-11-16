"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/useLogout";

export default function UserProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePicture: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { handleLogout } = useLogout();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = { id: currentUser.uid, ...userDoc.data() };
          setUser(userData);
          setFormData({
            name: (userData as any).name || "",
            email: (userData as any).email || currentUser.email || "",
            phone: (userData as any).phone || (userData as any).contact || "",
            profilePicture: (userData as any).profilePicture || ""
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), {
        name: formData.name,
        phone: formData.phone,
        contact: formData.phone, // Also update contact field for compatibility
        profilePicture: formData.profilePicture,
        updatedAt: new Date()
      });

      setUser({ ...user, ...formData });
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setFormData({ ...formData, profilePicture: base64String });
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
      setUploadingImage(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || user?.contact || "",
      profilePicture: user?.profilePicture || ""
    });
    setEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
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
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block space-y-2`}>
          <a href="/dashboard/user" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Dashboard
          </a>
          <a href="/dashboard/user/cart" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Cart
          </a>
          <a href="/dashboard/user/orders" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Orders
          </a>
          <a href="/dashboard/user/rate_farmer" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Rate Farmer
          </a>
          <a href="/dashboard/user/profile" className="block px-3 py-2 rounded bg-green-100 text-green-800 text-sm lg:text-base">
            Profile
          </a>
          <a href="/dashboard/community" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Community Hub
          </a>
          <a href="/dashboard/map" className="block px-3 py-2 rounded hover:bg-green-100 text-sm lg:text-base">
            Farmer Map
          </a>
        </nav>
        
        {/* Logout Button */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block mt-4 pt-3 sm:pt-4 lg:pt-6 border-t border-gray-200`}>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center lg:justify-start space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">My Profile</h1>
            {!editing ? (
              <Button 
                onClick={() => setEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
                </svg>
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCancel}
                  variant="outline"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                    {formData.profilePicture ? (
                      <img 
                        src={formData.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-green-600">
                        {user?.name ? getInitials(user.name) : 'U'}
                      </span>
                    )}
                  </div>
                  {/* Camera icon overlay for image upload */}
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-blue-700 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                </div>

                {/* Profile Info */}
                <div className="text-center sm:text-left text-white">
                  <h2 className="text-2xl font-bold mb-2">{user?.name || 'User'}</h2>
                  <p className="text-green-100 mb-1 flex items-center justify-center sm:justify-start">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {user?.email || 'No email'}
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-400 text-green-900 font-medium">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Customer
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Personal Information
                  </h3>

                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user?.name || 'Not specified'}
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      {formData.email || 'No email'}
                      <span className="ml-2 text-xs text-gray-500">(Read-only)</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Contact Information
                  </h3>

                  {/* Phone Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {user?.phone || user?.contact || 'Not specified'}
                      </div>
                    )}
                  </div>

                  {/* Address Field */}
                </div>
              </div>

              {/* Account Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                  </svg>
                  Account Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <div className="text-gray-900 font-medium">Customer Account</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                    <div className="text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}