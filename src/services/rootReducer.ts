import { combineReducers } from '@reduxjs/toolkit';

import { burgerConstructorReducer } from './slices/burgerConstructorSlice';
import { feedReducer } from './slices/feedSlice';
import { ingredientsReducer } from './slices/ingredientsSlice';
import { orderDetailsReducer } from './slices/orderDetailsSlice';
import { orderReducer } from './slices/orderSlice';
import { profileOrdersReducer } from './slices/profileOrdersSlice';
import { userReducer } from './slices/userSlice';

export const rootReducer = combineReducers({
  ingredients: ingredientsReducer,
  burgerConstructor: burgerConstructorReducer,
  order: orderReducer,
  orderDetails: orderDetailsReducer,
  feed: feedReducer,
  profileOrders: profileOrdersReducer,
  user: userReducer,
});
