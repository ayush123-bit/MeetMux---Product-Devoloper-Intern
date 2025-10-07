const UserModel = require('../models/userModel');

exports.listUsers = (req, res) => {
  res.json(UserModel.findAll());
};

exports.getUserById = (req, res) => {
  const id = req.params.id;
  const user = UserModel.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

exports.createUser = (req, res) => {
  const { id, name, email, balance } = req.body;
  if (!id || !name || !email) return res.status(400).json({ error: 'id,name,email required' });
  const created = UserModel.create({ id, name, email, balance: balance || 0 });
  res.status(201).json(created);
};

exports.updateUser = (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const updated = UserModel.update(id, data);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
};
