import Image from 'next/image';

export default function OrderCard({ order }: { order: any }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="h-40 bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
        {order.photo ? (
          <Image
            src={order.photo}
            alt={order.name}
            fill
            className="object-cover"
            unoptimized // Add this if dealing with external URLs
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Photo
          </div>
        )}
      </div>
      {/* Rest of your order card content */}
    </div>
  );
}