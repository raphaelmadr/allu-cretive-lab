// api/designs.js
// Vercel Serverless Function to read and write community designs to GitHub repository

export default async function handler(req, res) {
    const { GITHUB_PAT, GITHUB_OWNER, GITHUB_REPO } = process.env;

    if (!GITHUB_PAT || !GITHUB_OWNER || !GITHUB_REPO) {
        return res.status(500).json({ error: 'GitHub credentials not configured in environment variables.' });
    }

    const filePath = 'data/community-designs.json';
    const contentsUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    if (req.method === 'GET') {
        try {
            // Read from raw github content for fast CDN delivery and no rate limits
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${filePath}`;
            const response = await fetch(rawUrl);
            
            if (response.ok) {
                const data = await response.json();
                return res.status(200).json(data);
            } else {
                // If file doesn't exist, check via API or return empty list
                return res.status(200).json([]);
            }
        } catch (err) {
            return res.status(500).json({ error: 'Failed to read designs', details: err.message });
        }
    }

    if (req.method === 'POST') {
        try {
            const newDesign = req.body;
            if (!newDesign || !newDesign.id) {
                return res.status(400).json({ error: 'Invalid design data.' });
            }

            // 1. Get current file contents and SHA
            let currentDesigns = [];
            let sha = null;

            const getResponse = await fetch(contentsUrl, {
                headers: {
                    'Authorization': `Bearer ${GITHUB_PAT}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
                const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
                currentDesigns = JSON.parse(content || '[]');
            }

            // 2. Update or append design
            const idx = currentDesigns.findIndex(d => d.id === newDesign.id);
            const now = new Date().toISOString();
            
            if (idx > -1) {
                currentDesigns[idx] = { ...currentDesigns[idx], ...newDesign, updatedAt: now };
            } else {
                currentDesigns.unshift({
                    ...newDesign,
                    createdAt: now,
                    updatedAt: now
                });
            }

            // 3. Commit back to GitHub
            const updatedContent = JSON.stringify(currentDesigns, null, 2);
            const putResponse = await fetch(contentsUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_PAT}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `allu-creative-lab: update community design "${newDesign.name}"`,
                    content: Buffer.from(updatedContent).toString('base64'),
                    sha: sha || undefined,
                    branch: 'main'
                })
            });

            if (putResponse.ok) {
                return res.status(200).json({ message: 'Design saved to community successfully.', designId: newDesign.id });
            } else {
                const errorText = await putResponse.text();
                return res.status(putResponse.status).json({ error: 'Failed to save design to GitHub', details: errorText });
            }

        } catch (err) {
            return res.status(500).json({ error: 'Failed to write design', details: err.message });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
