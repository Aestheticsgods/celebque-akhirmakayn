'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Loader2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  image: string;
}

export default function ProfileSettings() {
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    image: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/update');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData({
            name: data.name || '',
            username: data.username || '',
            bio: data.bio || '',
            image: data.image || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setMessage({ type: 'error', text: 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchProfile();
    }
  }, [isLoading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 10MB' });
      return;
    }

    setUploadingImage(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      setFormData(prev => ({ ...prev, image: data.url }));

      setMessage({ type: 'success', text: 'Profile picture uploaded successfully' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Refresh the page to update user context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 lg:px-8 pb-24 lg:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="font-display font-bold text-3xl text-foreground">
            Edit Profile
          </h1>
        </div>

        {/* Messages */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                : 'bg-red-500/10 text-red-600 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? (
              <Check size={20} />
            ) : (
              <X size={20} />
            )}
            {message.text}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Profile Picture
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer inline-block"
            >
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-4 ring-primary/30">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Upload size={24} className="text-muted-foreground mx-auto" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/30 group-hover:bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                {uploadingImage ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                  <Upload size={24} className="text-white" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </motion.div>

          {/* Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="block text-sm font-medium text-foreground mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg bg-muted border border-input focus:border-primary focus:outline-none transition-colors text-foreground placeholder-muted-foreground"
              placeholder="Your full name"
            />
          </motion.div>

          {/* Username */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-muted-foreground">@</span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full pl-8 pr-4 py-3 rounded-lg bg-muted border border-input focus:border-primary focus:outline-none transition-colors text-foreground placeholder-muted-foreground"
                placeholder="username"
              />
            </div>
          </motion.div>

          {/* Email (Read-only) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-input text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-foreground mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-muted border border-input focus:border-primary focus:outline-none transition-colors text-foreground placeholder-muted-foreground resize-none"
              placeholder="Tell us about yourself"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.bio.length}/500
            </p>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex gap-3"
          >
            <Link href="/settings" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Cancel
              </Button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
