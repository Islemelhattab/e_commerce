import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const DemoFuturisticPage = () => {
  const [activeSection, setActiveSection] = useState('showcase');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
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
      images: [{ image: "https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Smartphone+Quantum+X" }]
    },
    {
      id: 2,
      name: "Laptop Nebula Pro",
      description: "Performance ultime pour créateurs",
      price: 1499,
      category: { name: "Informatique" },
      images: [{ image: "https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Laptop+Nebula+Pro" }]
    },
    {
      id: 3,
      name: "Casque VR Reality",
      description: "Expérience immersive de réalité virtuelle",
      price: 599,
      category: { name: "Gaming" },
      images: [{ image: "https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Casque+VR+Reality" }]
    },
    {
      id: 4,
      name: "Montre Connectée Time",
      description: "Style et technologie réunis",
      price: 299,
      category: { name: "Accessoires" },
      images: [{ image: "https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Montre+Connectée+Time" }]
    },
    {
      id: 5,
      name: "Drone Sky Explorer",
      description: "Capturez le monde d'en haut",
      price: 799,
      category: { name: "Photographie" },
      images: [{ image: "https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Drone+Sky+Explorer" }]
    },
    {
      id: 6,
      name: "Enceinte Sonic Wave",
      description: "Son premium sans fil",
      price: 199,
      category: { name: "Audio" },
      images: [{ image: "https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Enceinte+Sonic+Wave" }]
    }
  ];

  const products = demoProducts;

  const addToCart = (productId, quantity = 1) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const existingItem = cart.find(item => item.product.id === productId);
      if (existingItem) {
        setCart(cart.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ));
      } else {
        setCart([...cart, { id: Date.now(), product, quantity }]);
      }
      toast.success('✨ Produit ajouté au panier!');
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
    toast.success('Produit retiré du panier');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesCategory = selectedCategory === 'all' || product.category?.name === selectedCategory;
    
    return matchesSearch && matchesPrice && matchesCategory;
  });

  const categories = ['all', ...new Set(products.map(p => p.category?.name).filter(Boolean))];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            animate={{
              x: [0, window.innerWidth],
              y: [0, window.innerHeight],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 10 + i * 0.5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: Math.random() * window.innerWidth,
              top: Math.random() * window.innerHeight
            }}
          />
        ))}
      </div>

      {/* Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-black/50 backdrop-blur-xl border-b border-cyan-500/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
            >
              NEXUS MARKET
            </motion.div>
            
            <nav className="hidden md:flex items-center space-x-8">
              {['showcase', 'products', 'cart', 'profile'].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`px-4 py-2 rounded-full transition-all ${
                    activeSection === section
                      ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {section === 'showcase' && '🚀 Vitrine'}
                  {section === 'products' && '🛍️ Produits'}
                  {section === 'cart' && '🛒 Panier'}
                  {section === 'profile' && '👤 Profil'}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">{cart.length}</span>
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
        <AnimatePresence mode="wait">
          {/* Showcase Section */}
          {activeSection === 'showcase' && (
            <motion.div
              key="showcase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-screen"
            >
              <div className="text-center mb-12">
                <motion.h1
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                >
                  Bienvenue dans le Futur
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-gray-300"
                >
                  Découvrez une expérience d'achat révolutionnaire
                </motion.p>
              </div>

              {/* Featured Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {products.slice(0, 6).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    className="group relative"
                  >
                    <div className="relative bg-gradient-to-br from-purple-900/50 to-cyan-900/50 backdrop-blur-lg rounded-2xl overflow-hidden border border-cyan-500/30">
                      {/* Product Image */}
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={product.images[0].image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-cyan-400">{product.price} DT</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addToCart(product.id)}
                                className="bg-gradient-to-r from-cyan-600 to-purple-600 px-4 py-2 rounded-full text-white font-medium"
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
                    className="text-center p-8 bg-gradient-to-br from-purple-900/30 to-cyan-900/30 backdrop-blur-lg rounded-2xl border border-cyan-500/20"
                  >
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-2 text-cyan-400">{feature.title}</h3>
                    <p className="text-gray-300">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Products Section */}
          {activeSection === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search and Filters */}
              <div className="mb-8 bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="🔍 Rechercher des produits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                  />
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? '🌟 Toutes les catégories' : cat}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Prix:</span>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="flex-1"
                    />
                    <span className="text-cyan-400 font-bold">{priceRange[1]} DT</span>
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
                    <div className="bg-gradient-to-br from-purple-900/50 to-cyan-900/50 backdrop-blur-lg rounded-2xl overflow-hidden border border-cyan-500/30">
                      {/* Product Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={product.images[0].image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Quick Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => addToCart(product.id)}
                            className="bg-gradient-to-r from-cyan-600 to-purple-600 p-2 rounded-full text-white"
                          >
                            🛒
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2 text-white truncate">{product.name}</h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            {product.price} DT
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addToCart(product.id)}
                            className="bg-gradient-to-r from-cyan-600 to-purple-600 px-3 py-1 rounded-full text-white text-sm font-medium"
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
                  <h3 className="text-xl font-bold text-gray-400 mb-2">Aucun produit trouvé</h3>
                  <p className="text-gray-500">Essayez de modifier vos filtres de recherche</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Cart Section */}
          {activeSection === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  🛒 Votre Panier
                </h2>

                {cart.length === 0 ? (
                  <div className="text-center py-16 bg-black/50 backdrop-blur-xl rounded-2xl border border-cyan-500/20">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">Votre panier est vide</h3>
                    <p className="text-gray-500 mb-6">Ajoutez des produits pour commencer</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveSection('products')}
                      className="bg-gradient-to-r from-cyan-600 to-purple-600 px-6 py-3 rounded-full text-white font-medium"
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
                        className="bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-800 to-cyan-800 rounded-xl flex-shrink-0 flex items-center justify-center">
                            <img
                              src={item.product.images[0].image}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-white">{item.product.name}</h3>
                            <p className="text-cyan-400 font-bold">{item.product.price} DT</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">Qty: {item.quantity}</span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeFromCart(item.id)}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 p-2 rounded-lg transition-colors"
                            >
                              🗑️
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/50 to-cyan-900/50 backdrop-blur-xl rounded-2xl border border-cyan-500/20">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-xl font-bold text-white">Total:</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                          {cart.reduce((total, item) => total + item.product.price * item.quantity, 0)} DT
                        </span>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 py-4 rounded-2xl text-white font-bold text-lg"
                      >
                        🚀 Procéder au paiement
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">👤</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Utilisateur Démo</h2>
                <p className="text-gray-400">Mode démonstration</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">📊 Statistiques</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Commandes</span>
                      <span className="text-white font-bold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Articles achetés</span>
                      <span className="text-white font-bold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total dépensé</span>
                      <span className="text-white font-bold">0 DT</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">⚙️ Préférences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Notifications</span>
                      <div className="w-12 h-6 bg-cyan-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Mode sombre</span>
                      <div className="w-12 h-6 bg-cyan-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-cyan-600 to-purple-600 px-6 py-3 rounded-full text-white font-medium"
                  >
                    🔐 Se connecter pour accéder à la version complète
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DemoFuturisticPage;
