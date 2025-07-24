'use client';

import dynamic from 'next/dynamic';
import { LucideIcon } from 'lucide-react';

interface ClientOnlyIconProps {
  icon: LucideIcon;
  className?: string;
}

// This component will only render on the client side
// preventing hydration mismatches from browser extensions
const ClientOnlyIconComponent = ({ icon: Icon, className }: ClientOnlyIconProps) => {
  return <Icon className={className} />;
};

// Disable SSR for this component to prevent hydration issues
const ClientOnlyIcon = dynamic(() => Promise.resolve(ClientOnlyIconComponent), {
  ssr: false,
  loading: () => <div className="w-8 h-8" /> // placeholder during loading
});

export default ClientOnlyIcon;