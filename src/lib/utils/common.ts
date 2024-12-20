export function getBaseUrl() {
    if (process.env.NODE_ENV === 'production') {
        return process.env.NEXT_PUBLIC_BASE_URL || 'https://your-production-domain.com';
    }
    return 'http://localhost:3000';
}
