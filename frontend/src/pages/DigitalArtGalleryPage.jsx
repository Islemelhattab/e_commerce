import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../services/store';
import api from '../services/api';

const DigitalArtGalleryPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('gallery');
  const [artworks, setArtworks] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [artists, setArtists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ category: '', type: '', blockchain: '' });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [artworksRes, exhibitionsRes, categoriesRes] = await Promise.all([
        api.get('/api/art/artworks/featured/'),
        api.get('/api/art/exhibitions/current/'),
        api.get('/api/art/categories/')
      ]);
      
      setArtworks(artworksRes.data);
      setExhibitions(exhibitionsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadArtworks = async (endpoint = '/api/art/artworks/') => {
    setLoading(true);
    try {
      const res = await api.get(endpoint);
      setArtworks(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des œuvres');
    } finally {
      setLoading(false);
    }
  };

  const loadExhibitions = async () => {
    try {
      const res = await api.get('/api/art/exhibitions/');
      setExhibitions(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des expositions');
    }
  };

  const loadArtists = async () => {
    try {
      const res = await api.get('/api/art/artists/');
      setArtists(res.data.results || res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des artistes');
    }
  };

  const likeArtwork = async (artworkId) => {
    if (!user) {
      toast.error('Connectez-vous pour aimer une œuvre');
      return;
    }

    try {
      await api.post(`/api/art/artworks/${artworkId}/like/`);
      // Update the artwork in state
      setArtworks(prev => prev.map(art => 
        art.id === artworkId 
          ? { ...art, is_liked: !art.is_liked, like_count: art.is_liked ? art.like_count - 1 : art.like_count + 1 }
          : art
      ));
    } catch (error) {
      toast.error('Erreur lors du like');
    }
  };

  const placeBid = async (artworkId, amount) => {
    if (!user) {
      toast.error('Connectez-vous pour enchérir');
      return;
    }

    try {
      await api.post(`/api/art/artworks/${artworkId}/bid/`, { amount });
      toast.success('Enchère placée avec succès!');
      loadArtworks(); // Reload to update bid info
    } catch (error) {
      toast.error('Erreur lors de l\'enchère');
    }
  };

  const visitExhibition = async (exhibitionSlug) => {
    try {
      await api.post(`/api/art/exhibitions/${exhibitionSlug}/visit/`);
      toast.success('Visite enregistrée!');
    } catch (error) {
      toast.error('Erreur lors de la visite');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white py-20"
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold mb-4"
          >
            Galerie d'Art Numérique
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-200"
          >
            Découvrez et collectionnez des œuvres d'art numériques uniques
          </motion.p>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['gallery', 'exhibitions', 'artists', 'auctions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'gallery' && 'Galerie'}
                {tab === 'exhibitions' && 'Expositions'}
                {tab === 'artists' && 'Artistes'}
                {tab === 'auctions' && 'Enchères'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={filter.category}
                    onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filter.type}
                    onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Tous les types</option>
                    <option value="image">Image</option>
                    <option value="video">Vidéo</option>
                    <option value="3d">3D</option>
                    <option value="audio">Audio</option>
                    <option value="interactive">Interactif</option>
                  </select>
                  
                  <select
                    value={filter.blockchain}
                    onChange={(e) => setFilter(prev => ({ ...prev, blockchain: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Toutes les blockchains</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="polygon">Polygon</option>
                    <option value="solana">Solana</option>
                    <option value="none">Sans NFT</option>
                  </select>
                </div>
              </div>

              {/* Artworks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {artworks.map((artwork) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
                    onClick={() => setSelectedArtwork(artwork)}
                  >
                    <div className="relative">
                      {artwork.image && (
                        <img
                          src={artwork.image}
                          alt={artwork.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      {artwork.is_featured && (
                        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                          Vedette
                        </div>
                      )}
                      {artwork.is_nft && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                          NFT
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 truncate">{artwork.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">par {artwork.artist_name}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xl font-bold text-purple-600">
                          {artwork.price} {artwork.currency}
                        </span>
                        <div className="flex space-x-2 text-sm text-gray-500">
                          <span>👁 {artwork.view_count}</span>
                          <span>❤️ {artwork.like_count}</span>
                        </div>
                      </div>
                      
                      {artwork.auction_enabled && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                          <p className="text-sm text-yellow-800">
                            🎵 Enchère active
                            {artwork.highest_bid && (
                              <span className="block font-semibold">
                                Plus haut: {artwork.highest_bid.amount} {artwork.highest_bid.currency}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            likeArtwork(artwork.id);
                          }}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                            artwork.is_liked
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {artwork.is_liked ? '❤️ Aimé' : '🤍 Aimer'}
                        </button>
                        {artwork.auction_enabled && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const amount = prompt('Montant de l\'enchère:');
                              if (amount) placeBid(artwork.id, amount);
                            }}
                            className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            🎵 Enchérir
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Exhibitions Tab */}
          {activeTab === 'exhibitions' && (
            <motion.div
              key="exhibitions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {exhibitions.map((exhibition) => (
                  <motion.div
                    key={exhibition.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-lg shadow-lg overflow-hidden"
                  >
                    {exhibition.cover_image && (
                      <img
                        src={exhibition.cover_image}
                        alt={exhibition.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold">{exhibition.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          exhibition.status === 'active' ? 'bg-green-100 text-green-800' :
                          exhibition.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {exhibition.status === 'active' && 'Active'}
                          {exhibition.status === 'upcoming' && 'À venir'}
                          {exhibition.status === 'ended' && 'Terminée'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{exhibition.description}</p>
                      
                      <div className="flex items-center space-x-3 mb-4">
                        {exhibition.curator_avatar && (
                          <img
                            src={exhibition.curator_avatar}
                            alt={exhibition.curator_name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{exhibition.curator_name}</p>
                          <p className="text-sm text-gray-500">Commissaire</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-500 mb-4">
                        <span>🎨 {exhibition.artworks_count} œuvres</span>
                        <span>👥 {exhibition.visitor_count} visiteurs</span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">
                          📅 {new Date(exhibition.start_date).toLocaleDateString()} - 
                          {new Date(exhibition.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => visitExhibition(exhibition.slug)}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                      >
                        Visiter l'exposition
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Artists Tab */}
          {activeTab === 'artists' && (
            <motion.div
              key="artists"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artists.map((artist) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-lg shadow-lg p-6"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      {artist.avatar && (
                        <img
                          src={artist.avatar}
                          alt={artist.artist_name}
                          className="w-16 h-16 rounded-full"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-bold">{artist.artist_name}</h3>
                        {artist.is_verified && (
                          <span className="text-blue-600 text-sm">✓ Vérifié</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">{artist.bio}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Œuvres</span>
                        <p className="font-semibold">{artist.artworks_count}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Ventes totales</span>
                        <p className="font-semibold">{artist.total_sales} ETH</p>
                      </div>
                    </div>
                    
                    {artist.website && (
                      <a
                        href={artist.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm"
                      >
                        🌐 Site web
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Auctions Tab */}
          {activeTab === 'auctions' && (
            <motion.div
              key="auctions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Enchères en cours</h2>
                <p className="text-gray-600 mb-8">Découvrez les œuvres disponibles aux enchères</p>
                <button
                  onClick={() => loadArtworks('/api/art/artworks/auction/')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Charger les enchères
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Artwork Detail Modal */}
      <AnimatePresence>
        {selectedArtwork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedArtwork(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  {selectedArtwork.image && (
                    <img
                      src={selectedArtwork.image}
                      alt={selectedArtwork.title}
                      className="w-full rounded-lg"
                    />
                  )}
                </div>
                
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">{selectedArtwork.title}</h2>
                  
                  <div className="flex items-center space-x-3 mb-4">
                    {selectedArtwork.artist_avatar && (
                      <img
                        src={selectedArtwork.artist_avatar}
                        alt={selectedArtwork.artist_name}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{selectedArtwork.artist_name}</p>
                      {selectedArtwork.artist_verified && (
                        <span className="text-blue-600 text-sm">✓ Vérifié</span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">{selectedArtwork.description}</p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium">{selectedArtwork.art_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Année</span>
                      <span className="font-medium">{selectedArtwork.year_created}</span>
                    </div>
                    {selectedArtwork.dimensions && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dimensions</span>
                        <span className="font-medium">{selectedArtwork.dimensions}</span>
                      </div>
                    )}
                    {selectedArtwork.is_nft && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Blockchain</span>
                        <span className="font-medium">{selectedArtwork.blockchain}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-6">
                    <div className="text-center mb-6">
                      <p className="text-3xl font-bold text-purple-600">
                        {selectedArtwork.price} {selectedArtwork.currency}
                      </p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => likeArtwork(selectedArtwork.id)}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                          selectedArtwork.is_liked
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {selectedArtwork.is_liked ? '❤️ Aimé' : '🤍 Aimer'}
                      </button>
                      {selectedArtwork.auction_enabled && (
                        <button
                          onClick={() => {
                            const amount = prompt('Montant de l\'enchère:');
                            if (amount) placeBid(selectedArtwork.id, amount);
                          }}
                          className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                        >
                          🎵 Enchérir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DigitalArtGalleryPage;
