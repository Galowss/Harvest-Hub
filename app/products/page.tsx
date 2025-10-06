import ProductImage from '@/components/ProductImage';

{products.map((product) => (
  <div key={product.id} className="bg-white p-4 rounded-lg shadow">
    <div className="h-40 bg-gray-100 rounded-lg mb-4 overflow-hidden">
      <ProductImage
        src={product.photo || '/placeholder.png'}
        alt={product.name}
      />
    </div>
    <h2 className="text-lg font-semibold mb-2">{product.name}</h2>
    <p className="text-gray-700 mb-4">{product.description}</p>
    <span className="text-xl font-bold">{`$${product.price}`}</span>
  </div>
))}