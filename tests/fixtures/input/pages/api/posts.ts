import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.json({ posts: [] });
  }
  if (req.method === 'POST') {
    return res.status(201).json({ created: true });
  }
  res.status(405).end();
}
