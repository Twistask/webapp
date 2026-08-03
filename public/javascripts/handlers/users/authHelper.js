export const checkAuthStatus = async function () {
    try {
        const res = await fetch('/users/auth/status', {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Auth status fetch failed');
        return await res.json();
    } catch (err) {
        console.error('Auth check error', err);
        return {authenticated: false};
    }
}