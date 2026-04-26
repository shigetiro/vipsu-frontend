/**
 * Modernized Profile Header Component
 * Demonstrates best practices for profile page modernization
 */

import React from 'react';
import { cn } from '../../utils/cn';
import Avatar from '../UI/Avatar';
import UserRoleBadge from '../UI/UserRoleBadge';
import Badges from './Badges';

interface ProfileHeaderProps {
  user: any;
  isCoverExpanded: boolean;
  onAvatarUpdate: (avatarData: any) => void;
}

export const ProfileHeaderModernized: React.FC<ProfileHeaderProps> = ({
  user,
  isCoverExpanded,
  onAvatarUpdate
}) => {
  return (
    <section
      className={cn(
        'relative md:bg-card',
        'px-3 md:px-8 py-4 md:py-6',
        'border-b border-card'
      )}
    >
      {/* Modern flex layout without negative margins */}
      <div className="flex items-end md:items-start gap-4 md:gap-6">
        {/* Avatar container with proper scaling */}
        <div className={cn(
          'flex-shrink-0',
          isCoverExpanded && 'md:mb-2'
        )}>
          <div className={cn(
            'transition-all duration-300',
            isCoverExpanded ? 'md:scale-105' : 'md:scale-100'
          )}>
            <Avatar
              userId={user.id}
              username={user.username}
              avatarUrl={user.avatar_url}
              size="xl"
              shape="rounded"
              editable={false}
              className="ring-4 md:ring-2 ring-card"
              onAvatarUpdate={onAvatarUpdate}
            />
          </div>
        </div>

        {/* User info with modern spacing */}
        <div className="flex-1 min-w-0">
          {/* Primary row: Username + Role Badges */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <h1 className={cn(
              'font-bold text-text-primary truncate',
              'text-2xl md:text-3xl lg:text-4xl', // Using consistent font sizes
              'leading-tight'
            )}>
              {user.username}
            </h1>

            <UserRoleBadge
              isAdmin={user.is_admin}
              isGMT={user.is_gmt}
              isQAT={user.is_qat}
              isBNG={user.is_bng}
              className="shrink-0"
            />

            {Array.isArray(user.badges) && user.badges.length > 0 && (
              <div className="shrink-0">
                <Badges badges={user.badges} />
              </div>
            )}
          </div>

          {/* Secondary row: Country & Team info */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {user.country?.code && (
              <div className="flex items-center gap-2">
                <img
                  src={`/image/flag/${user.country.code.toLowerCase()}.svg`}
                  alt={user.country.name}
                  className="h-5 md:h-6 w-auto rounded-sm object-contain cursor-help"
                  loading="lazy"
                  decoding="async"
                />
                <span className="text-sm md:text-base text-text-secondary">
                  {user.country?.name}
                </span>
              </div>
            )}

            {user.team && (
              <div className="flex items-center gap-2">
                <img
                  src={user.team.flag_url}
                  alt={user.team.name}
                  className="h-5 md:h-6 w-auto rounded-sm object-contain cursor-help"
                  loading="lazy"
                  decoding="async"
                />
                <span className="text-sm md:text-base text-text-secondary">
                  {user.team.short_name || user.team.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Key Modernization Improvements:
 *
 * 1. NO NEGATIVE MARGINS - Uses proper flexbox layouts
 * 2. CONSISTENT SPACING - Uses Tailwind scale system (gap-2, mb-3)
 * 3. CLEAN CLASS COMPOSITION - Uses cn() helper for conditionals
 * 4. SEMANTIC SIZING - text-2xl, md:text-3xl instead of hardcoded sizes
 * 5. PROPER FLEX SHRINKING - Uses shrink-0 to prevent unwanted flex behavior
 * 6. IMPROVED READABILITY - Flattened structure, clear sections
 * 7. MODERN CSS VARIABLES - Uses --text-primary, --text-secondary
 * 8. BETTER RESPONSIVENESS - Consistent md: breakpoints
 * 9. ACCESSIBLE - Proper image loading attributes
 * 10. MAINTAINABLE - Clear component boundaries
 */
