export function getBaseUrl() {
    if (process.env.NODE_ENV === 'production') {
        return process.env.NEXT_PUBLIC_BASE_URL || 'https://resto-cx-app-fe.vercel.app';
    }
    return 'http://localhost:3000';
}
