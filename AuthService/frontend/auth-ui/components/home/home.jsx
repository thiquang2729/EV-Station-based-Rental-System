import React from 'react';

export default function Home({ user, onLogout }) {
    return (
        <div style={{ padding: 24 }}>
            <h1>Hello, {user?.name || 'User'}!</h1>
            <button onClick={onLogout}>Đăng xuất</button>
        </div>
    );
}