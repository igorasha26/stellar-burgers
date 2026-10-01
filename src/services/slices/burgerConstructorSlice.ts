import { createSlice, nanoid } from '@reduxjs/toolkit';

import { createOrder } from './orderSlice';

import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  TConstructorIngredient,
  TConstructorState,
  TIngredient,
} from '@utils-types';

type TMovePayload = {
  index: number;
  offset: number;
};

const initialState: TConstructorState = {
  bun: null,
  ingredients: [],
};

const burgerConstructorSlice = createSlice({
  name: 'burgerConstructor',
  initialState,
  reducers: {
    addIngredient: {
      reducer: (state, action: PayloadAction<TConstructorIngredient>) => {
        if (action.payload.type === 'bun') {
          state.bun = action.payload;
        } else {
          state.ingredients.push(action.payload);
        }
      },
      prepare: (ingredient: TIngredient) => ({
        payload: { ...ingredient, id: nanoid() },
      }),
    },
    removeIngredient: (state, action: PayloadAction<string>) => {
      state.ingredients = state.ingredients.filter((item) => item.id !== action.payload);
    },
    moveIngredient: (state, action: PayloadAction<TMovePayload>) => {
      const { index, offset } = action.payload;
      const targetIndex = index + offset;

      if (targetIndex < 0 || targetIndex >= state.ingredients.length) return;

      const [movedIngredient] = state.ingredients.splice(index, 1);
      state.ingredients.splice(targetIndex, 0, movedIngredient);
    },
  },
  selectors: {
    selectConstructorItems: (state) => state,
  },
  extraReducers: (builder) => {
    builder.addCase(createOrder.fulfilled, () => initialState);
  },
});

export const { addIngredient, removeIngredient, moveIngredient } =
  burgerConstructorSlice.actions;
export const { selectConstructorItems } = burgerConstructorSlice.selectors;
export const burgerConstructorReducer = burgerConstructorSlice.reducer;
