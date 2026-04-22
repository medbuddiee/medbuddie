import React from 'react';

/**
 * UserAvatar — shows an <img> if avatarUrl is set, otherwise a coloured
 * initial-letter circle.  Size is controlled by the `size` prop (px number).
 */
export default function UserAvatar({ name, avatarUrl, size = 36, style = {} }) {
    const initials = name ? name.trim()[0].toUpperCase() : '?';

    const base = {
        width:  size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        objectFit: 'cover',
        ...style,
    };

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name || 'avatar'}
                style={base}
                onError={e => { e.currentTarget.style.display = 'none'; }}
            />
        );
    }

    // Seed a consistent colour from the name
    const hue = name
        ? [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
        : 200;

    return (
        <div
            style={{
                ...base,
                background: `hsl(${hue},55%,48%)`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.4,
                fontWeight: 700,
                letterSpacing: 0,
                userSelect: 'none',
            }}
            aria-label={name || 'User'}
        >
            {initials}
        </div>
    );
}
