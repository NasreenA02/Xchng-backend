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