import { Truck } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

interface ShippingProgressProps {
  current: number;
  threshold: number;
  progress: number;
}

function ShippingProgress({ current, threshold, progress }: ShippingProgressProps) {
  const remaining = Math.max(0, threshold - current);
  const unlocked = current >= threshold;
  const { formatCurrency } = useLocale();

  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        unlocked
          ? 'border-emerald-400/20 bg-emerald-400/10'
          : 'border-cyan-400/20 bg-cyan-400/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-slate-950/70 p-2 text-cyan-300">
          <Truck className="h-4 w-4" />
        </div>
        <div className="w-full">
          <p className="text-sm font-medium text-white">
            {unlocked
              ? 'Free shipping unlocked for this order.'
              : `Add ${formatCurrency(remaining)} more to unlock free shipping.`}
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-900/80">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={threshold}
              aria-valuenow={Math.min(current, threshold)}
              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
              aria-label={`${Math.round(progress)} percent toward free shipping`}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
            <span>{formatCurrency(current)} in cart</span>
            <span>{formatCurrency(threshold)} target</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShippingProgress;
