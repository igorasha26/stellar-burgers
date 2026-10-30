import { fetchIngredients, ingredientsReducer } from '../ingredientsSlice';

import type { TIngredient } from '@utils-types';

const mockIngredients: TIngredient[] = [
  {
    _id: 'bun-1',
    name: 'Краторная булка N-200i',
    type: 'bun',
    proteins: 80,
    fat: 24,
    carbohydrates: 53,
    calories: 420,
    price: 1255,
    image: 'bun.png',
    image_large: 'bun-large.png',
    image_mobile: 'bun-mobile.png',
  },
  {
    _id: 'main-1',
    name: 'Биокотлета из марсианской Магнолии',
    type: 'main',
    proteins: 420,
    fat: 142,
    carbohydrates: 242,
    calories: 4242,
    price: 424,
    image: 'main.png',
    image_large: 'main-large.png',
    image_mobile: 'main-mobile.png',
  },
];

const initialState = {
  items: [],
  isLoading: true,
  error: null,
};

describe('ingredientsReducer', () => {
  describe('неизвестный экшен', () => {
    test('при состоянии undefined возвращает начальное состояние', () => {
      const state = ingredientsReducer(undefined, { type: 'UNKNOWN' });

      expect(state).toEqual(initialState);
    });

    test('не меняет переданное состояние', () => {
      const prevState = {
        items: mockIngredients,
        isLoading: false,
        error: null,
      };

      const state = ingredientsReducer(prevState, { type: 'UNKNOWN' });

      expect(state).toBe(prevState);
    });
  });

  describe('fetchIngredients', () => {
    test('pending: включает загрузку и сбрасывает ошибку', () => {
      const prevState = {
        items: [],
        isLoading: false,
        error: { message: 'Прошлая ошибка' },
      };

      const state = ingredientsReducer(prevState, fetchIngredients.pending('requestId'));

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('pending: не трогает уже загруженные ингредиенты', () => {
      const prevState = {
        items: mockIngredients,
        isLoading: false,
        error: null,
      };

      const state = ingredientsReducer(prevState, fetchIngredients.pending('requestId'));

      expect(state.items).toEqual(mockIngredients);
    });

    test('fulfilled: сохраняет ингредиенты и выключает загрузку', () => {
      const state = ingredientsReducer(
        initialState,
        fetchIngredients.fulfilled(mockIngredients, 'requestId')
      );

      expect(state.items).toEqual(mockIngredients);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    test('rejected: сохраняет ошибку и выключает загрузку', () => {
      const state = ingredientsReducer(
        initialState,
        fetchIngredients.rejected(new Error('Ошибка загрузки'), 'requestId')
      );

      expect(state.isLoading).toBe(false);
      expect(state.error).toMatchObject({ message: 'Ошибка загрузки' });
      expect(state.items).toEqual([]);
    });
  });
});
