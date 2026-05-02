import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productAPI } from '../services/api';
import { useCartStore } from '../services/store';

export default function SwipeShopPage() {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null); // 'left' or 'right'
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-swipe'],
    queryFn: () => productAPI.getProducts().then(r => r.data.results || r.data),
  });

  const handleSwipe = async (isRight) => {
    setDirection(isRight ? 'right' : 'left');
    
    if (isRight) {
      const product = products[currentIndex];
      const res = await addToCart(product.id);
      if (res && res.success === false) {
          toast.error(res.error?.detail || 'Erreur lors de l\'ajout au panier');
      } else {
          toast.success('Ajouté au panier ! 🛒', { icon: '🔥' });
          createConfetti();
      }
    }

    setTimeout(() => {
      setDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const createConfetti = () => {
    for (let i = 0; i < 30; i++) {
      const conf = document.createElement('div');
      conf.style.position = 'fixed';
      conf.style.left = '50%';
      conf.style.top = '50%';
      conf.style.width = '10px';
      conf.style.height = '10px';
      conf.style.backgroundColor = ['#E63946', '#4ADE80', '#F59E0B', '#3B82F6'][Math.floor(Math.random() * 4)];
      conf.style.borderRadius = '50%';
      conf.style.zIndex = 9999;
      conf.style.pointerEvents = 'none';
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 10 + Math.random() * 20;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      document.body.appendChild(conf);
      
      let x = 0, y = 0;
      let opacity = 1;
      
      const anim = setInterval(() => {
        x += vx;
        y += vy + 5; // gravity
        opacity -= 0.02;
        conf.style.transform = `translate(${x}px, ${y}px) scale(${opacity})`;
        
        if (opacity <= 0) {
          clearInterval(anim);
          conf.remove();
        }
      }, 16);
    }
  };

  if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement d'une expérience folle...</div>;

  if (currentIndex >= products.length) {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: 'white', textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, marginBottom: 20 }}>🎉 Vous avez tout vu ! 🎉</h1>
        <p style={{ fontSize: 20, color: '#888', marginBottom: 40 }}>Votre panier vous attend avec impatience.</p>
        <button onClick={() => navigate('/cart')} style={{ padding: '16px 32px', fontSize: 20, borderRadius: 100, background: '#E63946', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          Voir mon panier
        </button>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  const imageUrl = currentProduct.primary_image || (currentProduct.images && currentProduct.images.length > 0 ? currentProduct.images[0].image : 'https://via.placeholder.com/400');

  return (
    <div style={{ height: '90vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
      
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(230,57,70,0.15) 0%, rgba(0,0,0,0) 70%)', transform: 'translate(-50%, -50%)', zIndex: 0 }} />

      <h1 style={{ position: 'absolute', top: 40, color: 'white', fontFamily: 'var(--font-display)', fontSize: 28, zIndex: 10, letterSpacing: 2 }}>🔥 SWIPE SHOP 🔥</h1>

      {/* The Card */}
      <div style={{
        position: 'relative',
        width: 340,
        height: 520,
        background: 'white',
        borderRadius: 24,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: direction ? 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s' : 'transform 0.1s',
        transform: direction === 'left' ? 'translateX(-150%) rotate(-20deg)' : direction === 'right' ? 'translateX(150%) rotate(20deg)' : 'translateX(0) rotate(0)',
        opacity: direction ? 0 : 1
      }}>
        
        {/* Image */}
        <div style={{ height: '60%', width: '100%', background: '#f5f5f5', position: 'relative', cursor: 'pointer' }} onClick={() => window.open(`/products/${currentProduct.slug}`, '_blank')}>
          <img src={imageUrl} alt={currentProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
            ℹ️ Cliquez pour détails
          </div>
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '4px 12px', borderRadius: 20, fontWeight: 'bold' }}>
            {parseFloat(currentProduct.price).toFixed(3)} DT
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#0a0a0f' }}>{currentProduct.name}</h2>
          <p style={{ color: '#666', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {currentProduct.description}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 40, marginTop: 30, zIndex: 10 }}>
        <button onClick={() => handleSwipe(false)} style={{ 
          width: 70, height: 70, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          color: '#E63946', transition: 'transform 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          ❌
        </button>
        <button onClick={() => handleSwipe(true)} style={{ 
          width: 70, height: 70, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          color: '#4ADE80', transition: 'transform 0.2s'
        }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          💚
        </button>
      </div>

    </div>
  );
}
