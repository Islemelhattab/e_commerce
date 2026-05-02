import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../services/store';
import api from '../services/api';

const AIAssistantPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('style');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [outfits, setOutfits] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [sizeRecommendations, setSizeRecommendations] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load style analysis
      const styleRes = await api.get('/api/ai/assistant/analyze_style/');
      setProfile(styleRes.data.profile);

      // Load personalized recommendations
      const recRes = await api.get('/api/ai/assistant/personalized_recommendations/');
      setRecommendations(recRes.data.recommendations);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const generateOutfit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/ai/assistant/generate_outfit/', {
        occasion: 'casual',
        season: 'all_season',
        budget_max: 300
      });
      setOutfits([res.data, ...outfits]);
      toast.success('Nouvelle tenue générée !');
    } catch (error) {
      toast.error('Erreur lors de la génération de la tenue');
    } finally {
      setLoading(false);
    }
  };

  const predictTrends = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/ai/assistant/predict_trends/');
      setTrends(res.data);
      toast.success('Tendances analysées !');
    } catch (error) {
      toast.error('Erreur lors de l\'analyse des tendances');
    } finally {
      setLoading(false);
    }
  };

  const recommendSize = async (productId) => {
    try {
      const res = await api.post('/api/ai/assistant/recommend_size/', {
        product_id: productId
      });
      setSizeRecommendations([res.data, ...sizeRecommendations]);
      toast.success('Taille recommandée !');
    } catch (error) {
      toast.error('Erreur lors de la recommandation de taille');
    }
  };

  const updateProfile = async (field, value) => {
    try {
      const newProfile = { ...profile, [field]: value };
      setProfile(newProfile);
      // TODO: Implement profile update API
      toast.success('Profil mis à jour !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Assistant Shopping IA
        </h1>
        <p className="text-gray-600">
          Votre styliste personnel intelligent pour des recommandations sur mesure
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        {['style', 'outfits', 'trends', 'sizes', 'recommendations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'style' && 'Analyse Style'}
            {tab === 'outfits' && 'Tenues'}
            {tab === 'trends' && 'Tendances'}
            {tab === 'sizes' && 'Tailles'}
            {tab === 'recommendations' && 'Recommandations'}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        {/* Style Analysis Tab */}
        {activeTab === 'style' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Analyse de votre Style</h2>
            
            {profile && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-semibold mb-3">Préférences de Style</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags préférés
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {profile.style_preferences?.tags?.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégories préférées
                      </label>
                      <div className="space-y-2">
                        {Object.entries(profile.style_preferences?.categories || {}).map(([cat, count]) => (
                          <div key={cat} className="flex justify-between items-center">
                            <span className="text-sm">{cat}</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{count} articles</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Morphologie</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taille (cm)
                      </label>
                      <input
                        type="number"
                        value={profile.size_preferences?.height || ''}
                        onChange={(e) => updateProfile('size_preferences.height', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Poids (kg)
                      </label>
                      <input
                        type="number"
                        value={profile.size_preferences?.weight || ''}
                        onChange={(e) => updateProfile('size_preferences.weight', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={loadUserData}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Actualiser l'analyse
            </button>
          </div>
        )}

        {/* Outfits Tab */}
        {activeTab === 'outfits' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Tenues Suggérées</h2>
              <button
                onClick={generateOutfit}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Génération...' : 'Générer une tenue'}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {outfits.map((outfit) => (
                <div key={outfit.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{outfit.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{outfit.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {outfit.occasion}
                    </span>
                    <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                      Score: {outfit.style_score}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {outfit.products.map((product) => (
                      <div key={product.id} className="text-center">
                        {product.primary_image && (
                          <img
                            src={product.primary_image}
                            alt={product.name}
                            className="w-full h-20 object-cover rounded mb-1"
                          />
                        )}
                        <p className="text-xs text-gray-600 truncate">{product.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Tendances Actuelles</h2>
              <button
                onClick={predictTrends}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Analyse...' : 'Analyser les tendances'}
              </button>
            </div>

            <div className="space-y-4">
              {trends.map((trend, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{trend.category_name}</h3>
                    <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      {trend.confidence_score} confiance
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {trend.trend_keywords.map((keyword, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Croissance prédite: <span className="font-semibold text-green-600">+{trend.predicted_growth}%</span></p>
                    <p>Période: {trend.start_date} - {trend.end_date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sizes Tab */}
        {activeTab === 'sizes' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Recommandations de Taille</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                Sélectionnez un produit pour obtenir une recommandation de taille personnalisée
              </p>
            </div>

            <div className="space-y-4">
              {sizeRecommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    {rec.product_image && (
                      <img
                        src={rec.product_image}
                        alt={rec.product_name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{rec.product_name}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded font-semibold">
                          Taille {rec.recommended_size}
                        </span>
                        <span className="text-sm text-gray-600">
                          Ajustement: {rec.fit_type}
                        </span>
                        <span className="text-sm text-gray-600">
                          Confiance: {rec.confidence}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{rec.reasoning}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Produits Recommandés pour Vous</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {recommendations.map((product) => (
                <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {product.primary_image && (
                    <img
                      src={product.primary_image}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{product.short_description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">{product.price} DT</span>
                      <button
                        onClick={() => recommendSize(product.id)}
                        className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition-colors"
                      >
                        Taille ?
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AIAssistantPage;
