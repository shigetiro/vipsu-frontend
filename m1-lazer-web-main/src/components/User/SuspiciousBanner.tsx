import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface SuspiciousBannerProps {
  suspicious_reasons?: string[];
  trust_score?: number;
  is_suspicious?: boolean;
  className?: string;
}

const SuspiciousBanner: React.FC<SuspiciousBannerProps> = ({ 
  suspicious_reasons = [], 
  trust_score = 100,
  is_suspicious = false,
  className = '' 
}) => {
  if (!is_suspicious) {
    return null;
  }

  const trustLevel = trust_score >= 80 ? 'high' : trust_score >= 50 ? 'medium' : 'low';
  const bgGradient = {
    high: 'from-amber-600 to-amber-700',
    medium: 'from-orange-600 to-orange-700',
    low: 'from-red-600 to-red-700',
  }[trustLevel];

  const displayReasons = suspicious_reasons && suspicious_reasons.length > 0 
    ? suspicious_reasons 
    : ['No specific reason provided'];

  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-gradient-to-r ${bgGradient} text-white rounded-xl shadow-lg overflow-hidden`}>
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
              <FaExclamationTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base mb-1">
                Suspicious Account
              </h3>
              <p className="text-sm opacity-90 mb-2">
                This account has been flagged for review. Trust Score: {trust_score}/100
              </p>
              <div className="space-y-1">
                <p className="text-xs font-medium opacity-80">Reasons:</p>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {displayReasons.slice(0, 3).map((reason, index) => (
                    <li key={index} className="opacity-95">{reason}</li>
                  ))}
                  {displayReasons.length > 3 && (
                    <li className="opacity-70 text-xs">
                      +{displayReasons.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspiciousBanner;