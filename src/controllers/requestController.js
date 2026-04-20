import supabase from '../config/db.js';

export const sendRequest = async (req, res) => {
  try {
    const { receiver_id, skill_offered, skill_requested } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id || !skill_offered || !skill_requested)
      return res.status(400).json({ error: 'All fields are required.' });

    if (receiver_id === sender_id)
      return res.status(400).json({ error: 'You cannot send a request to yourself.' });

    const { data: existing } = await supabase
      .from('requests')
      .select('id')
      .eq('sender_id', sender_id)
      .eq('receiver_id', receiver_id)
      .eq('status', 'pending')
      .single();

    if (existing)
      return res.status(409).json({ error: 'A pending request already exists with this user.' });

    const { data, error } = await supabase
      .from('requests')
      .insert([{ sender_id, receiver_id, skill_offered, skill_requested }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Request sent!', request: data });
  } catch (err) {
    console.error('Send request error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

export const getRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: sent, error: e1 } = await supabase
      .from('requests')
      .select(`*, receiver:receiver_id(name, email)`)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    const { data: received, error: e2 } = await supabase
      .from('requests')
      .select(`*, sender:sender_id(name, email)`)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (e1 || e2) throw e1 || e2;

    res.json({ sent, received });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['accepted', 'rejected', 'cancelled'].includes(status))
      return res.status(400).json({ error: 'Invalid status.' });

    const { data: request, error: fetchErr } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !request)
      return res.status(404).json({ error: 'Request not found.' });

    if (status === 'cancelled' && request.sender_id !== userId)
      return res.status(403).json({ error: 'Only the sender can cancel.' });

    if ((status === 'accepted' || status === 'rejected') && request.receiver_id !== userId)
      return res.status(403).json({ error: 'Only the receiver can accept or reject.' });

    const { data, error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: `Request ${status}.`, request: data });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};