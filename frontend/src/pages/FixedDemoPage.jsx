import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FixedDemoPage = () => {
  const [activeSection, setActiveSection] = useState('showcase');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Demo products data
  const demoProducts = [
    {
      id: 1,
      name: "Smartphone Quantum X",
      description: "Le smartphone du futur avec IA intégrée",
      price: 899,
      category: { name: "Électronique" },
      image: "https://via.placeholder.com/400x300/4F46E5/ffffff?text=Smartphone+Quantum+X"
    },
    {
      id: 2,
      name: "Laptop Nebula Pro",
      description: "Performance ultime pour créateurs",
      price: 1499,
      category: { name: "Informatique" },
      image: "https://via.placeholder.com/400x300/4F46E5/ffffff?text=Laptop+Nebula+Pro"
    },
    {
      id: 3,
      name: "Casque VR Reality",
      description: "Expérience immersive de réalité virtuelle",
      price: 599,
      category: { name: "Gaming" },
      image: "https://via.placeholder.com/400x300/4F46E5/ffffff?text=Casque+VR+Reality"
    },
    {
      id: 4,
      name: "Montre Connectée Time",
      description: "Style et technologie réunis",
      price: 299,
      category: { name: "Accessoires" },
      image: "https://via.placeholder.com/400x300/4F46E5/ffffff?text=Montre+Connectée+Time"
    },
    {
      id: 5,
      name: "Drone Sky Explorer",
      description: "Capturez le monde d'en haut",
      price: 799,
      category: { name: "Photographie" },
      image: "https://via.placeholder.com/400x300/4F46E5/ffffff?text=Drone+Sky+Explorer"
    },
    {
      id: 6,
      name: "Enceinte Sonic Wave",
      description: "Son premium sans fil",
      price: 199,
      category: { name: "Audio" },
      image: "https://via.placeholder.com/400x300/4F46E5/ffffff?text=Enceinte+Sonic+Wave"
    }
  ];

  // Cart functions
  const addToCart = (productId) => {
    const product = demoProducts.find(p => p.id === productId);
    if (product) {
      const existingItem = cart.find(item => item.product.id === productId);
      if (existingItem) {
        setCart(cart.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setCart([...cart, { id: Date.now(), product, quantity: 1 }]);
      }
      alert('✨ Produit ajouté au panier!');
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
    alert('Produit retiré du panier');
  };

  const filteredProducts = demoProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesCategory = selectedCategory === 'all' || product.category?.name === selectedCategory;
    
    return matchesSearch && matchesPrice && matchesCategory;
  });

  const categories = ['all', ...new Set(demoProducts.map(p => p.category?.name).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-gray-800 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100/30 via-white/50 to-cyan-100/30"></div>

      {/* Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-blue-200 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
            >
              NEXUS MARKET
            </motion.div>
            
            <nav className="hidden md:flex items-center space-x-6">
              {['showcase', 'products', 'cart', 'login'].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-4 py-2 rounded-full transition-all font-medium ${
                    activeSection === section
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {section === 'showcase' && '🚀 Vitrine'}
                  {section === 'products' && '🛍️ Produits'}
                  {section === 'cart' && `🛒 Panier (${cart.length})`}
                  {section === 'login' && '🔐 Connexion'}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">{cart.length}</span>
                </div>
                {cart.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

        {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Showcase Section */}
        {activeSection === 'showcase' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen"
          >
            <div className="text-center mb-12">
              <motion.h1
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent"
              >
                Bienvenue dans le Futur
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-600"
              >
                Découvrez une expérience d'achat révolutionnaire
              </motion.p>
            </div>

            {/* Featured Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {demoProducts.slice(0, 6).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative"
                >
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-blue-100">
                    {/* Product Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-cyan-300">{product.price} DT</span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => addToCart(product.id)}
                              className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 rounded-full text-white font-medium shadow-lg"
                            >
                              🛒 Ajouter
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: '🚀', title: 'Livraison Instantanée', desc: 'Recevez vos produits en temps réel' },
                { icon: '🔮', title: 'IA Personnalisée', desc: 'Recommandations intelligentes' },
                { icon: '💎', title: 'Qualité Premium', desc: 'Produits sélectionnés avec soin' }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center p-8 bg-white rounded-2xl shadow-xl border border-blue-100"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2 text-blue-600">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Products Section */}
        {activeSection === 'products' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Search and Filters */}
            <div className="mb-8 bg-white rounded-2xl p-6 shadow-xl border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="🔍 Rechercher des produits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? '🌟 Toutes les catégories' : cat}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Prix:</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="flex-1"
                  />
                  <span className="text-blue-600 font-bold">{priceRange[1]} DT</span>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-blue-100">
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Quick Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => addToCart(product.id)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-full text-white shadow-lg"
                        >
                          🛒
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-gray-800 truncate">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {product.price} DT
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addToCart(product.id)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 rounded-full text-white text-sm font-medium shadow-lg"
                        >
                          Ajouter
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-500">Essayez de modifier vos filtres de recherche</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Cart Section */}
        {activeSection === 'cart' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                🛒 Votre Panier
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-xl border border-blue-100">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-bold text-gray-600 mb-2">Votre panier est vide</h3>
                  <p className="text-gray-500 mb-6">Ajoutez des produits pour commencer</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSection('products')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 rounded-full text-white font-medium shadow-lg"
                  >
                    🛍️ Explorer les produits
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-2xl p-6 shadow-xl border border-blue-100"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800">{item.product.name}</h3>
                          <p className="text-blue-600 font-bold">{item.product.price} DT</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Qty: {item.quantity}</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeFromCart(item.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-xl border border-blue-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xl font-bold text-gray-800">Total:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {cart.reduce((total, item) => total + item.product.price * item.quantity, 0)} DT
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 py-4 rounded-2xl text-white font-bold text-lg shadow-xl"
                      >
                        🚀 Procéder au paiement
                      </motion.button>
                      
                      <Link to="/login">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-white border-2 border-blue-500 py-4 rounded-2xl text-blue-600 font-bold text-lg hover:bg-blue-50 transition-all"
                        >
                          🔐 Se connecter pour commander
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Login Section */}
        {activeSection === 'login' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-100">
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                🔐 Connexion
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="demo@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-600 mb-2">Mot de passe</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 py-3 rounded-xl text-white font-bold shadow-lg"
                  onClick={() => alert('Redirection vers la page de connexion...')}
                >
                  Se connecter
                </motion.button>
                
                <div className="text-center">
                  <p className="text-gray-600">
                    Pas de compte ?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-500">
                      S'inscrire
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default FixedDemoPage;
