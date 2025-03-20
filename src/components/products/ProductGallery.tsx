
import React from "react";

interface ProductGalleryProps {
  name: string;
  mainImage?: string;
  additionalImages?: string[];
}

const ProductGallery = ({ name, mainImage, additionalImages }: ProductGalleryProps) => {
  const defaultMainImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9";
  const defaultAdditionalImages = [
    "photo-1592899677977-9c10ca588bbd",
    "photo-1607936854279-55e8a4c64888",
    "photo-1591337676887-a217a6970a8a",
    "photo-1556656793-08538906a9f8"
  ];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log("Image failed to load:", e.currentTarget.src);
    e.currentTarget.src = '/placeholder.svg';
  };

  const formatImageUrl = (url: string) => {
    // If it's already a complete URL, return it
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    // If it's an Unsplash ID without the domain, add it
    if (url.startsWith('photo-')) {
      return `https://images.unsplash.com/${url}`;
    }
    // Fallback to just returning the URL
    return url;
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <img 
          src={mainImage ? formatImageUrl(mainImage) : defaultMainImage}
          alt={name}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(additionalImages || defaultAdditionalImages).map((imageUrl, index) => (
          <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <img 
              src={formatImageUrl(imageUrl)}
              alt={`${name} view ${index + 1}`}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
