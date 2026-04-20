import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/db.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing)
      return res.status(409).json({ error: 'Email already registered.' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([{ name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword }])
      .select('id, name, email')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Account created successfully.', user: data });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        skills_have: user.skills_have,
        skills_want: user.skills_want
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};