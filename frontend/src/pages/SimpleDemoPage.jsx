import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const SimpleDemoPage = () => {
  const [activeSection, setActiveSection] = useState('showcase');
  const [cart, setCart] = useState([]);

  const demoProducts = [
    { id: 1, name: "Smartphone Quantum X", price: 899, category: "Électronique" },
    { id: 2, name: "Laptop Nebula Pro", price: 1499, category: "Informatique" },
    { id: 3, name: "Casque VR Reality", price: 599, category: "Gaming" },
    { id: 4, name: "Montre Connectée Time", price: 299, category: "Accessoires" }
  ];

  const addToCart = (product) => {
    setCart([...cart, { ...product, cartId: Date.now() }]);
    toast.success('✨ Produit ajouté au panier!');
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
    toast.success('Produit retiré du panier');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Simple Header */}
      <div className="bg-black/80 backdrop-blur border-b border-cyan-500/30 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            NEXUS MARKET
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveSection('showcase')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeSection === 'showcase' ? 'bg-cyan-600 text-white' : 'text-gray-400'
              }`}
            >
              🚀 Vitrine
            </button>
            <button
              onClick={() => setActiveSection('products')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeSection === 'products' ? 'bg-cyan-600 text-white' : 'text-gray-400'
              }`}
            >
              🛍️ Produits
            </button>
            <button
              onClick={() => setActiveSection('cart')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeSection === 'cart' ? 'bg-cyan-600 text-white' : 'text-gray-400'
              }`}
            >
              🛒 Panier ({cart.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-8">
        {activeSection === 'showcase' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Bienvenue dans le Futur
            </h2>
            <p className="text-xl text-gray-300 mb-12">
              Découvrez une expérience d'achat révolutionnaire
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-purple-900/50 to-cyan-900/50 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-gray-400 mb-4">{product.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-cyan-400">{product.price} DT</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-gradient-to-r from-cyan-600 to-purple-600 px-4 py-2 rounded-full text-white font-medium"
                    >
                      🛒 Ajouter
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'products' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-cyan-400">Tous les Produits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gradient-to-br from-purple-900/50 to-cyan-900/50 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-gray-400 mb-4">{product.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-cyan-400">{product.price} DT</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-gradient-to-r from-cyan-600 to-purple-600 px-4 py-2 rounded-full text-white font-medium"
                    >
                      🛒 Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'cart' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-cyan-400">Votre Panier</h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-12 bg-black/50 backdrop-blur-lg rounded-2xl border border-cyan-500/30">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">Votre panier est vide</h3>
                <p className="text-gray-500 mb-6">Ajoutez des produits pour commencer</p>
                <button
                  onClick={() => setActiveSection('products')}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 px-6 py-3 rounded-full text-white font-medium"
                >
                  🛍️ Explorer les produits
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.cartId}
                    className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-white">{item.name}</h3>
                        <p className="text-cyan-400 font-bold">{item.price} DT</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 p-2 rounded-lg"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-bold text-white">Total:</span>
                    <span className="text-2xl font-bold text-cyan-400">
                      {cart.reduce((total, item) => total + item.price, 0)} DT
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <button className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 py-4 rounded-2xl text-white font-bold text-lg">
                      🚀 Procéder au paiement
                    </button>
                    
                    <Link to="/login">
                      <button className="w-full bg-transparent border-2 border-cyan-500 py-4 rounded-2xl text-cyan-400 font-bold text-lg hover:bg-cyan-500/10 transition-all">
                        🔐 Se connecter pour commander
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SimpleDemoPage;
