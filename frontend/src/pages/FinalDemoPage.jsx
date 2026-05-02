import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FinalDemoPage = () => {
  const [cart, setCart] = useState([]);
  const [activeSection, setActiveSection] = useState('products');

  const products = [
    { id: 1, name: "Smartphone Pro", price: 999, color: "from-blue-500 to-cyan-500" },
    { id: 2, name: "Laptop Ultra", price: 1499, color: "from-purple-500 to-pink-500" },
    { id: 3, name: "Watch Smart", price: 299, color: "from-green-500 to-teal-500" },
    { id: 4, name: "Headphones Max", price: 399, color: "from-orange-500 to-red-500" }
  ];

  const addToCart = (product) => {
    setCart([...cart, { ...product, cartId: Date.now() }]);
    alert('✅ Ajouté au panier: ' + product.name);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
    alert('❌ Retiré du panier');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* HEADER */}
      <div className="bg-white shadow-lg p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🚀 NEXUS MARKET
          </h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveSection('products')}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                activeSection === 'products' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              🛍️ Produits
            </button>
            <button 
              onClick={() => setActiveSection('cart')}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                activeSection === 'cart' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              🛒 Panier ({cart.length})
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto p-8">
        {activeSection === 'products' && (
          <div>
            <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🌟 Nos Produits Incroyables
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:scale-105">
                  <div className={`h-32 bg-gradient-to-r ${product.color} flex items-center justify-center`}>
                    <div className="text-white text-4xl">📱</div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-4">{product.price} DT</p>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                      🛒 Ajouter au Panier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'cart' && (
          <div>
            <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🛒 Votre Panier
            </h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-xl">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-4">Votre panier est vide</h3>
                <button 
                  onClick={() => setActiveSection('products')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  🛍️ Voir les Produits
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.cartId} className="bg-white rounded-2xl p-6 shadow-xl flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <p className="text-2xl font-bold text-blue-600">{item.price} DT</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.cartId)}
                      className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                ))}
                
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-2xl font-bold">Total:</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {cart.reduce((total, item) => total + item.price, 0)} DT
                    </span>
                  </div>
                  <button className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 rounded-xl font-bold text-xl hover:shadow-lg transition-all">
                    🚀 Commander Maintenant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalDemoPage;
