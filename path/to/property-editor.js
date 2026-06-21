import { Property } from './src/features/property/types/property';
import { propertyService } from './src/features/property/services/property-service';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PropertyEditor() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.propertyId as string | undefined;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', imageUrl: '' });

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
          name: data.name,
          description: data.description ?? '',
          imageUrl: data.imageUrl ?? '',
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [propertyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;

    try {
      await propertyService.update(propertyId, formData);
      router.push(`/dashboard/properties/${propertyId}`);
    } catch (err) {
      console.error('Failed to update property', err);
      // Optionally set error state
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
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
          Image URL
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
