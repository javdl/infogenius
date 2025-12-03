import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { WorkOS } from '@workos-inc/node';
import { SignJWT, jwtVerify } from 'jose';
import { researchTopicForPrompt, generateInfographicImage, editInfographicImage } from './geminiService.js';
const app = express();
const PORT = process.env.PORT || 8080;
// Initialize WorkOS
const workos = new WorkOS(process.env.WORKOS_API_KEY, {
    clientId: process.env.WORKOS_CLIENT_ID,
});
// JWT secret key (derived from cookie password)
const getJwtSecret = () => {
    const secret = process.env.WORKOS_COOKIE_PASSWORD || 'default-secret-change-me';
    return new TextEncoder().encode(secret);
};
// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
// Auth middleware - checks JWT session and @fashionunited.com domain
async function withAuth(req, res, next) {
    try {
        const token = req.cookies['auth-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            const { payload } = await jwtVerify(token, getJwtSecret());
            const user = payload.user;
            if (!user?.email?.endsWith('@fashionunited.com')) {
                return res.status(403).json({
                    error: 'Access restricted to @fashionunited.com email addresses'
                });
            }
            req.user = user;
            next();
        }
        catch {
            res.clearCookie('auth-token');
            return res.status(401).json({ error: 'Invalid session' });
        }
    }
    catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
// Auth Routes (not protected)
// Login - redirect to WorkOS AuthKit
app.get('/login', (req, res) => {
    const redirectUri = process.env.WORKOS_REDIRECT_URI ||
        `${req.protocol}://${req.get('host')}/callback`;
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
        provider: 'authkit',
        redirectUri,
        clientId: process.env.WORKOS_CLIENT_ID || '',
    });
    res.redirect(authorizationUrl);
});
// Callback - handle OAuth callback from WorkOS
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.redirect('/?error=no_code');
    }
    try {
        const authResponse = await workos.userManagement.authenticateWithCode({
            clientId: process.env.WORKOS_CLIENT_ID || '',
            code,
        });
        const { user } = authResponse;
        // Check domain restriction before setting cookie
        if (!user.email?.endsWith('@fashionunited.com')) {
            return res.redirect('/?error=domain_restricted');
        }
        // Create JWT with user info
        const token = await new SignJWT({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            }
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30d')
            .sign(getJwtSecret());
        // Set the session cookie
        res.cookie('auth-token', token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        res.redirect('/');
    }
    catch (error) {
        console.error('Callback error:', error);
        res.redirect('/?error=auth_failed');
    }
});
// Logout - clear session cookie
app.get('/logout', (req, res) => {
    res.clearCookie('auth-token');
    res.redirect('/');
});
// Get current user (protected)
app.get('/api/me', withAuth, (req, res) => {
    res.json({ user: req.user });
});
// Protected API Routes
app.post('/api/research', withAuth, async (req, res) => {
    try {
        const { topic, complexityLevel, visualStyle, language } = req.body;
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }
        const result = await researchTopicForPrompt(topic, complexityLevel, visualStyle, language);
        res.json(result);
    }
    catch (error) {
        console.error('Research error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Research failed' });
    }
});
app.post('/api/generate-image', withAuth, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        const imageData = await generateInfographicImage(prompt);
        res.json({ imageData });
    }
    catch (error) {
        console.error('Generate image error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Image generation failed' });
    }
});
app.post('/api/edit-image', withAuth, async (req, res) => {
    try {
        const { imageBase64, editInstruction } = req.body;
        if (!imageBase64 || !editInstruction) {
            return res.status(400).json({ error: 'Image and edit instruction are required' });
        }
        const imageData = await editInfographicImage(imageBase64, editInstruction);
        res.json({ imageData });
    }
    catch (error) {
        console.error('Edit image error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Image editing failed' });
    }
});
// Serve static files from dist folder in production
app.use(express.static(path.join(process.cwd(), 'dist')));
// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
