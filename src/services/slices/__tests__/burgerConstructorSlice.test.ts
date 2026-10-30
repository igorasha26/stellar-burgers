import {
  addIngredient,
  burgerConstructorReducer,
  moveIngredient,
  removeIngredient,
} from '../burgerConstructorSlice';
import { createOrder } from '../orderSlice';

import type {
  TConstructorIngredient,
  TConstructorState,
  TIngredient,
} from '@utils-types';

const bun: TIngredient = {
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
};

const anotherBun: TIngredient = {
  ...bun,
  _id: 'bun-2',
  name: 'Флюоресцентная булка R2-D3',
};

const main: TIngredient = {
  ...bun,
  _id: 'main-1',
  name: 'Биокотлета из марсианской Магнолии',
  type: 'main',
  price: 424,
};

const sauce: TIngredient = {
  ...bun,
  _id: 'sauce-1',
  name: 'Соус Spicy-X',
  type: 'sauce',
  price: 90,
};

const withId = (ingredient: TIngredient, id: string): TConstructorIngredient => ({
  ...ingredient,
  id,
});

const emptyState: TConstructorState = { bun: null, ingredients: [] };

const filledState: TConstructorState = {
  bun: withId(bun, 'bun-id'),
  ingredients: [withId(main, 'main-id'), withId(sauce, 'sauce-id')],
};

const mockOrder = {
  _id: 'order-1',
  status: 'done',
  name: 'Тестовый бургер',
  createdAt: '2026-10-29T10:00:00.000Z',
  updatedAt: '2026-10-29T10:00:00.000Z',
  number: 12345,
  ingredients: ['bun-1', 'main-1', 'bun-1'],
};

describe('burgerConstructorReducer', () => {
  describe('неизвестный экшен', () => {
    test('при состоянии undefined возвращает начальное состояние', () => {
      const state = burgerConstructorReducer(undefined, { type: 'UNKNOWN' });

      expect(state).toEqual(emptyState);
    });

    test('не меняет переданное состояние', () => {
      const state = burgerConstructorReducer(filledState, { type: 'UNKNOWN' });

      expect(state).toBe(filledState);
    });
  });

  describe('addIngredient', () => {
    test('кладёт булку в поле bun и не трогает начинки', () => {
      const action = addIngredient(bun);

      const state = burgerConstructorReducer(emptyState, action);

      expect(state.bun).toEqual({ ...bun, id: action.payload.id });
      expect(state.ingredients).toEqual([]);
    });

    test('заменяет текущую булку на новую', () => {
      const state = burgerConstructorReducer(filledState, addIngredient(anotherBun));

      expect(state.bun).toMatchObject({ _id: 'bun-2' });
      expect(state.ingredients).toEqual(filledState.ingredients);
    });

    test('добавляет начинку в конец списка и не трогает булку', () => {
      const action = addIngredient(sauce);

      const state = burgerConstructorReducer(
        { bun: filledState.bun, ingredients: [withId(main, 'main-id')] },
        action
      );

      expect(state.bun).toEqual(filledState.bun);
      expect(state.ingredients).toEqual([
        withId(main, 'main-id'),
        { ...sauce, id: action.payload.id },
      ]);
    });

    test('присваивает каждому добавленному ингредиенту уникальный id', () => {
      const first = addIngredient(main);
      const second = addIngredient(main);

      expect(first.payload.id).toBeTruthy();
      expect(first.payload.id).not.toBe(second.payload.id);
    });
  });

  describe('removeIngredient', () => {
    test('удаляет начинку с переданным id', () => {
      const state = burgerConstructorReducer(filledState, removeIngredient('main-id'));

      expect(state.ingredients).toEqual([withId(sauce, 'sauce-id')]);
      expect(state.bun).toEqual(filledState.bun);
    });

    test('не меняет список, если ингредиента с таким id нет', () => {
      const state = burgerConstructorReducer(
        filledState,
        removeIngredient('missing-id')
      );

      expect(state).toEqual(filledState);
    });
  });

  describe('moveIngredient', () => {
    test('сдвигает начинку вниз (offset = 1)', () => {
      const state = burgerConstructorReducer(
        filledState,
        moveIngredient({ index: 0, offset: 1 })
      );

      expect(state.ingredients.map((item) => item.id)).toEqual(['sauce-id', 'main-id']);
    });

    test('сдвигает начинку вверх (offset = -1)', () => {
      const state = burgerConstructorReducer(
        filledState,
        moveIngredient({ index: 1, offset: -1 })
      );

      expect(state.ingredients.map((item) => item.id)).toEqual(['sauce-id', 'main-id']);
    });

    test('не двигает первую начинку выше начала списка', () => {
      const state = burgerConstructorReducer(
        filledState,
        moveIngredient({ index: 0, offset: -1 })
      );

      expect(state.ingredients).toEqual(filledState.ingredients);
    });

    test('не двигает последнюю начинку ниже конца списка', () => {
      const state = burgerConstructorReducer(
        filledState,
        moveIngredient({ index: 1, offset: 1 })
      );

      expect(state.ingredients).toEqual(filledState.ingredients);
    });
  });

  describe('createOrder (асинхронный экшен из orderSlice)', () => {
    const ingredientIds = ['bun-1', 'main-1', 'bun-1'];

    test('pending: конструктор остаётся без изменений', () => {
      const state = burgerConstructorReducer(
        filledState,
        createOrder.pending('requestId', ingredientIds)
      );

      expect(state).toBe(filledState);
    });

    test('rejected: конструктор остаётся без изменений', () => {
      const state = burgerConstructorReducer(
        filledState,
        createOrder.rejected(new Error('Ошибка заказа'), 'requestId', ingredientIds)
      );

      expect(state).toBe(filledState);
    });

    test('fulfilled: конструктор очищается', () => {
      const state = burgerConstructorReducer(
        filledState,
        createOrder.fulfilled(mockOrder, 'requestId', ingredientIds)
      );

      expect(state).toEqual(emptyState);
    });
  });
});
