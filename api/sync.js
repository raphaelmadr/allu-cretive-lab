// api/sync.js
// Vercel Serverless Function to trigger GitHub Action

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { GITHUB_PAT, GITHUB_OWNER, GITHUB_REPO } = process.env;

    if (!GITHUB_PAT || !GITHUB_OWNER || !GITHUB_REPO) {
        return res.status(500).json({ error: 'GitHub credentials not configured in environment variables.' });
    }

    try {
        const workflowId = 'sync_products.yml';
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowId}/dispatches`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_PAT}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ref: 'main', // Ou a branch que você deseja rodar
            }),
        });

        if (response.ok) {
            return res.status(200).json({ message: 'GitHub Action trigger successfully.' });
        } else {
            const errorText = await response.text();
            return res.status(response.status).json({ error: 'Failed to trigger GitHub Action', details: errorText });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
}
