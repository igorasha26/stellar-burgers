import { selectFeedOrders } from '@slices/feedSlice';
import { selectIngredients } from '@slices/ingredientsSlice';
import { fetchOrderByNumber, selectFetchedOrder } from '@slices/orderDetailsSlice';
import { selectProfileOrders } from '@slices/profileOrdersSlice';
import { Preloader, OrderInfoUI } from '@ui';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useDispatch, useSelector } from '@services/store';

import type { TIngredient } from '@utils-types';

export const OrderInfo = (): React.JSX.Element => {
  const dispatch = useDispatch();
  const { number } = useParams();
  const orderNumber = Number(number);

  const feedOrders = useSelector(selectFeedOrders);
  const profileOrders = useSelector(selectProfileOrders);
  const fetchedOrder = useSelector((state) => selectFetchedOrder(state, orderNumber));
  const ingredients = useSelector(selectIngredients);

  const orderData =
    feedOrders.find((order) => order.number === orderNumber) ??
    profileOrders.find((order) => order.number === orderNumber) ??
    fetchedOrder;

  const isOrderInStore = Boolean(orderData);

  useEffect(() => {
    if (!isOrderInStore) {
      void dispatch(fetchOrderByNumber(orderNumber));
    }
  }, [dispatch, isOrderInStore, orderNumber]);

  /**
   * использование useMemo не обязательно
   */
  /* Готовим данные для отображения */
  const orderInfo = useMemo(() => {
    if (!orderData || !ingredients.length) return null;

    const date = new Date(orderData.createdAt);

    type TIngredientsWithCount = Record<string, TIngredient & { count: number }>;

    const ingredientsInfo = orderData.ingredients.reduce(
      (acc: TIngredientsWithCount, item) => {
        if (!acc[item]) {
          const ingredient = ingredients.find((ing) => ing._id === item);
          if (ingredient) {
            acc[item] = {
              ...ingredient,
              count: 1,
            };
          }
        } else {
          acc[item].count++;
        }

        return acc;
      },
      {}
    );

    const total = Object.values(ingredientsInfo).reduce(
      (acc, item) => acc + item.price * item.count,
      0
    );

    return {
      ...orderData,
      ingredientsInfo,
      date,
      total,
    };
  }, [orderData, ingredients]);

  if (!orderInfo) {
    return <Preloader />;
  }

  return <OrderInfoUI orderInfo={orderInfo} />;
};
