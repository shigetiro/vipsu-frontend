import React from 'react';
import { BADGE_COLORS, DEFAULT_BADGE_COLOR } from '../../utils/badgeColors';
import '../User/Badges.css';
import type { Badge } from '../../types/user';

interface UserRoleBadgeProps {
  isAdmin?: boolean;
  isGMT?: boolean;
  isQAT?: boolean;
  isBNG?: boolean;
  badges?: Badge[];
  className?: string;
}

const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ isAdmin, isGMT, isQAT, isBNG, badges, className = '' }) => {
  if (!isAdmin && !isGMT && !isQAT && !isBNG && !badges?.length) return null;

  // compute active staff roles for collapsed rendering
  const activeRoles = [
    isAdmin && { label: 'Admin', title: 'Administrator' },
    isGMT && { label: 'GMT', title: 'Global Moderation Team' },
    isQAT && { label: 'QAT', title: 'Quality Assurance Team' },
    isBNG && { label: 'BNG', title: 'Beatmap Nomination Group' },
  ].filter(Boolean) as { label: string; title: string }[];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {activeRoles.length >= 2 ? (
        <span
          className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider leading-none"
          title={activeRoles.map(r => r.title).join(', ')}
        >
          Staff
        </span>
      ) : activeRoles.length === 1 ? (
        (() => {
          const role = activeRoles[0];
          let colorClasses = '';
          switch (role.label) {
            case 'Admin':
              colorClasses = 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
              break;
            case 'GMT':
              colorClasses = 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
              break;
            case 'QAT':
              colorClasses = 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
              break;
            case 'BNG':
              colorClasses = 'bg-pink-500/10 text-pink-500 border border-pink-500/20';
              break;
            default:
              break;
          }
          return (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider leading-none ${colorClasses}`}
              title={role.title}
            >
              {role.label}
            </span>
          );
        })()
      ) : null}
      {(() => {
        const firstBadge = badges?.[0];
        if (!firstBadge) return null;
        
        const truncatedLabel = firstBadge.description && firstBadge.description.length > 20 
          ? firstBadge.description.substring(0, 20) + '…' 
          : firstBadge.description;
        
        // Resolve color from BADGE_COLORS or use DEFAULT
        let resolvedColor = DEFAULT_BADGE_COLOR;
        for (const [key, color] of Object.entries(BADGE_COLORS)) {
          if (firstBadge.description && firstBadge.description.toLowerCase().includes(key.toLowerCase())) {
            resolvedColor = color;
            break;
          }
        }
        
        return (
          <span 
            className="user-group-badge"
            style={{ color: resolvedColor }}
            title={firstBadge.description}
          >
            {truncatedLabel}
          </span>
        );
      })()}
    </div>
  );
};

export default UserRoleBadge;
