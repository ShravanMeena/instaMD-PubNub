export const getRandomColor = () => {
    const colors = [
        '#ef4444', // Red
        '#f97316', // Orange
        '#f59e0b', // Amber
        '#84cc16', // Lime
        '#10b981', // Emerald
        '#06b6d4', // Cyan
        '#3b82f6', // Blue
        '#6366f1', // Indigo
        '#8b5cf6', // Violet
        '#d946ef', // Fuchsia
        '#f43f5e', // Rose
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const getAvatarUrl = (seed) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};
