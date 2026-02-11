import * as adminService from '../services/admin.service.js';

export const getUsers = async (req, res, next) => {
  try {
    const data = await adminService.listUsers(req.query);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const archiveUser = async (req, res, next) => {
  try {
    const user = await adminService.archiveUser(req.params.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const restoreUser = async (req, res, next) => {
  try {
    const user = await adminService.restoreUser(req.params.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
