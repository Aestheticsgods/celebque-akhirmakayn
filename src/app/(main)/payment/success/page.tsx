'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Home, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={48} className="text-green-400" />
        </motion.div>

        <h1 className="font-display font-bold text-3xl text-foreground mb-4">
          Payment successful!
        </h1>
        <p className="text-muted-foreground mb-2">
          Your subscription has been activated. You now have access to all exclusive content.
        </p>
        {sessionId && (
          <p className="text-xs text-muted-foreground mb-8 font-mono opacity-60">
            Ref: {sessionId}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/home">
            <Button variant="gradient" size="lg">
              <Home size={20} className="mr-2" />
              Back to home
            </Button>
          </Link>
          <Link href="/subscriptions">
            <Button variant="secondary" size="lg">
              <User size={20} className="mr-2" />
              My subscriptions
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
