import { Property } from '@/features/property/types/property';
import { propertyService } from '@/features/property/services/property-service';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

type FormData = {
  name: string;
  description: string;
  imageUrl: string;
  propertyType: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  status: string;
};

export default function PropertyEditor() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string | undefined;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Image handling
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    imageUrl: '',
    propertyType: '',
    address: {
      streetAddress: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    status: ''
  });

  // Load property data
  useEffect(() => {
    if (!propertyId) {
      setError('Property ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    propertyService
      .get(propertyId)
      .then((data) => {
        setProperty(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          propertyType: data.propertyType || '',
          address: {
            streetAddress: data.address?.streetAddress || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            country: data.address?.country || '',
            postalCode: data.address?.postalCode || ''
          },
          status: data.status || ''
        });
        setImagePreview(data.imageUrl || null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [propertyId]);

  // Track unsaved changes
  useEffect(() => {
    if (property) {
      const hasChanges = 
        formData.name !== property.name ||
        formData.description !== (property.description || '') ||
        formData.imageUrl !== (property.imageUrl || '') ||
        formData.propertyType !== property.propertyType ||
        formData.status !== property.status ||
        formData.address.streetAddress !== (property.address?.streetAddress || '') ||
        formData.address.city !== (property.address?.city || '') ||
        formData.address.state !== (property.address?.state || '') ||
        formData.address.country !== (property.address?.country || '') ||
        formData.address.postalCode !== (property.address?.postalCode || '');
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, property]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const parentKey = parent as keyof FormData;
        const parentValue = prev[parentKey];
        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...prev,
            [parentKey]: {
              ...parentValue,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else {
      const fieldKey = name as keyof FormData;
      setFormData(prev => ({ ...prev, [fieldKey]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setHasUnsavedChanges(true);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setImagePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    setIsSaving(true);
    
    try {
      // Prepare update payload
      const updatePayload = {
        name: formData.name,
        description: formData.description,
        propertyType: formData.propertyType,
        status: formData.status,
        address: formData.address,
        imageUrl: formData.imageUrl
      };

      await propertyService.update(propertyId, updatePayload);
      
      // Handle image upload if new image selected
      if (selectedImage) {
        // Assuming there's an upload method in propertyService
        const uploadedUrl = await propertyService.uploadImage(propertyId, selectedImage);
        if (uploadedUrl) {
          await propertyService.update(propertyId, { imageUrl: uploadedUrl });
        }
      }

      setHasUnsavedChanges(false);
      toast.success('Property updated successfully');
      router.push(`/dashboard/properties/${propertyId}`);
    } catch (err) {
      console.error('Failed to update property', err);
      toast.error('Failed to update property. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        if (propertyId) {
          router.push(`/dashboard/properties/${propertyId}`);
        } else {
          router.push('/dashboard/properties');
        }
      }
    } else {
      if (propertyId) {
        router.push(`/dashboard/properties/${propertyId}`);
      } else {
        router.push('/dashboard/properties');
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading property details...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!property) {
    return <div className="p-6">Property not found.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold">Edit Property</h1>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
          Property Type
        </label>
        <select
          id="propertyType"
          name="propertyType"
          value={formData.propertyType}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="APARTMENT">Apartment</option>
          <option value="BEDSITTER">Bedsitters</option>
          <option value="STUDIO">Studio</option>
          <option value="MAISONETTE">Maisonette</option>
          <option value="VILLA">Villa</option>
          <option value="COMMERCIAL">Commercial</option>
          <option value="OFFICE">Office</option>
          <option value="WAREHOUSE">Warehouse</option>
          <option value="HOSTEL">Hostel</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700">
          Street Address
        </label>
        <input
          id="streetAddress"
          name="address.streetAddress"
          type="text"
          value={formData.address.streetAddress}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          City
        </label>
        <input
          id="city"
          name="address.city"
          type="text"
          value={formData.address.city}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
          State
        </label>
        <input
          id="state"
          name="address.state"
          type="text"
          value={formData.address.state}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          Country
        </label>
        <input
          id="country"
          name="address.country"
          type="text"
          value={formData.address.country}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
          Postal Code
        </label>
        <input
          id="postalCode"
          name="address.postalCode"
          type="text"
          value={formData.address.postalCode}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
          Property Image
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
        />
        
        {/* Image upload */}
        <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Upload New Image
          </button>
          
          {imagePreview && (
            <div className="mt-2">
              <img 
                src={imagePreview} 
                alt="Property preview" 
                className="max-h-32 mx-auto rounded"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || !hasUnsavedChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
