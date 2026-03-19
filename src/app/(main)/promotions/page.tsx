'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Percent, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Creator {
  id: string;
  name: string;
  image?: string;
}

interface Promotion {
  id: string;
  creatorId?: string;
  creator?: Creator;
  discount: number;
  originalPrice: number;
  description: string;
  expiresAt: string;
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('/api/subscriptions');
        const data = await response.json();
        
        // Create sample promotions from subscriptions
        const promoArray = Array.isArray(data) ? data : (data.subscriptions && Array.isArray(data.subscriptions) ? data.subscriptions : []);
        
        const sampledPromotions: Promotion[] = promoArray.slice(0, 6).map((sub: any, index: number) => ({
          id: `promo-${index}`,
          creator: {
            id: sub.creatorId || sub.id,
            name: sub.creatorName || 'Creator',
            image: sub.image,
          },
          discount: (20 + (index % 4) * 10) as number,
          originalPrice: sub.subscriptionFee || 9.99,
          description: index % 2 === 0 ? 'First month at special rate' : 'Limited time offer',
          expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        }));

        setPromotions(sampledPromotions);
      } catch (error) {
        console.error('Failed to fetch promotions:', error);
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const getDiscountedPrice = (originalPrice: number, discount: number) => {
    return (originalPrice * (1 - discount / 100)).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 lg:px-8 pb-24 lg:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Gift size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">
              Promotions
            </h1>
            <p className="text-muted-foreground">
              Limited time exclusive offers
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-elevated rounded-2xl p-6 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : promotions.length > 0 ? (
          <div className="space-y-4">
            {promotions.map((promo, index) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-elevated rounded-2xl p-6 relative overflow-hidden"
              >
                {/* Discount Badge */}
                <div className="absolute top-4 right-4 gradient-primary px-3 py-1 rounded-full flex items-center gap-1">
                  <Percent size={14} className="text-primary-foreground" />
                  <span className="text-sm font-bold text-primary-foreground">
                    -{promo.discount}%
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={promo.creator?.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                    alt={promo.creator?.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30"
                  />
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {promo.creator?.name || 'Creator'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {promo.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-2xl text-primary">
                        €{getDiscountedPrice(promo.originalPrice, promo.discount)}
                      </span>
                      <span className="text-muted-foreground line-through">
                        €{promo.originalPrice}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Clock size={14} />
                      <span>
                        Expires {new Date(promo.expiresAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  </div>
                  <Button variant="gradient" size="sm">
                    Redeem
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-elevated rounded-2xl">
            <Gift size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No promotions available</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
