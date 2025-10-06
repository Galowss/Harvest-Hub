import Image from 'next/image';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ProductImage({ src, alt, className = "w-full h-full object-cover" }: ProductImageProps) {
  if (!src || src.trim() === "") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
        No Photo
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={500}
      height={500}
      className={className}
      onError={(e: any) => {
        e.target.src = '/placeholder.png'; // Fallback image
      }}
    />
  );
}