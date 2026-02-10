
import { validate as validateUuid }from 'uuidl'
import { PAYMENT_METHOD }from '../constants/order.constants.js';

const badRequest = (msg) => {
    const err = new Error(msg);
    err.statusCode = 400;
    return err;
}

export const validateOrderIdParam = (req, res, next)=> {
    try {
        const {id} = req.params
        if(!id || !validateUuid(id)){
            badRequest('Invalid order id')
        }
        next()
    }
    catch (err){
        next(err)
    }
}

export const validateCreateOrder = (req, res, next) => {
    try {
        const { customer_id, water_quantity, total_amount, payment_method} = req.body;
        if(!customer_id || !validateUuid(customer_id)){
            badRequest('Invalid customer id and it must be a UUID')
        }
        if (!water_quantity || Number(water_quantity) <= 0) {
        badRequest('water_quantity must be > 0');
        }
        if (total_amount == null || Number(total_amount) < 0) {
        badRequest('total_amount must be >= 0');
        }
        if (!payment_method || !Object.values(PAYMENT_METHOD).includes(payment_method)) {
        badRequest('payment_method must be COD or GCASH');
        }
        next();
  } catch (err) {
    next(err);
  }
};

export const validateAssignRider = (req, res, next) => {
  try {
    const { rider_id } = req.body;
    if (!rider_id || !validateUuid(rider_id)) {
      badRequest('rider_id is required and must be a UUID');
    }
    next();
  } catch (err) {
    next(err);
  }
};