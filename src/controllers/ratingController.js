import supabase from '../config/db.js';

export const submitRating = async (req, res) => {
  try {
    const raterId = req.user.id;
    const { request_id, score, review } = req.body;

    if (!request_id || !score) {
      return res.status(400).json({ error: 'Request ID and score are required.' });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5.' });
    }

    // Verify request is accepted and user is part of it
    const { data: request, error: reqErr } = await supabase
      .from('requests')
      .select('*')
      .eq('id', request_id)
      .eq('status', 'accepted')
      .single();

    if (reqErr || !request) {
      return res.status(404).json({ error: 'Accepted request not found.' });
    }

    if (request.sender_id !== raterId && request.receiver_id !== raterId) {
      return res.status(403).json({ error: 'You are not part of this exchange.' });
    }

    // Who are they rating?
    const ratedId = request.sender_id === raterId ? request.receiver_id : request.sender_id;

    // Check if already rated
    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('rater_id', raterId)
      .eq('request_id', request_id)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'You already rated this exchange.' });
    }

    const { data, error } = await supabase
      .from('ratings')
      .insert([{ rater_id: raterId, rated_id: ratedId, request_id, score, review: review || null }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Rating submitted!', rating: data });
  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

export const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('ratings')
      .select(`*, rater:rater_id(name)`)
      .eq('rated_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const avg = data.length > 0
      ? (data.reduce((sum, r) => sum + r.score, 0) / data.length).toFixed(1)
      : null;

    res.json({ ratings: data, average: avg, count: data.length });
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};