import supabase from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, skills_have, skills_want, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !data)
      return res.status(404).json({ error: 'User not found.' });

    res.json(data);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { skills_have, skills_want } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ skills_have: skills_have || [], skills_want: skills_want || [] })
      .eq('id', req.user.id)
      .select('id, name, email, skills_have, skills_want')
      .single();

    if (error) throw error;
    res.json({ message: 'Profile updated.', user: data });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, skills_have, skills_want')
      .neq('id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user info
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, name, email, skills_have, skills_want, created_at')
      .eq('id', id)
      .single();

    if (userErr || !user)
      return res.status(404).json({ error: 'User not found.' });

    // Get accepted requests where this user was sender (skills they taught)
    const { data: taught } = await supabase
      .from('requests')
      .select('skill_offered, skill_requested, receiver_id, created_at, receiver:receiver_id(name)')
      .eq('sender_id', id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    // Get accepted requests where this user was receiver (skills they learned)
    const { data: learned } = await supabase
      .from('requests')
      .select('skill_offered, skill_requested, sender_id, created_at, sender:sender_id(name)')
      .eq('receiver_id', id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    // Get ratings received
    const { data: ratings } = await supabase
      .from('ratings')
      .select('score, review, created_at, rater:rater_id(name)')
      .eq('rated_id', id)
      .order('created_at', { ascending: false });

    const average = ratings && ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
      : null;

    res.json({
      user,
      taught: taught || [],
      learned: learned || [],
      ratings: ratings || [],
      average,
      total_exchanges: (taught?.length || 0) + (learned?.length || 0)
    });
  } catch (err) {
    console.error('Get public profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get current user's completed exchanges
export const getMyCompletedExchanges = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: taught } = await supabase
      .from('requests')
      .select('id, skill_offered, skill_requested, created_at, receiver:receiver_id(name, email)')
      .eq('sender_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    const { data: learned } = await supabase
      .from('requests')
      .select('id, skill_offered, skill_requested, created_at, sender:sender_id(name, email)')
      .eq('receiver_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    res.json({
      taught: taught || [],
      learned: learned || [],
      total: (taught?.length || 0) + (learned?.length || 0)
    });
  } catch (err) {
    console.error('Get completed exchanges error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};