import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../services/store';
import api from '../services/api';

const NeuralShopPage = () => {
  const { user } = useAuthStore();
  const [activeSession, setActiveSession] = useState(null);
  const [emotions, setEmotions] = useState({});
  const [neuralActivity, setNeuralActivity] = useState({});
  const [hologramProducts, setHologramProducts] = useState([]);
  const [mutantProducts, setMutantProducts] = useState([]);
  const [thoughtCommands, setThoughtCommands] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [hologramMode, setHologramMode] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadHologramProducts();
    }
  }, [user]);

  const loadHologramProducts = async () => {
    try {
      const res = await api.get('/api/neural/neural/hologram_products/');
      setHologramProducts(res.data.hologram_products);
      toast.success('✨ Produits holographiques chargés!');
    } catch (error) {
      console.error('Failed to load hologram products:', error);
    }
  };

  const startMindSession = async () => {
    setIsScanning(true);
    try {
      const res = await api.post('/api/neural/neural/start_mind_session/');
      setActiveSession(res.data);
      setEmotions(res.data.emotional_state);
      setNeuralActivity(res.data.neural_activity);
      toast.success('🧠 Session neurale démarrée!');
      
      // Start webcam for emotion detection
      startWebcam();
    } catch (error) {
      toast.error('Erreur lors du démarrage de la session');
      setIsScanning(false);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Webcam access denied:', error);
      toast.error('Accès webcam refusé - Simulation activée');
    }
  };

  const analyzeEmotions = async (productId) => {
    if (!activeSession) {
      toast.error('Veuillez démarrer une session neurale d\'abord');
      return;
    }

    try {
      const res = await api.post('/api/neural/neural/analyze_emotions/', {
        session_id: activeSession.session_id,
        product_id: productId
      });
      
      setCurrentEmotion(res.data.detected_emotion);
      setEmotions(prev => ({
        ...prev,
        [res.data.detected_emotion]: res.data.intensity
      }));
      
      toast.success(`🎭 Émotion détectée: ${res.data.detected_emotion}`);
    } catch (error) {
      toast.error('Erreur lors de l\'analyse émotionnelle');
    }
  };

  const mutateProduct = async (productId, emotion) => {
    try {
      const res = await api.post('/api/neural/neural/mutate_product/', {
        product_id: productId,
        emotion: emotion
      });
      
      setMutantProducts([res.data.mutant_product, ...mutantProducts]);
      toast.success('🧬 Produit muté avec succès!');
    } catch (error) {
      toast.error('Erreur lors de la mutation du produit');
    }
  };

  const detectThoughtCommand = async () => {
    if (!activeSession) return;
    
    try {
      const res = await api.post('/api/neural/neural/detect_thought_command/', {
        session_id: activeSession.session_id
      });
      
      setThoughtCommands([res.data, ...thoughtCommands.slice(0, 4)]);
      
      if (res.data.executed) {
        toast.success(`🧠 Commande exécutée: ${res.data.detected_thought}`);
      } else {
        toast.info(`💭 Pensée détectée: ${res.data.detected_thought}`);
      }
    } catch (error) {
      toast.error('Erreur lors de la détection de pensée');
    }
  };

  const loadNeuralRecommendations = async () => {
    try {
      const res = await api.get('/api/neural/neural/neural_recommendations/');
      setRecommendations(res.data.recommendations);
      toast.success('🔮 Recommandations neurales générées!');
    } catch (error) {
      toast.error('Erreur lors du chargement des recommandations');
    }
  };

  const emotionalCheckout = async () => {
    if (!activeSession) {
      toast.error('Veuillez démarrer une session neurale d\'abord');
      return;
    }

    try {
      const res = await api.post('/api/neural/neural/emotional_checkout/', {
        session_id: activeSession.session_id
      });
      
      toast.success(`💫 Checkout émotionnel: ${res.data.checkout_theme}`);
    } catch (error) {
      toast.error('Erreur lors du checkout émotionnel');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Neural Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-50"
            animate={{
              x: [0, window.innerWidth],
              y: [0, window.innerHeight],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 10 + i * 2,
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            🧠 MindShop
          </h1>
          <p className="text-xl text-cyan-200">
            Connectez votre esprit au shopping futuriste
          </p>
        </motion.div>

        {/* Neural Status Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-cyan-500/30"
        >
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">État Neurale</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Emotions */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-purple-300">Émotions détectées</h3>
              <div className="space-y-2">
                {Object.entries(emotions).map(([emotion, value]) => (
                  <div key={emotion} className="flex justify-between items-center">
                    <span className="capitalize">{emotion}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${value * 100}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <span className="text-sm">{(value * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Neural Activity */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-300">Activité Cérébrale</h3>
              <div className="space-y-2">
                {neuralActivity.alpha_waves && (
                  <>
                    <div className="flex justify-between">
                      <span>Ondes Alpha</span>
                      <span className="text-green-400">{neuralActivity.alpha_waves.toFixed(1)} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ondes Beta</span>
                      <span className="text-green-400">{neuralActivity.beta_waves.toFixed(1)} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ondes Theta</span>
                      <span className="text-green-400">{neuralActivity.theta_waves.toFixed(1)} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ondes Gamma</span>
                      <span className="text-green-400">{neuralActivity.gamma_waves.toFixed(1)} Hz</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Session Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-yellow-300">Session Active</h3>
              {activeSession ? (
                <div className="space-y-2">
                  <p className="text-sm">Session: {activeSession.session_id.slice(0, 8)}...</p>
                  <p className="text-sm">Conversion: {(activeSession.conversion_probability * 100).toFixed(0)}%</p>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <p className="text-gray-400">Aucune session active</p>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={startMindSession}
              disabled={isScanning}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {isScanning ? '🧠 Scan en cours...' : '🚀 Démarrer Session Neurale'}
            </button>
            
            <button
              onClick={detectThoughtCommand}
              disabled={!activeSession}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50"
            >
              💭 Détecter Pensée
            </button>
            
            <button
              onClick={loadNeuralRecommendations}
              className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105"
            >
              🔮 Recommandations Neurales
            </button>
            
            <button
              onClick={() => setHologramMode(!hologramMode)}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-3 rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all transform hover:scale-105"
            >
              {hologramMode ? '🔦 Mode Normal' : '✨ Mode Hologramme'}
            </button>
          </div>
        </motion.div>

        {/* Webcam Feed */}
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-green-500/30"
          >
            <h3 className="text-xl font-bold mb-4 text-green-400">📹 Scan Facial Actif</h3>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full max-w-md mx-auto rounded-lg"
              />
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              {currentEmotion && (
                <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-full">
                  <span className="text-sm">Émotion: {currentEmotion}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Hologram Products */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            ✨ Produits Holographiques
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {hologramProducts.map((item, index) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className={`bg-black/40 backdrop-blur-lg rounded-xl p-6 border transition-all duration-300 ${
                  hologramMode 
                    ? 'border-cyan-500 shadow-lg shadow-cyan-500/50' 
                    : 'border-gray-600'
                }`}
              >
                <div className="relative mb-4">
                  {item.product.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className={`w-full h-48 object-cover rounded-lg transition-all duration-300 ${
                        hologramMode ? 'animate-pulse opacity-80' : ''
                      }`}
                    />
                  )}
                  {hologramMode && (
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-purple-500/20 rounded-lg animate-pulse"></div>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold mb-2">{item.product.name}</h3>
                <p className="text-2xl font-bold text-cyan-400 mb-4">{item.product.price} DT</p>
                
                {hologramMode && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Intensité lumineuse</span>
                      <span>{(item.hologram.glow_intensity * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Vitesse rotation</span>
                      <span>{item.hologram.rotation_speed.toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Réactivité émotionnelle</span>
                      <span>{(item.hologram.emotional_reactivity * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => analyzeEmotions(item.product.id)}
                    disabled={!activeSession}
                    className="flex-1 bg-purple-600 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    🎭 Analyser
                  </button>
                  <button
                    onClick={() => mutateProduct(item.product.id, currentEmotion || 'happiness')}
                    className="flex-1 bg-pink-600 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm"
                  >
                    🧬 Mutater
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mutant Products */}
        {mutantProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              🧬 Produits Mutants
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {mutantProducts.map((mutant, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-xl p-6 border border-pink-500/30"
                >
                  <h3 className="text-xl font-bold mb-2">{mutant.name}</h3>
                  <p className="text-gray-300 mb-4">{mutant.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-400">Multiplicateur de prix</span>
                      <p className="text-lg font-bold text-pink-400">{mutant.price_multiplier.toFixed(2)}x</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Déclencheur émotionnel</span>
                      <p className="text-lg font-bold text-purple-400">{mutant.emotion_trigger}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-sm text-gray-400">Effets spéciaux</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mutant.special_effects.map((effect, i) => (
                        <span key={i} className="px-2 py-1 bg-pink-600/30 rounded-full text-xs">
                          {effect}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: mutant.color_variation.primary }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: mutant.color_variation.secondary }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: mutant.color_variation.glow }}></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Neural Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
              🔮 Recommandations Neurales
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-green-900/50 to-teal-900/50 backdrop-blur-lg rounded-xl p-6 border border-green-500/30"
                >
                  <h3 className="text-lg font-semibold mb-2">{rec.product.name}</h3>
                  <p className="text-xl font-bold text-green-400 mb-4">{rec.product.price} DT</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Confiance neurale</span>
                      <span>{(rec.neural_scores.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Match émotionnel</span>
                      <span>{(rec.neural_scores.emotional_match * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Alignement mental</span>
                      <span>{(rec.neural_scores.thought_alignment * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-4">{rec.reason}</p>
                  
                  <button className="w-full bg-green-600 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    🧠 Accepter Recommandation
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Thought Commands */}
        {thoughtCommands.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              💭 Commandes Mentales Détectées
            </h2>
            
            <div className="space-y-3">
              {thoughtCommands.map((command, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-black/30 backdrop-blur-lg rounded-lg p-4 border ${
                    command.executed ? 'border-green-500/50' : 'border-yellow-500/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{command.detected_thought}</p>
                      <p className="text-sm text-gray-400">
                        Type: {command.command_type} | Confiance: {(command.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      command.executed ? 'bg-green-600' : 'bg-yellow-600'
                    }`}>
                      {command.executed ? 'Exécuté' : 'En attente'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Emotional Checkout */}
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <button
              onClick={emotionalCheckout}
              className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 px-8 py-4 rounded-xl font-bold text-xl hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
            >
              💫 Checkout Émotionnel
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NeuralShopPage;
