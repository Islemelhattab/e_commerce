import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage = () => {
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

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            NEXUS MARKET
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 mb-12"
          >
            L'expérience d'achat la plus futuriste du web
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col md:flex-row gap-6 justify-center"
          >
            <Link to="/demo-futuristic">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 px-8 py-4 rounded-full text-white font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
              >
                🚀 Essayer la Démo
              </motion.button>
            </Link>
            
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-transparent border-2 border-cyan-500 px-8 py-4 rounded-full text-cyan-400 font-bold text-lg hover:bg-cyan-500/10 transition-all"
              >
                🔐 Se Connecter
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: '🚀', title: 'Design Futuriste', desc: 'Interface révolutionnaire avec animations fluides' },
              { icon: '💎', title: 'Qualité Premium', desc: 'Produits sélectionnés avec soin' },
              { icon: '⚡', title: 'Performance Ultime', desc: 'Experience utilisateur sans compromis' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                className="text-center p-6 bg-black/50 backdrop-blur-lg rounded-2xl border border-cyan-500/20"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-cyan-400">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
          >
            Pourquoi choisir NEXUS MARKET ?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              {
                icon: '🎨',
                title: 'Design Unique',
                desc: 'Une expérience visuelle qui sort du classique avec des animations fluides et une interface moderne.',
                reverse: false
              },
              {
                icon: '🛒',
                title: 'Panier Intelligent',
                desc: 'Gestion de panier intuitive avec animations et notifications en temps réel.',
                reverse: true
              },
              {
                icon: '🔍',
                title: 'Recherche Avancée',
                desc: 'Filtres puissants et recherche intelligente pour trouver exactement ce que vous voulez.',
                reverse: false
              },
              {
                icon: '📱',
                title: 'Responsive Design',
                desc: 'Experience parfaite sur tous les appareils, du mobile au desktop.',
                reverse: true
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: feature.reverse ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`flex items-center space-x-8 ${feature.reverse ? 'flex-row-reverse' : ''}`}
              >
                <div className="text-6xl flex-shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-cyan-400">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 backdrop-blur-xl rounded-3xl p-12 border border-cyan-500/30"
          >
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Prêt à vivre l'avenir ?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Découvrez une nouvelle façon de faire du shopping en ligne
            </p>
            <Link to="/demo-futuristic">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-cyan-600 to-purple-600 px-10 py-4 rounded-full text-white font-bold text-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
              >
                🚀 Commencer l'Expérience
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
