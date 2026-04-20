import supabase from '../config/db.js';

// Get all conversations for current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all accepted requests involving this user
    const { data: requests, error } = await supabase
      .from('requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        skill_offered,
        skill_requested,
        sender:sender_id(id, name, email),
        receiver:receiver_id(id, name, email)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw error;

    // For each request, get last message and unread count
    const conversations = await Promise.all(requests.map(async (r) => {
      const otherId = r.sender_id === userId ? r.receiver_id : r.sender_id;
      const otherUser = r.sender_id === userId ? r.receiver : r.sender;

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at, sender_id')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('sender_id', otherId)
        .eq('read', false);

      return {
        request_id: r.id,
        other_user: otherUser,
        skill_offered: r.skill_offered,
        skill_requested: r.skill_requested,
        last_message: lastMsg?.[0] || null,
        unread_count: count || 0,
      };
    }));

    res.json(conversations);
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get messages between current user and another user
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherId } = req.params;

    // Verify they have an accepted request
    const { data: request } = await supabase
      .from('requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
      .single();

    if (!request) {
      return res.status(403).json({ error: 'No accepted exchange with this user.' });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', otherId)
      .eq('read', false);

    res.json(data);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content?.trim()) {
      return res.status(400).json({ error: 'Receiver and content are required.' });
    }

    // Verify accepted request exists
    const { data: request } = await supabase
      .from('requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${userId})`)
      .single();

    if (!request) {
      return res.status(403).json({ error: 'You can only message users you have an accepted exchange with.' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender_id: userId, receiver_id, content: content.trim() }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};